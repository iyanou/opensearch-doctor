import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
export const APP_URL = process.env.NEXTAUTH_URL ?? (
  process.env.NODE_ENV === "production"
    ? (() => { throw new Error("NEXTAUTH_URL must be set in production"); })()
    : "http://localhost:3000"
);
