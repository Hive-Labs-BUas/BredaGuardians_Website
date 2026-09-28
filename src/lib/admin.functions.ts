import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }): Promise<void> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Admins only");
}

/** Accounts that are shielded from every staff tool (looked up server-side only). */
async function shieldedIds(admin: any): Promise<Set<string>> {
  const { data: rows } = await admin.from("protected_accounts").select("email");
  const emails = new Set((rows ?? []).map((r: { email: string }) => r.email.toLowerCase()));
  if (emails.size === 0) return new Set();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return new Set(
    (data?.users ?? [])
      .filter((u: { email?: string }) => emails.has((u.email ?? "").toLowerCase()))
      .map((u: { id: string }) => u.id),
  );
}

async function assertNotShielded(admin: any, userId: string) {
  if ((await shieldedIds(admin)).has(userId)) throw new Error("This account cannot be changed.");
}

/** Directory of everyone with an account, with their role and membership tier. */
export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: users }, roles, memberships, profiles] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("memberships").select("user_id, tier, status, expires_at, ended_at"),
      supabaseAdmin.from("profiles").select("id, display_name"),
    ]);

    const roleMap = new Map((roles.data ?? []).map((r) => [r.user_id, r.role]));
    const memberMap = new Map((memberships.data ?? []).map((m) => [m.user_id, m]));
    const nameMap = new Map((profiles.data ?? []).map((p) => [p.id, p.display_name]));

    const hidden = await shieldedIds(supabaseAdmin);
    return (users?.users ?? []).filter((u) => !hidden.has(u.id)).map((user) => {
      const membership = memberMap.get(user.id);
      return {
        id: user.id,
        email: user.email ?? "",
        name: nameMap.get(user.id) ?? "Guardian",
        role: roleMap.get(user.id) ?? "member",
        tier: membership?.tier ?? null,
        status: membership?.status ?? null,
        expiresAt: membership?.expires_at ?? null,
        endedAt: membership?.ended_at ?? null,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
      };
    });
  });

/** Set another account's access level: admin, intern (add/edit), team captain (rosters only) or member. */
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({ userId: z.string().uuid(), role: z.enum(["admin", "intern", "captain", "member"]) })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context as never);
    if (data.userId === context.userId && data.role !== "admin") {
      throw new Error("You cannot remove your own admin access.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertNotShielded(supabaseAdmin, data.userId);

    const { error: clearError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (clearError) throw new Error(clearError.message);

    if (data.role !== "member") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Permanently remove an account and everything tied to it. Admins only. */
export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context as never);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertNotShielded(supabaseAdmin, data.userId);

    // Clear dependent rows first so nothing is left pointing at a missing account.
    await supabaseAdmin.from("shop_requests").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("orders").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("memberships").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("membership_events").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("subscriptions").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Staff = admin or intern. Both may hand out the roster-only team captain role. */
async function assertStaff(context: { supabase: any; userId: string }): Promise<void> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (error || !(roles.includes("admin") || roles.includes("intern"))) throw new Error("Staff only");
}

/** Everyone who currently holds the team captain role. */
export const listCaptains = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: roles }, { data: users }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id").eq("role", "captain"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("profiles").select("id, display_name"),
    ]);

    const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));
    const userMap = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? ""]));

    return (roles ?? []).map((row) => ({
      id: row.user_id,
      email: userMap.get(row.user_id) ?? "",
      name: nameMap.get(row.user_id) ?? "Guardian",
    }));
  });

/** Make the account with this email a team captain. Staff may do this; admins/interns are never touched. */
export const addCaptain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ email: z.string().email() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.email.trim().toLowerCase();
    const { data: users } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const target = (users?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email);
    if (!target) throw new Error("No account found with that email. They need to sign up first.");

    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", target.id);
    const roles = (existing ?? []).map((r) => r.role);
    if (roles.includes("admin") || roles.includes("intern")) {
      throw new Error("That account is already staff, so it keeps its wider access.");
    }
    if (roles.includes("captain")) return { ok: true };

    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: target.id, role: "captain" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Take the captain role away again. Only ever removes 'captain'. */
export const removeCaptain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertStaff(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "captain");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

