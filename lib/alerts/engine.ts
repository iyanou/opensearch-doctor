/**
 * Alert engine — evaluates AlertRules against the latest analysis result.
 * F4: Alert evaluation wrapped in serializable transaction to prevent race conditions.
 * F5: Notification failures are caught and logged; never abort the diagnostic.
 */
import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import type { AlertRuleKey, AlertRule, AlertEvent } from "@prisma/client";
import { notifyBatch } from "./notify";
import type { AlertContext } from "./types";

export type { AlertContext };

const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function evaluateAlerts(ctx: AlertContext): Promise<void> {
  // F4 — serializable transaction prevents concurrent diagnostics from racing on alert state
  type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;
  await prisma.$transaction(async (tx: TxClient) => {
    const rules = await tx.alertRule.findMany({
      where: { clusterId: ctx.clusterId, enabled: true },
      include: {
        events: {
          where: { status: { in: ["FIRING", "SNOOZED"] } },
          orderBy: { firedAt: "desc" },
          take: 1,
        },
      },
    });

    const channels = await tx.notificationChannel.findMany({
      where: { userId: ctx.userId, enabled: true },
    });

    const newlyFired: Array<{ event: AlertEvent; rule: AlertRule }> = [];
    const newlyResolved: Array<{ event: AlertEvent; rule: AlertRule }> = [];

    for (const rule of rules) {
      const isFiring = evaluateRule(rule.ruleKey, rule.threshold, ctx);
      const existingEvent = rule.events[0] ?? null;
      const alreadyFiring = existingEvent !== null;

      if (isFiring && !alreadyFiring) {
        const lastResolved = await tx.alertEvent.findFirst({
          where: { ruleId: rule.id, status: "RESOLVED" },
          orderBy: { resolvedAt: "desc" },
        });
        const inCooldown = lastResolved?.resolvedAt
          ? Date.now() - new Date(lastResolved.resolvedAt).getTime() < COOLDOWN_MS
          : false;

        if (!inCooldown) {
          const event = await tx.alertEvent.create({
            data: { clusterId: ctx.clusterId, ruleId: rule.id, status: "FIRING" },
          });
          newlyFired.push({ event, rule });
        }
      } else if (!isFiring && alreadyFiring && existingEvent!.status === "FIRING") {
        await tx.alertEvent.update({
          where: { id: existingEvent!.id },
          data: { status: "RESOLVED", resolvedAt: new Date() },
        });
        newlyResolved.push({ event: existingEvent!, rule });
      } else if (existingEvent?.status === "SNOOZED") {
        const snoozedUntil = existingEvent.snoozedUntil;
        if (snoozedUntil && new Date(snoozedUntil) < new Date()) {
          if (isFiring) {
            await tx.alertEvent.update({
              where: { id: existingEvent.id },
              data: { status: "FIRING", snoozedUntil: null },
            });
            newlyFired.push({ event: existingEvent, rule });
          } else {
            await tx.alertEvent.update({
              where: { id: existingEvent.id },
              data: { status: "RESOLVED", resolvedAt: new Date(), snoozedUntil: null },
            });
          }
        }
      }
    }

    // F5 — send notifications outside the tight transaction scope but still catch failures
    if (newlyFired.length > 0 || newlyResolved.length > 0) {
      try {
        await notifyBatch({ newlyFired, newlyResolved, ctx, channels });
      } catch (err) {
        // Notification failure must never fail the diagnostic pipeline
        console.error("[alerts] notification delivery failed:", err);
      }
    }
  }, { isolationLevel: "Serializable" });
}

function evaluateRule(
  ruleKey: AlertRuleKey,
  threshold: number | null,
  ctx: AlertContext
): boolean {
  const { result, payload } = ctx;
  const t = threshold ?? 0;

  switch (ruleKey) {
    case "CLUSTER_STATUS_RED":
      return payload.clusterHealth?.status === "red";

    case "CLUSTER_STATUS_YELLOW":
      return payload.clusterHealth?.status === "yellow";

    case "HEAP_USAGE_HIGH": {
      const nodes = payload.nodes?.nodes ?? [];
      return nodes.some((n: { heapUsedPercent: number }) => n.heapUsedPercent >= (t || 85));
    }

    case "DISK_USAGE_HIGH": {
      const nodes = payload.nodes?.nodes ?? [];
      return nodes.some((n: { diskUsedPercent: number }) => n.diskUsedPercent >= (t || 80));
    }

    case "UNASSIGNED_SHARDS":
      return (payload.shards?.unassignedCount ?? 0) > 0;

    case "NO_RECENT_SNAPSHOT": {
      const snapshots = payload.snapshots;
      if (!snapshots || !snapshots.lastSuccessfulSnapshotAt) return true;
      const age = Date.now() - new Date(snapshots.lastSuccessfulSnapshotAt).getTime();
      return age > 48 * 60 * 60 * 1000;
    }

    case "AGENT_OFFLINE":
      return false; // evaluated externally via cron

    case "HEALTH_SCORE_LOW":
      return result.healthScore < (t || 70);

    default:
      return false;
  }
}
