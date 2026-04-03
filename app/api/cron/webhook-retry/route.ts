export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { validateCronSecret } from "@/lib/cron-auth";
import { validateWebhookUrl } from "@/lib/safe-fetch";

const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [0, 60_000, 300_000, 900_000, 3_600_000]; // 0s, 1m, 5m, 15m, 1h

/**
 * GET/POST /api/cron/webhook-retry
 * F3: Retry cron — runs every minute, delivers pending WebhookDelivery records.
 */
export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest) {
  const authError = validateCronSecret(req);
  if (authError) return authError;

  const now = new Date();

  const pending = await prisma.webhookDelivery.findMany({
    where: {
      status: "PENDING",
      nextRetryAt: { lte: now },
    },
    include: {
      cluster: { select: { id: true, name: true, webhookUrl: true, webhookSecret: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  let delivered = 0;
  let failed = 0;

  for (const delivery of pending) {
    const cluster = delivery.cluster;
    if (!cluster?.webhookUrl) {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: { status: "FAILED", lastError: "No webhook URL configured" },
      });
      failed++;
      continue;
    }

    const urlCheck = validateWebhookUrl(cluster.webhookUrl);
    if (!urlCheck.ok) {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: { status: "FAILED", lastError: `Blocked: ${urlCheck.error}` },
      });
      failed++;
      continue;
    }

    const body = JSON.stringify(delivery.payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "OpenSearch-Doctor/1.0",
      "X-OSD-Event": "diagnostic.completed",
      "X-OSD-Delivery-Attempt": String(delivery.attempts + 1),
    };

    if (cluster.webhookSecret) {
      const sig = createHmac("sha256", cluster.webhookSecret).update(body).digest("hex");
      headers["X-OSD-Signature"] = `sha256=${sig}`;
    }

    try {
      const res = await fetch(cluster.webhookUrl, { method: "POST", headers, body, signal: AbortSignal.timeout(10_000) });

      if (res.ok) {
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: { status: "DELIVERED", deliveredAt: new Date(), attempts: delivery.attempts + 1 },
        });
        delivered++;
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      const attempts = delivery.attempts + 1;
      const lastError = err instanceof Error ? err.message : String(err);

      if (attempts >= MAX_ATTEMPTS) {
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: { status: "FAILED", attempts, lastError },
        });
      } else {
        const backoff = BACKOFF_MS[attempts] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
        await prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: { attempts, lastError, nextRetryAt: new Date(Date.now() + backoff) },
        });
      }
      failed++;
    }
  }

  return NextResponse.json({ delivered, failed, processed: pending.length });
}
