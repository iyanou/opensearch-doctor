// PayPal webhook handler
// Replaces /api/webhooks/stripe
// Configure in PayPal Developer Dashboard → Webhooks → Add endpoint:
//   URL: https://opensearchdoctor.com/api/webhooks/paypal
//   Events: BILLING.SUBSCRIPTION.*, PAYMENT.SALE.*

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, planIdToPlan } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  const body = await req.text();

  // Collect PayPal signature headers
  const sigHeaders: Record<string, string> = {};
  for (const key of [
    "paypal-auth-algo",
    "paypal-cert-url",
    "paypal-transmission-id",
    "paypal-transmission-sig",
    "paypal-transmission-time",
  ]) {
    const val = req.headers.get(key);
    if (val) sigHeaders[key] = val;
  }

  const isValid = await verifyWebhookSignature(sigHeaders, body);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: { event_type: string; resource: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const resource       = event.resource;
    const subscriptionId = (resource.id ?? resource.billing_agreement_id) as string | undefined;

    switch (event.event_type) {
      // ── Subscription activated (new or re-activated) ──────────────────────
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.RE-ACTIVATED": {
        if (!subscriptionId) break;
        const planId   = resource.plan_id as string;
        const paidPlan = planIdToPlan(planId) ?? "PRO";
        const userId   = await getUserIdBySubscription(subscriptionId);
        if (!userId) break;

        const now       = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await prisma.$transaction([
          prisma.subscription.upsert({
            where:  { userId },
            create: {
              userId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId:        planId,
              status:               "ACTIVE",
              plan:                 paidPlan,
              currentPeriodStart:   now,
              currentPeriodEnd:     periodEnd,
              cancelAtPeriodEnd:    false,
            },
            update: {
              stripeSubscriptionId: subscriptionId,
              stripePriceId:        planId,
              status:               "ACTIVE",
              plan:                 paidPlan,
              cancelAtPeriodEnd:    false,
            },
          }),
          prisma.user.update({ where: { id: userId }, data: { plan: paidPlan } }),
        ]);
        break;
      }

      // ── Subscription cancelled or expired ─────────────────────────────────
      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        if (!subscriptionId) break;
        const userId = await getUserIdBySubscription(subscriptionId);
        if (!userId) break;

        await prisma.$transaction([
          prisma.subscription.updateMany({
            where: { userId, stripeSubscriptionId: subscriptionId },
            data:  { status: "CANCELED", cancelAtPeriodEnd: false },
          }),
          prisma.user.update({ where: { id: userId }, data: { plan: "FREE_TRIAL" } }),
        ]);
        break;
      }

      // ── Payment failed / subscription suspended ───────────────────────────
      case "BILLING.SUBSCRIPTION.SUSPENDED":
      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED":
      case "PAYMENT.SALE.DENIED": {
        if (!subscriptionId) break;
        const userId = await getUserIdBySubscription(subscriptionId);
        if (!userId) break;

        await prisma.subscription.updateMany({
          where: { userId, stripeSubscriptionId: subscriptionId },
          data:  { status: "PAST_DUE" },
        });
        break;
      }

      // ── Successful renewal payment — refresh period end ───────────────────
      case "PAYMENT.SALE.COMPLETED": {
        // resource here is a sale object; billing_agreement_id is the subscription ID
        const subId = resource.billing_agreement_id as string | undefined;
        if (!subId) break;
        const userId = await getUserIdBySubscription(subId);
        if (!userId) break;

        const now       = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await prisma.subscription.updateMany({
          where: { userId, stripeSubscriptionId: subId },
          data:  { currentPeriodStart: now, currentPeriodEnd: periodEnd, status: "ACTIVE" },
        });
        break;
      }
    }
  } catch (err) {
    console.error("PayPal webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function getUserIdBySubscription(subscriptionId: string): Promise<string | null> {
  const sub = await prisma.subscription.findUnique({
    where:  { stripeSubscriptionId: subscriptionId },
    select: { userId: true },
  });
  return sub?.userId ?? null;
}
