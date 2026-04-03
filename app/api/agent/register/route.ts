export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { validateAgentKey } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { canAddCluster, getLimits } from "@/lib/plan";
import { validate, RegisterBodySchema, sanitizeString } from "@/lib/validate";

/**
 * POST /api/agent/register
 * F1: Zod validation + XSS sanitization on clusterName
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await validateAgentKey(req.headers.get("Authorization"));
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // F1 — Zod validation
    const parsed = validate(RegisterBodySchema, await req.json().catch(() => null));
    if (!parsed.success) return parsed.response;

    const {
      clusterName: rawName,
      endpoint,
      environment,
      osVersion,
      agentVersion,
      clusterUuid,
    } = parsed.data;

    // F1 — sanitize clusterName to strip any HTML/XSS
    const clusterName = sanitizeString(rawName);

    // Check if cluster already registered for this user + endpoint (active only)
    let cluster = await prisma.cluster.findFirst({
      where: { userId: auth.user.id, endpoint, deletedAt: null },
    });

    if (cluster) {
      // Update agent/OS version and last seen
      cluster = await prisma.cluster.update({
        where: { id: cluster.id },
        data: {
          name: clusterName,
          environment: (environment?.toUpperCase() as "PRODUCTION" | "STAGING" | "DEVELOPMENT" | "CUSTOM") ?? cluster.environment,
          osVersion:    osVersion    ?? cluster.osVersion,
          agentVersion: agentVersion ?? cluster.agentVersion,
          clusterUuid:  clusterUuid  ?? cluster.clusterUuid,
          lastSeenAt: new Date(),
        },
      });
    } else {
      // Trial abuse check
      if (clusterUuid) {
        const now = new Date();
        const priorExpiredCluster = await prisma.cluster.findFirst({
          where: {
            clusterUuid,
            userId: { not: auth.user.id },
            user: {
              OR: [
                { plan: "FREE_TRIAL", trialEndsAt: { lte: now } },
              ],
            },
          },
          select: { id: true },
        });
        if (priorExpiredCluster) {
          return NextResponse.json(
            {
              error:
                "This OpenSearch cluster was previously registered under a different account. " +
                "Please upgrade the original account to continue.",
            },
            { status: 403 }
          );
        }
      }

      // Enforce plan cluster limit
      const user = await prisma.user.findUnique({ where: { id: auth.user.id }, select: { plan: true } });
      const clusterCount = await prisma.cluster.count({ where: { userId: auth.user.id, deletedAt: null } });
      if (user && !canAddCluster(user.plan, clusterCount)) {
        return NextResponse.json(
          { error: "Cluster limit reached for your plan. Upgrade to add more clusters." },
          { status: 403 }
        );
      }

      // Create new cluster
      cluster = await prisma.cluster.create({
        data: {
          userId: auth.user.id,
          name: clusterName,
          endpoint,
          clusterUuid: clusterUuid ?? null,
          environment: (environment?.toUpperCase() ?? "PRODUCTION") as "PRODUCTION" | "STAGING" | "DEVELOPMENT" | "CUSTOM",
          osVersion,
          agentVersion,
          lastSeenAt: new Date(),
        },
      });

      // Create default alert rules only for plans that support alerts
      if (user && getLimits(user.plan).alerts) {
        await prisma.alertRule.createMany({
          data: [
            { clusterId: cluster.id, ruleKey: "CLUSTER_STATUS_RED" },
            { clusterId: cluster.id, ruleKey: "CLUSTER_STATUS_YELLOW" },
            { clusterId: cluster.id, ruleKey: "HEAP_USAGE_HIGH", threshold: 85 },
            { clusterId: cluster.id, ruleKey: "DISK_USAGE_HIGH", threshold: 80 },
            { clusterId: cluster.id, ruleKey: "UNASSIGNED_SHARDS" },
            { clusterId: cluster.id, ruleKey: "NO_RECENT_SNAPSHOT" },
            { clusterId: cluster.id, ruleKey: "AGENT_OFFLINE" },
            { clusterId: cluster.id, ruleKey: "HEALTH_SCORE_LOW", threshold: 70 },
          ],
        });
      }
    }

    // Bind this agent key to the cluster
    if (!auth.agentKey.clusterId) {
      await prisma.agentKey.update({
        where: { id: auth.agentKey.id },
        data: { clusterId: cluster.id },
      });
    }

    // F15 — agent version compatibility warning
    const minVersion = process.env.MIN_AGENT_VERSION;
    const warning = minVersion && agentVersion && agentVersion < minVersion
      ? `Agent version ${agentVersion} is outdated. Please upgrade to ${minVersion} or later.`
      : undefined;

    return NextResponse.json({ clusterId: cluster.id, ...(warning ? { warning } : {}) });
  } catch (e) {
    console.error("[register] unhandled error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
