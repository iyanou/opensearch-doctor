import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET, priceIdToPlan } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertSubscription(subscription, customerId);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        await upsertSubscription(subscription, customerId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
        if (user) {
          await prisma.subscription.updateMany({
            where: { userId: user.id },
            data: { status: "PAST_DUE" },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function upsertSubscription(sub: Stripe.Subscription, customerId: string) {
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
  if (!user) return;

  const item = sub.items.data[0];
  const priceId = item?.price.id ?? "";
  // In Stripe API >= 2024-09-30, period fields moved to SubscriptionItem
  const periodStart = (item as unknown as { current_period_start?: number })?.current_period_start
    ?? (sub as unknown as { current_period_start?: number })?.current_period_start
    ?? Math.floor(Date.now() / 1000);
  const periodEnd = (item as unknown as { current_period_end?: number })?.current_period_end
    ?? (sub as unknown as { current_period_end?: number })?.current_period_end
    ?? Math.floor(Date.now() / 1000) + 30 * 86400;
  const status = stripeStatusToPrisma(sub.status);
  const isActive = status === "ACTIVE" || status === "TRIALING";
  // Resolve plan from price ID — fall back to PRO for unrecognised prices (backward compat)
  const paidPlan = priceIdToPlan(priceId) ?? "PRO";
  // When subscription is cancelled/inactive, revert to FREE_TRIAL so user can still upgrade
  const plan = isActive ? paidPlan : "FREE_TRIAL";
  const cancelAtPeriodEnd = sub.cancel_at_period_end || (sub.cancel_at !== null && sub.cancel_at !== undefined);

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        status,
        plan: paidPlan,
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
        cancelAtPeriodEnd,
      },
      update: {
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        status,
        plan: isActive ? paidPlan : "FREE_TRIAL",
        currentPeriodStart: new Date(periodStart * 1000),
        currentPeriodEnd: new Date(periodEnd * 1000),
        cancelAtPeriodEnd,
      },
    }),
    prisma.user.update({ where: { id: user.id }, data: { plan } }),
  ]);
}

function stripeStatusToPrisma(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active": return "ACTIVE" as const;
    case "past_due": return "PAST_DUE" as const;
    case "canceled": return "CANCELED" as const;
    case "unpaid": return "UNPAID" as const;
    case "trialing": return "TRIALING" as const;
    default: return "CANCELED" as const;
  }
}
