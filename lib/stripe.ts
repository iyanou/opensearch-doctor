import Stripe from "stripe";

// Lazy singleton — avoids crash at module load time when key is not yet configured
let _stripe: Stripe | null = null;
function getStripeClient(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}
export const stripe: Stripe = new Proxy({} as Stripe, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(_target, prop: string | symbol) { return (getStripeClient() as any)[prop]; },
});

// ─── Price IDs (set in Railway env vars) ─────────────────────────────────────
export const STRIPE_STARTER_PRICE_ID        = process.env.STRIPE_STARTER_PRICE_ID ?? "";
export const STRIPE_STARTER_ANNUAL_PRICE_ID = process.env.STRIPE_STARTER_ANNUAL_PRICE_ID ?? "";
export const STRIPE_PRO_PRICE_ID            = process.env.STRIPE_PRO_PRICE_ID ?? "";
export const STRIPE_PRO_ANNUAL_PRICE_ID     = process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? "";
export const STRIPE_SCALE_PRICE_ID          = process.env.STRIPE_SCALE_PRICE_ID ?? "";
export const STRIPE_SCALE_ANNUAL_PRICE_ID   = process.env.STRIPE_SCALE_ANNUAL_PRICE_ID ?? "";

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export const APP_URL = process.env.NEXTAUTH_URL ?? (
  process.env.NODE_ENV === "production"
    ? (() => { throw new Error("NEXTAUTH_URL must be set in production"); })()
    : "http://localhost:3000"
);

// ─── Plan ↔ Price ID mapping ──────────────────────────────────────────────────

type PaidPlan = "STARTER" | "PRO" | "SCALE";

/** Returns the Stripe price ID for a given plan + billing cycle. */
export function getPriceId(plan: string, billing: "monthly" | "annual"): string | null {
  if (plan === "starter") {
    return billing === "annual" && STRIPE_STARTER_ANNUAL_PRICE_ID
      ? STRIPE_STARTER_ANNUAL_PRICE_ID
      : STRIPE_STARTER_PRICE_ID || null;
  }
  if (plan === "pro") {
    return billing === "annual" && STRIPE_PRO_ANNUAL_PRICE_ID
      ? STRIPE_PRO_ANNUAL_PRICE_ID
      : STRIPE_PRO_PRICE_ID || null;
  }
  if (plan === "scale") {
    return billing === "annual" && STRIPE_SCALE_ANNUAL_PRICE_ID
      ? STRIPE_SCALE_ANNUAL_PRICE_ID
      : STRIPE_SCALE_PRICE_ID || null;
  }
  return null;
}

/** Maps a Stripe price ID back to a Prisma Plan enum value. */
export function priceIdToPlan(priceId: string): PaidPlan | null {
  const starterIds = [STRIPE_STARTER_PRICE_ID, STRIPE_STARTER_ANNUAL_PRICE_ID].filter(Boolean);
  const proIds     = [STRIPE_PRO_PRICE_ID,     STRIPE_PRO_ANNUAL_PRICE_ID    ].filter(Boolean);
  const scaleIds   = [STRIPE_SCALE_PRICE_ID,   STRIPE_SCALE_ANNUAL_PRICE_ID  ].filter(Boolean);

  if (starterIds.includes(priceId)) return "STARTER";
  if (proIds.includes(priceId))     return "PRO";
  if (scaleIds.includes(priceId))   return "SCALE";
  return null;
}
