/**
 * F13 — Centralised CRON_SECRET validation for all cron endpoints.
 * Returns a NextResponse error if unauthorised, null if authorised.
 * Fails loudly (500) if CRON_SECRET env var is missing — prevents silent open access.
 */
import { timingSafeEqual, createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export function validateCronSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron-auth] CRON_SECRET environment variable is not set — rejecting all cron requests");
    return NextResponse.json({ error: "Server misconfiguration: CRON_SECRET not set" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  // Length check first to avoid timing attacks on different-length strings
  if (authHeader.length !== expected.length) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const valid = timingSafeEqual(
    createHash("sha256").update(authHeader).digest(),
    createHash("sha256").update(expected).digest()
  );

  return valid ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
