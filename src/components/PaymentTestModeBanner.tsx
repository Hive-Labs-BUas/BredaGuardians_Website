const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"];

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-red-900/40 bg-red-950/60 px-4 py-2 text-center text-sm text-red-200">
        Production checkout is not configured. Complete payments go-live in your Lovable project
        to accept real payments.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-primary/20 bg-primary/10 px-4 py-2 text-center text-sm text-primary-foreground">
        All payments made in the preview are in test mode. No real money is charged.
      </div>
    );
  }
  return null;
}
