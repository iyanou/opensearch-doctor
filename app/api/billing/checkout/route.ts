export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getPriceId, APP_URL } from "@/lib/stripe";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(getRateLimitKey(req, `checkout:${session.user.id}`), { windowMs: 60 * 60 * 1000, max: 10 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, string>;
  const selectedPlan = (body.plan ?? "pro").toLowerCase();       // "starter" | "pro" | "scale"
  const billing = body.billing === "annual" ? "annual" : "monthly";

  const priceId = getPriceId(selectedPlan, billing);
  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan or price not configured" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeCustomerId: true, plan: true, subscription: { select: { status: true } } },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Block if already on an active subscription to the same plan
  if (["STARTER", "PRO", "SCALE"].includes(user.plan) && user.subscription?.status === "ACTIVE") {
    return NextResponse.json({ error: "Already subscribed" }, { status: 409 });
  }

  // Ensure Stripe customer exists
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/settings?tab=billing&success=1`,
    cancel_url:  `${APP_URL}/settings?tab=billing`,
    subscription_data: { metadata: { userId: user.id } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
