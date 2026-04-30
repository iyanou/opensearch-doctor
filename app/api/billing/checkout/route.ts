export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { paypalRequest, getPlanId, APP_URL } from "@/lib/paypal";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(getRateLimitKey(req, `checkout:${session.user.id}`), {
    windowMs: 60 * 60 * 1000,
    max: 10,
  });
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

  const body = await req.json().catch(() => ({})) as Record<string, string>;
  const selectedPlan = (body.plan ?? "pro").toLowerCase(); // "starter" | "pro" | "scale"

  const planId = getPlanId(selectedPlan);
  if (!planId) {
    return NextResponse.json({ error: "Invalid plan or PayPal plan ID not configured" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      subscription: { select: { status: true, stripeSubscriptionId: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Block only if already on this exact plan and active
  if (user.plan === selectedPlan.toUpperCase() && user.subscription?.status === "ACTIVE") {
    return NextResponse.json({ error: "Already subscribed to this plan" }, { status: 409 });
  }

  // Cancel existing PayPal subscription before upgrading/downgrading
  const existingSubId = user.subscription?.stripeSubscriptionId;
  if (existingSubId && user.subscription?.status === "ACTIVE") {
    try {
      await paypalRequest("POST", `/v1/billing/subscriptions/${existingSubId}/cancel`, {
        reason: "Switching to a different plan",
      });
    } catch (err) {
      console.error("Failed to cancel existing subscription before upgrade:", err);
      // Continue anyway — PayPal may have already cancelled it
    }
  }

  // Create PayPal subscription
  const nameParts  = (user.name ?? "").split(" ");
  const givenName  = nameParts[0] ?? "";
  const surname    = nameParts.slice(1).join(" ") || givenName;

  const subscription = await paypalRequest("POST", "/v1/billing/subscriptions", {
    plan_id: planId,
    subscriber: {
      name:          { given_name: givenName, surname },
      email_address: user.email,
    },
    application_context: {
      brand_name:          "OpenSearch Doctor",
      locale:              "en-US",
      shipping_preference: "NO_SHIPPING",
      user_action:         "SUBSCRIBE_NOW",
      payment_method: {
        payer_selected:   "PAYPAL",
        payee_preferred:  "IMMEDIATE_PAYMENT_REQUIRED",
      },
      return_url: `${APP_URL}/api/billing/activate`,
      cancel_url: `${APP_URL}/settings?tab=billing`,
    },
  });

  const approvalUrl = (subscription?.links as { rel: string; href: string }[] | undefined)
    ?.find((l) => l.rel === "approve")?.href;

  if (!approvalUrl) {
    return NextResponse.json({ error: "Failed to create PayPal subscription" }, { status: 500 });
  }

  return NextResponse.json({ url: approvalUrl });
}
