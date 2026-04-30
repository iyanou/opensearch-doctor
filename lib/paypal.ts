// PayPal Subscriptions API client
// Replaces Stripe. Column names in DB remain "stripeXxx" — they now store PayPal IDs.

const PAYPAL_BASE =
  process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// ─── Plan IDs (set in .env) ───────────────────────────────────────────────────
export const PAYPAL_PLAN_IDS: Record<string, string> = {
  starter: process.env.PAYPAL_STARTER_PLAN_ID ?? "",
  pro:     process.env.PAYPAL_PRO_PLAN_ID     ?? "",
  scale:   process.env.PAYPAL_SCALE_PLAN_ID   ?? "",
};

export const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID ?? "";

export const APP_URL =
  process.env.NEXTAUTH_URL ??
  (process.env.NODE_ENV === "production"
    ? (() => { throw new Error("NEXTAUTH_URL must be set in production"); })()
    : "http://localhost:3000");

// ─── OAuth token (short-lived, no caching needed for low volume) ──────────────
async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret   = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal credentials not configured");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization:  `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body:  "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`PayPal auth failed (${res.status}): ${err}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

// ─── Generic request helper ───────────────────────────────────────────────────
export async function paypalRequest(method: string, path: string, body?: unknown) {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE}${path}`, {
    method,
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept:         "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });

  // 204 No Content — success with no body (e.g. cancel subscription)
  if (res.status === 204) return null;

  if (!res.ok) {
    const err = await res.text().catch(() => res.status.toString());
    throw new Error(`PayPal ${method} ${path} → ${res.status}: ${err}`);
  }

  return res.json();
}

// ─── Plan helpers ─────────────────────────────────────────────────────────────
export function getPlanId(plan: string): string | null {
  return PAYPAL_PLAN_IDS[plan.toLowerCase()] || null;
}

type PaidPlan = "STARTER" | "PRO" | "SCALE";

export function planIdToPlan(planId: string): PaidPlan | null {
  if (planId && planId === PAYPAL_PLAN_IDS.starter) return "STARTER";
  if (planId && planId === PAYPAL_PLAN_IDS.pro)     return "PRO";
  if (planId && planId === PAYPAL_PLAN_IDS.scale)   return "SCALE";
  return null;
}

// ─── Webhook signature verification ──────────────────────────────────────────
export async function verifyWebhookSignature(
  headers: Record<string, string>,
  rawBody: string,
): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    console.warn("PAYPAL_WEBHOOK_ID not set — skipping verification");
    return true; // allow in dev when not configured
  }
  try {
    const result = await paypalRequest("POST", "/v1/notifications/verify-webhook-signature", {
      auth_algo:         headers["paypal-auth-algo"],
      cert_url:          headers["paypal-cert-url"],
      transmission_id:   headers["paypal-transmission-id"],
      transmission_sig:  headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id:        PAYPAL_WEBHOOK_ID,
      webhook_event:     JSON.parse(rawBody),
    });
    return result?.verification_status === "SUCCESS";
  } catch (err) {
    console.error("PayPal webhook verification error:", err);
    return false;
  }
}
