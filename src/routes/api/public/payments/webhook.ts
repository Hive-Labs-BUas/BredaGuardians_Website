import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import type { Database } from "@/integrations/supabase/types";
import {
  sendMembershipWelcome,
  sendMembershipCancelled,
  sendPaymentIssue,
  sendTeamNotification,
} from "@/lib/email.server";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
  }
  return _supabase;
}

function isoFromUnix(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function getUserEmail(userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null;
  const { data } = await getSupabase().auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

async function logEvent(
  eventType: string,
  opts: { userId?: string | null; email?: string | null; tier?: string | null; details?: Record<string, unknown> },
  notified: boolean,
) {
  await getSupabase().from("membership_events").insert({
    user_id: opts.userId ?? null,
    email: opts.email ?? null,
    tier: opts.tier ?? null,
    event_type: eventType,
    details: (opts.details ?? {}) as never,
    notified,
  });
}

/** Access ends straight away — membership is marked inactive immediately. */
async function revokeMembership(userId: string) {
  await getSupabase()
    .from("memberships")
    .update({ status: "inactive", expires_at: new Date().toISOString() })
    .eq("user_id", userId);
}

async function findUserIdBySubscription(subscription: any): Promise<string | null> {
  if (subscription.metadata?.userId) return subscription.metadata.userId as string;
  const { data } = await getSupabase()
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId =
    item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: isoFromUnix(periodStart),
      current_period_end: isoFromUnix(periodEnd),
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId =
    item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase()
    .from("subscriptions")
    .update({
      status: subscription.status,
      product_id: productId,
      price_id: priceId,
      current_period_start: isoFromUnix(periodStart),
      current_period_end: isoFromUnix(periodEnd),
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  const userId = await findUserIdBySubscription(subscription);
  const tier = subscription.items?.data?.[0]?.price?.lookup_key ?? "membership";
  if (!userId) return;

  // Access ends straight away on cancellation.
  await revokeMembership(userId);

  const email = await getUserEmail(userId);
  let notified = false;
  if (email) {
    const member = await sendMembershipCancelled(email, tier);
    const team = await sendTeamNotification("cancelled", email, tier);
    notified = member.sent && team.sent;
  }
  await logEvent("cancelled", { userId, email, tier }, notified);
}

/** Payment failed — access is removed immediately and the member is asked to update their card. */
async function handlePaymentFailure(subscriptionId: string | null, tier: string) {
  if (!subscriptionId) return;
  const { data } = await getSupabase()
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  const userId = data?.user_id;
  if (!userId) return;

  await revokeMembership(userId);

  const email = await getUserEmail(userId);
  let notified = false;
  if (email) {
    const member = await sendPaymentIssue(email, tier);
    const team = await sendTeamNotification("payment_failed", email, tier);
    notified = member.sent && team.sent;
  }
  await logEvent("payment_failed", { userId, email, tier }, notified);
}

async function fulfillMembership(session: any) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;
  const amountCents = session.metadata?.amount_cents ? Number(session.metadata.amount_cents) : null;

  if (!userId || !tier) {
    console.error("Missing userId or tier in checkout session metadata");
    return;
  }

  const now = new Date();
  const expires = new Date(now);
  expires.setFullYear(expires.getFullYear() + 1);

  await getSupabase().from("orders").insert({
    user_id: userId,
    tier,
    amount_cents: amountCents ?? session.amount_total ?? 0,
    status: "paid",
    receipt_url: session.receipt_url ?? null,
  });

  await getSupabase().from("memberships").upsert(
    {
      user_id: userId,
      tier,
      status: "active",
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
    },
    { onConflict: "user_id" },
  );

  const email = session.customer_details?.email ?? (await getUserEmail(userId));
  let notified = false;
  if (email) {
    const member = await sendMembershipWelcome(email, tier);
    const team = await sendTeamNotification("purchase", email, tier);
    notified = member.sent && team.sent;
  }
  await logEvent(
    "purchase",
    { userId, email, tier, details: { amount_cents: amountCents ?? session.amount_total ?? 0 } },
    notified,
  );
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = (await verifyWebhook(req, env)) as {
    type: string;
    data: { object: any };
  };

  switch (event.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object, env);
      break;
    case "customer.subscription.updated": {
      const sub = event.data.object;
      await handleSubscriptionUpdated(sub, env);
      if (["past_due", "unpaid", "incomplete_expired"].includes(sub.status)) {
        await handlePaymentFailure(sub.id, sub.items?.data?.[0]?.price?.lookup_key ?? "membership");
      }
      break;
    }
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status !== "unpaid") {
        await fulfillMembership(session);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded": {
      await fulfillMembership(event.data.object);
      break;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object;
      const userId = session.metadata?.userId ?? null;
      const tier = session.metadata?.tier ?? "membership";
      if (userId) await revokeMembership(userId);
      const email = session.customer_details?.email ?? (await getUserEmail(userId));
      let notified = false;
      if (email) {
        const member = await sendPaymentIssue(email, tier);
        const team = await sendTeamNotification("payment_failed", email, tier);
        notified = member.sent && team.sent;
      }
      await logEvent("payment_failed", { userId, email, tier }, notified);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      await handlePaymentFailure(invoice.subscription ?? null, "membership");
      break;
    }
    case "invoice.paid": {
      console.log("Invoice paid", event.data.object.id);
      break;
    }
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid or missing env query parameter:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
