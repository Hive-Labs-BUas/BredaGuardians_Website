import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  voucherDiscount,
  voucherProblem,
  type Voucher,
  type VoucherScope,
} from "@/lib/vouchers";

async function assertAdmin(context: { supabase: any; userId: string }): Promise<void> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Admins only");
}

/** Looks up a voucher code and returns the discount it gives on this subtotal. */
export async function resolveVoucher(
  client: { from: (table: string) => any },
  code: string,
  scope: VoucherScope,
  subtotalCents: number,
): Promise<{ voucher: Voucher; discountCents: number }> {
  const { data, error } = await client
    .from("shop_vouchers")
    .select("*")
    .ilike("code", code.trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("We don't know that code.");
  const voucher = data as Voucher;
  const problem = voucherProblem(voucher, scope, subtotalCents);
  if (problem) throw new Error(problem);
  return { voucher, discountCents: voucherDiscount(voucher, subtotalCents) };
}

/** Checks a discount code before anything is requested, so the visitor sees the real total. */
export const checkVoucher = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        code: z.string().min(1).max(40),
        scope: z.enum(["all", "membership", "apparel", "accessories"]),
        subtotalCents: z.number().int().min(0).max(1_000_000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { voucher, discountCents } = await resolveVoucher(
      supabaseAdmin as never,
      data.code,
      data.scope as VoucherScope,
      data.subtotalCents,
    );
    return {
      code: voucher.code,
      description: voucher.description,
      kind: voucher.kind,
      value: voucher.value,
      discountCents,
    };
  });

/**
 * A member asks to buy a shop item. Nothing is charged online — the request
 * lands in the admin panel and staff hand the item over once it is paid for at
 * the Hive.
 */
export const requestShopItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        productId: z.string().uuid(),
        size: z.string().max(40).optional(),
        quantity: z.number().int().min(1).max(10).default(1),
        voucherCode: z.string().max(40).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error } = await supabaseAdmin
      .from("shop_products")
      .select("id, name, price_cents, in_stock, visible, category, sizes")
      .eq("id", data.productId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!product || !product.visible) throw new Error("That item is no longer available.");
    if (!product.in_stock) throw new Error("That item is sold out right now.");
    if ((product.sizes ?? []).length > 0 && !data.size?.trim()) {
      throw new Error("Please choose a size first.");
    }

    const subtotal = product.price_cents * data.quantity;
    let discountCents = 0;
    let voucherCode: string | null = null;

    if (data.voucherCode?.trim()) {
      const scope = (product.category === "apparel" ? "apparel" : "accessories") as VoucherScope;
      const resolved = await resolveVoucher(supabaseAdmin as never, data.voucherCode, scope, subtotal);
      discountCents = resolved.discountCents;
      voucherCode = resolved.voucher.code;
      await supabaseAdmin
        .from("shop_vouchers")
        .update({ uses: resolved.voucher.uses + 1 })
        .eq("code", resolved.voucher.code);
    }

    const { error: insertError } = await supabaseAdmin.from("shop_requests").insert({
      user_id: context.userId,
      product_id: product.id,
      product_name: product.name,
      email: context.claims?.email ?? null,
      size: data.size?.trim() || null,
      quantity: data.quantity,
      unit_price_cents: product.price_cents,
      voucher_code: voucherCode,
      discount_cents: discountCents,
      status: "awaiting_payment",
    });
    if (insertError) throw new Error(insertError.message);

    return {
      ok: true,
      product: product.name,
      totalCents: subtotal - discountCents,
      discountCents,
    };
  });

/** Staff move a shop request along: paid and handed over, or cancelled. */
export const setShopRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["awaiting_payment", "paid", "handed_over", "cancelled"]),
        note: z.string().max(2000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("shop_requests")
      .update({
        status: data.status,
        ...(data.note === undefined ? {} : { note: data.note }),
        handled_by: context.userId,
        handled_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
