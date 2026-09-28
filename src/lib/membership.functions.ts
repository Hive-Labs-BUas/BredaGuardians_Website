import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MEMBERSHIP_TIERS } from "@/lib/site-data";

const TIER_IDS = MEMBERSHIP_TIERS.map((tier) => tier.id);

function tierOrThrow(id: string) {
  const tier = MEMBERSHIP_TIERS.find((t) => t.id === id);
  if (!tier) throw new Error("Unknown membership tier");
  return tier;
}

function addMonths(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

async function assertAdmin(context: { supabase: any; userId: string }): Promise<void> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Admins only");
}

/**
 * A member asks for a membership. Nothing is charged online — the request lands
 * in the admin panel as "awaiting payment" and staff confirm it once the member
 * has paid in person at the Hive.
 */
export const requestMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        tier: z.enum(TIER_IDS as [string, ...string[]]),
        voucherCode: z.string().max(40).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const tier = tierOrThrow(data.tier);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    let discountCents = 0;
    let voucherCode: string | null = null;
    if (data.voucherCode?.trim()) {
      const { resolveVoucher } = await import("@/lib/shop.functions");
      const resolved = await resolveVoucher(
        supabaseAdmin as never,
        data.voucherCode,
        "membership",
        tier.priceCents,
      );
      discountCents = resolved.discountCents;
      voucherCode = resolved.voucher.code;
      await supabaseAdmin
        .from("shop_vouchers")
        .update({ uses: resolved.voucher.uses + 1 })
        .eq("code", resolved.voucher.code);
    }

    const { data: existing } = await supabaseAdmin
      .from("memberships")
      .select("id, status, tier")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing?.status === "active") {
      throw new Error("You already have an active membership. Contact the team to change tiers.");
    }

    if (existing) {
      const { error } = await supabaseAdmin
        .from("memberships")
        .update({
          tier: tier.id,
          status: "awaiting_payment",
          started_at: new Date().toISOString(),
          expires_at: null,
          voucher_code: voucherCode,
          discount_cents: discountCents,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("memberships")
        .insert({
          user_id: userId,
          tier: tier.id,
          status: "awaiting_payment",
          voucher_code: voucherCode,
          discount_cents: discountCents,
        });
      if (error) throw new Error(error.message);
    }

    await supabaseAdmin.from("membership_events").insert({
      user_id: userId,
      email: context.claims?.email ?? null,
      tier: tier.id,
      event_type: "membership_requested",
      details: {
        amount_cents: tier.priceCents - discountCents,
        payment: "in_person",
        months: tier.months,
        ...(voucherCode ? { voucher_code: voucherCode, discount_cents: discountCents } : {}),
      },
    });

    return { ok: true, tier: tier.id, discountCents, totalCents: tier.priceCents - discountCents };
  });

/** Staff mark a membership request as paid (in person) or back to awaiting payment. */
export const setMembershipPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ userId: z.string().uuid(), paid: z.boolean(), email: z.string().optional() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: membership, error: readError } = await supabaseAdmin
      .from("memberships")
      .select("id, tier")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!membership) throw new Error("No membership request for this account");

    const tier = tierOrThrow(membership.tier);

    const { error } = await supabaseAdmin
      .from("memberships")
      .update(
        data.paid
          ? { status: "active", started_at: new Date().toISOString(), expires_at: addMonths(tier.months) }
          : { status: "awaiting_payment", expires_at: null },
      )
      .eq("id", membership.id);
    if (error) throw new Error(error.message);

    if (data.paid) {
      await supabaseAdmin.from("orders").insert({
        user_id: data.userId,
        tier: tier.id,
        amount_cents: tier.priceCents,
        status: "paid_in_person",
      });
    }

    await supabaseAdmin.from("membership_events").insert({
      user_id: data.userId,
      email: data.email ?? null,
      tier: tier.id,
      event_type: data.paid ? "payment_confirmed_in_person" : "payment_marked_unpaid",
      details: { by: context.userId },
    });

    return { ok: true };
  });

/** Staff end (revoke) a membership. History is kept: status becomes "ended". */
export const endMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ userId: z.string().uuid(), email: z.string().optional() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: membership, error: readError } = await supabaseAdmin
      .from("memberships")
      .select("id, tier, status")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!membership) throw new Error("No membership for this account");

    const { error } = await supabaseAdmin
      .from("memberships")
      .update({ status: "ended", ended_at: new Date().toISOString(), ended_by: context.userId })
      .eq("id", membership.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("membership_events").insert({
      user_id: data.userId,
      email: data.email ?? null,
      tier: membership.tier,
      event_type: "membership_ended_by_staff",
      details: { by: context.userId, previous_status: membership.status },
    });

    return { ok: true };
  });
