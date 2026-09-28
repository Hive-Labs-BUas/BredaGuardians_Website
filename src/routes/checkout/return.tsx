import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/Bits";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({
    meta: [
      { title: "Checkout — Breda Guardians" },
      { name: "description", content: "Complete your Breda Guardians membership checkout." },
      { property: "og:title", content: "Checkout — Breda Guardians" },
      { property: "og:description", content: "Complete your Breda Guardians membership checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string | undefined } => ({
    session_id: typeof search["session_id"] === "string" ? search["session_id"] : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id: sessionId } = Route.useSearch();

  return (
    <>
      <PageHeader
        eyebrow="Checkout"
        title={sessionId ? "Welcome To The Guardians" : "Checkout"}
        intro={
          sessionId
            ? "Your payment was successful. Your membership is now active."
            : "No session information found."
        }
      />

      <section className="section-y">
        <div className="container-site flex flex-col items-center text-center">
          {sessionId ? (
            <>
              <div className="surface-card flex size-20 items-center justify-center rounded-full bg-surface-2">
                <CheckCircle2 className="size-10 text-primary" />
              </div>
              <p className="mt-6 max-w-md text-muted-foreground">
                Thanks for supporting the Hive. You can view your membership details and order
                history in your account.
              </p>
              <Button asChild size="lg" className="mt-8">
                <Link to="/account">View Account</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="surface-card flex size-20 items-center justify-center rounded-full bg-surface-2">
                <Loader2 className="size-10 animate-spin text-muted-foreground" />
              </div>
              <p className="mt-6 max-w-md text-muted-foreground">
                We&apos;re waiting for Stripe to confirm your session. If you just completed payment,
                it may take a moment to update.
              </p>
              <Button asChild variant="secondary" size="lg" className="mt-8">
                <Link to="/shop">Back To Shop</Link>
              </Button>
            </>
          )}
        </div>
      </section>
    </>
  );
}
