import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/lib/payments.functions";

interface StripeEmbeddedCheckoutProps {
  priceId: string;
  quantity?: number | undefined;
  customerEmail?: string | undefined;
  userId?: string | undefined;
  returnUrl?: string | undefined;
  tier: string;
  amountCents: number;
}

export function StripeEmbeddedCheckout({
  priceId,
  quantity,
  customerEmail,
  userId,
  returnUrl,
  tier,
  amountCents,
}: StripeEmbeddedCheckoutProps) {
  const fetchClientSecret = async (): Promise<string> => {
    const result = await createCheckoutSession({
      data: {
        priceId,
        quantity,
        customerEmail,
        userId,
        returnUrl: returnUrl || window.location.href,
        environment: getStripeEnvironment(),
        tier,
        amountCents,
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
    return result.clientSecret;
  };

  return (
    <div id="checkout" className="w-full rounded-xl bg-surface-2 p-4 md:p-6">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
