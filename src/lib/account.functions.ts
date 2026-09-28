import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, type StripeEnv, getStripeErrorMessage } from "@/lib/stripe.server";
import { sendMembershipCancelled, sendTeamNotification } from "@/lib/email.server";

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { displayName?: string | undefined; avatarUrl?: string | null | undefined }) => data,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const update: { display_name?: string; avatar_url?: string | null } = {};
    if (data.displayName !== undefined) update.display_name = data.displayName.trim();
    if (data.avatarUrl !== undefined) update.avatar_url = data.avatarUrl;

    if (Object.keys(update).length === 0) return { ok: true };

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error("Expected FormData");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const file = data.get("file") as File | null;
    if (!file || file.size === 0) throw new Error("No file provided");

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${userId}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

    if (uploadError) throw new Error(uploadError.message);

    const { data: signed, error: signError } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    if (signError) throw new Error(signError.message);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: signed.signedUrl })
      .eq("id", userId);

    if (updateError) throw new Error(updateError.message);

    return { avatarUrl: signed.signedUrl };
  });

export const removeAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => undefined)
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.avatar_url) {
      try {
        const url = new URL(profile.avatar_url);
        const decoded = decodeURIComponent(url.pathname);
        const parts = decoded.split("/");
        const idx = parts.indexOf("avatars");
        const path = idx >= 0 ? parts.slice(idx + 1).join("/") : null;
        if (path) {
          await supabase.storage.from("avatars").remove([path]);
        }
      } catch {
        // If parsing fails, still clear the profile reference.
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(() => undefined)
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: membership } = await supabase
      .from("memberships")
      .select("id, tier, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (!membership) throw new Error("No membership found");
    if (membership.status !== "active") throw new Error("Membership is not active");

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, environment")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sub?.stripe_subscription_id && sub.environment) {
      try {
        const stripe = createStripeClient(sub.environment as StripeEnv);
        await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      } catch (error) {
        console.error("Stripe cancel failed:", error);
        throw new Error(getStripeErrorMessage(error));
      }
    }

    const now = new Date().toISOString();
    const { error: membershipError } = await supabase
      .from("memberships")
      .update({ status: "inactive", expires_at: now })
      .eq("id", membership.id);

    if (membershipError) throw new Error(membershipError.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = userError ? null : (user.user?.email ?? null);
    const tier = membership.tier;

    let notified = false;
    if (email) {
      const member = await sendMembershipCancelled(email, tier);
      const team = await sendTeamNotification("cancelled", email, tier);
      notified = member.sent && team.sent;
    }

    await supabase.from("membership_events").insert({
      user_id: userId,
      email,
      tier,
      event_type: "cancelled",
      details: { source: "member_dashboard" },
      notified,
    });

    return { ok: true };
  });
