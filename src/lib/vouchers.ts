/** Shared voucher maths — used on the shop page and re-checked on the server. */

export type VoucherKind = "percent" | "fixed";
export type VoucherScope = "all" | "membership" | "apparel" | "accessories";

export type Voucher = {
  code: string;
  description: string;
  kind: string;
  value: number;
  min_spend_cents: number;
  applies_to: string;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  active: boolean;
};

/** Returns a human message when the voucher cannot be used, otherwise null. */
export function voucherProblem(
  voucher: Voucher,
  scope: VoucherScope,
  subtotalCents: number,
): string | null {
  if (!voucher.active) return "That code is no longer active.";
  if (voucher.expires_at && new Date(voucher.expires_at) < new Date(new Date().toDateString())) {
    return "That code has expired.";
  }
  if (voucher.max_uses !== null && voucher.uses >= voucher.max_uses) {
    return "That code has been used up.";
  }
  if (voucher.applies_to !== "all" && voucher.applies_to !== scope) {
    return `That code only works on ${voucher.applies_to}.`;
  }
  if (subtotalCents < voucher.min_spend_cents) {
    return `That code needs a total of at least €${(voucher.min_spend_cents / 100).toFixed(2)}.`;
  }
  return null;
}

/** Discount in cents, never more than the subtotal. */
export function voucherDiscount(voucher: Voucher, subtotalCents: number): number {
  const raw =
    voucher.kind === "percent"
      ? Math.round((subtotalCents * voucher.value) / 100)
      : voucher.value;
  return Math.max(0, Math.min(subtotalCents, raw));
}

export function voucherLabel(voucher: Voucher): string {
  return voucher.kind === "percent" ? `${voucher.value}% off` : `€${(voucher.value / 100).toFixed(2)} off`;
}
