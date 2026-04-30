// GET /api/billing/activate?subscription_id=xxx
// PayPal redirects here after user approves subscription.
// We verify with PayPal, update the DB, then redirect to settings.

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { paypalRequest, planIdToPlan, APP_URL } from "@/lib/paypal";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subscriptionId   = searchParams.get("subscription_id");

  if (!subscriptionId) {
    return NextResponse.redirect(`${APP_URL}/settings?tab=billing&error=missing_subscription`);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(`${APP_URL}/login`);
  }

  try {
    // Verify subscription with PayPal
    const sub = await paypalRequest("GET", `/v1/billing/subscriptions/${subscriptionId}`);

    if (!sub || !["ACTIVE", "APPROVAL_PENDING"].includes(sub.status as string)) {
      console.error("PayPal subscription not active:", sub?.status);
      return NextResponse.redirect(`${APP_URL}/settings?tab=billing&error=subscription_not_active`);
    }

    const planId   = sub.plan_id as string;
    const paidPlan = planIdToPlan(planId) ?? "PRO";
    const now      = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.subscription.upsert({
        where:  { userId: session.user.id },
        create: {
          userId:               session.user.id,
          stripeSubscriptionId: subscriptionId, // stores PayPal subscription ID
          stripePriceId:        planId,          // stores PayPal plan ID
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
          currentPeriodStart:   now,
          currentPeriodEnd:     periodEnd,
          cancelAtPeriodEnd:    false,
        },
      }),
      prisma.user.update({ where: { id: session.user.id }, data: { plan: paidPlan } }),
    ]);

    return NextResponse.redirect(`${APP_URL}/settings?tab=billing&success=1`);
  } catch (err) {
    console.error("PayPal activate error:", err);
    return NextResponse.redirect(`${APP_URL}/settings?tab=billing&error=activation_failed`);
  }
}
