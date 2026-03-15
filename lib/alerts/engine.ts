/**
 * Alert engine — evaluates AlertRules against the latest analysis result.
 * Called after every diagnostic run completes.
 *
 * State machine: a rule is FIRING until the condition clears → RESOLVED.
 * Cooldown: won't re-fire within 4 hours of last notification.
 */
import { prisma } from "@/lib/prisma";
import type { AlertRuleKey } from "@prisma/client";
import { notify } from "./notify";
import type { AlertContext } from "./types";

export type { AlertContext };

const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function evaluateAlerts(ctx: AlertContext): Promise<void> {
  const rules = await prisma.alertRule.findMany({
    where: { clusterId: ctx.clusterId, enabled: true },
    include: {
      events: {
        where: { status: { in: ["FIRING", "SNOOZED"] } },
        orderBy: { firedAt: "desc" },
        take: 1,
      },
    },
  });

  const channels = await prisma.notificationChannel.findMany({
    where: { userId: ctx.userId, enabled: true },
  });

  for (const rule of rules) {
    const isFiring = evaluateRule(rule.ruleKey, rule.threshold, ctx);
    const existingEvent = rule.events[0] ?? null;
    const alreadyFiring = existingEvent !== null;

    if (isFiring && !alreadyFiring) {
      // Check cooldown — look at the most recent resolved event
      const lastResolved = await prisma.alertEvent.findFirst({
        where: { ruleId: rule.id, status: "RESOLVED" },
        orderBy: { resolvedAt: "desc" },
      });
      const inCooldown = lastResolved?.resolvedAt
        ? Date.now() - new Date(lastResolved.resolvedAt).getTime() < COOLDOWN_MS
        : false;

      if (!inCooldown) {
        const event = await prisma.alertEvent.create({
          data: { clusterId: ctx.clusterId, ruleId: rule.id, status: "FIRING" },
        });
        await notify({ event, rule, ctx, channels, transition: "firing" });
      }
    } else if (!isFiring && alreadyFiring && existingEvent!.status === "FIRING") {
      await prisma.alertEvent.update({
        where: { id: existingEvent!.id },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      });
      await notify({ event: existingEvent!, rule, ctx, channels, transition: "resolved" });
    }
    // SNOOZED events: check if snooze has expired
    else if (existingEvent?.status === "SNOOZED") {
      const snoozedUntil = existingEvent.snoozedUntil;
      if (snoozedUntil && new Date(snoozedUntil) < new Date()) {
        if (isFiring) {
          // Snooze expired and still firing — update back to FIRING and re-notify
          await prisma.alertEvent.update({
            where: { id: existingEvent.id },
            data: { status: "FIRING", snoozedUntil: null },
          });
          await notify({ event: existingEvent, rule, ctx, channels, transition: "firing" });
        } else {
          await prisma.alertEvent.update({
            where: { id: existingEvent.id },
            data: { status: "RESOLVED", resolvedAt: new Date(), snoozedUntil: null },
          });
        }
      }
    }
  }
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
      return nodes.some((n) => n.heapUsedPercent >= (t || 85));
    }

    case "DISK_USAGE_HIGH": {
      const nodes = payload.nodes?.nodes ?? [];
      return nodes.some((n) => n.diskUsedPercent >= (t || 80));
    }

    case "UNASSIGNED_SHARDS":
      return (payload.shards?.unassignedCount ?? 0) > 0;

    case "NO_RECENT_SNAPSHOT": {
      const snapshots = payload.snapshots;
      if (!snapshots || !snapshots.lastSuccessfulSnapshotAt) return true;
      const age = Date.now() - new Date(snapshots.lastSuccessfulSnapshotAt).getTime();
      return age > 48 * 60 * 60 * 1000; // 48 hours
    }

    case "AGENT_OFFLINE":
      // Evaluated externally via a cron — not during diagnostics run
      return false;

    case "HEALTH_SCORE_LOW":
      return result.healthScore < (t || 70);

    default:
      return false;
  }
}
