export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/alerts/notify";

// Called every 10 minutes by scheduler — checks for agents that went offline
const OFFLINE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  const valid =
    authHeader.length === expected.length &&
    timingSafeEqual(
      createHash("sha256").update(authHeader).digest(),
      createHash("sha256").update(expected).digest()
    );
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const offlineThreshold = new Date(now.getTime() - OFFLINE_THRESHOLD_MS);

  // Find clusters with AGENT_OFFLINE rule enabled that haven't been seen recently
  const clusters = await prisma.cluster.findMany({
    where: {
      lastSeenAt: { lt: offlineThreshold },
      alertRules: {
        some: { ruleKey: "AGENT_OFFLINE", enabled: true },
      },
    },
    include: {
      user: { select: { id: true } },
      alertRules: { where: { ruleKey: "AGENT_OFFLINE" } },
    },
  });

  let fired = 0;
  let resolved = 0;

  for (const cluster of clusters) {
    const rule = cluster.alertRules[0];
    if (!rule) continue;

    const existingFiring = await prisma.alertEvent.findFirst({
      where: { ruleId: rule.id, status: { in: ["FIRING", "SNOOZED"] } },
    });

    if (!existingFiring) {
      const event = await prisma.alertEvent.create({
        data: { clusterId: cluster.id, ruleId: rule.id, status: "FIRING" },
      });

      const channels = await prisma.notificationChannel.findMany({
        where: { userId: cluster.user.id, enabled: true },
      });

      await notify({
        event,
        rule,
        ctx: {
          clusterId: cluster.id,
          userId: cluster.user.id,
          clusterName: cluster.name,
          result: { findings: [], metrics: [], healthScore: 0 },
          payload: {},
        },
        channels,
        transition: "firing",
      }).catch(console.error);
      fired++;
    }
  }

  // Resolve AGENT_OFFLINE events for clusters that are back online
  const onlineClusters = await prisma.cluster.findMany({
    where: { lastSeenAt: { gte: offlineThreshold } },
    include: {
      alertRules: { where: { ruleKey: "AGENT_OFFLINE" } },
    },
  });

  for (const cluster of onlineClusters) {
    const rule = cluster.alertRules[0];
    if (!rule) continue;

    const firingEvent = await prisma.alertEvent.findFirst({
      where: { ruleId: rule.id, status: "FIRING" },
    });

    if (firingEvent) {
      await prisma.alertEvent.update({
        where: { id: firingEvent.id },
        data: { status: "RESOLVED", resolvedAt: now },
      });
      resolved++;
    }
  }

  return NextResponse.json({ fired, resolved });
}
