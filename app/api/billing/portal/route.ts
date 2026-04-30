// POST /api/billing/portal — redirect to PayPal autopay management
// DELETE /api/billing/portal — cancel subscription via PayPal API
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { paypalRequest } from "@/lib/paypal";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // PayPal doesn't have a hosted customer portal like Stripe.
  // We redirect users to their PayPal autopay management page.
  return NextResponse.json({ url: "https://www.paypal.com/myaccount/autopay/" });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { subscription: { select: { stripeSubscriptionId: true } } },
  });

  const subscriptionId = user?.subscription?.stripeSubscriptionId;
  if (!subscriptionId) {
    return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
  }

  try {
    await paypalRequest("POST", `/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      reason: "Customer requested cancellation",
    });

    await prisma.subscription.update({
      where: { userId: session.user.id },
      data:  { cancelAtPeriodEnd: true },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Cancel subscription error:", err);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
