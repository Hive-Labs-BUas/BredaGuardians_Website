import { useState, useCallback } from "react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";

interface CheckoutOptions {
  priceId: string;
  quantity?: number | undefined;
  customerEmail?: string | undefined;
  userId?: string | undefined;
  returnUrl?: string | undefined;
  tier: string;
  amountCents: number;
}

export function useStripeCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);

  const openCheckout = useCallback((opts: CheckoutOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  const checkoutElement = isOpen && options ? <StripeEmbeddedCheckout {...options} /> : null;

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}
