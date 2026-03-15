export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { validateAgentKey } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { canAddCluster } from "@/lib/plan";

/**
 * POST /api/agent/register
 * Called by the agent on first startup to register or re-identify its cluster.
 * Body: { clusterName, endpoint, environment, osVersion, agentVersion }
 * Returns: { clusterId }
 */
export async function POST(req: NextRequest) {
  try {
  const auth = await validateAgentKey(req.headers.get("Authorization"));
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await req.json();
  const { clusterName, endpoint, environment, osVersion, agentVersion, clusterUuid } = body;

  if (!clusterName || !endpoint) {
    return NextResponse.json(
      { error: "clusterName and endpoint are required" },
      { status: 400 }
    );
  }

  // Check if cluster already registered for this user + endpoint
  let cluster = await prisma.cluster.findFirst({
    where: { userId: auth.user.id, endpoint },
  });

  if (cluster) {
    // Update agent/OS version and last seen
    cluster = await prisma.cluster.update({
      where: { id: cluster.id },
      data: {
        name: clusterName,
        environment: (environment?.toUpperCase() as "PRODUCTION" | "STAGING" | "DEVELOPMENT" | "CUSTOM") ?? cluster.environment,
        osVersion: osVersion ?? cluster.osVersion,
        agentVersion: agentVersion ?? cluster.agentVersion,
        clusterUuid: clusterUuid ?? cluster.clusterUuid,
        lastSeenAt: new Date(),
      },
    });
  } else {
    // Trial abuse check: if this physical cluster (by UUID) was previously used under
    // a different account whose free trial has expired, block re-registration.
    if (clusterUuid) {
      const now = new Date();
      const priorExpiredCluster = await prisma.cluster.findFirst({
        where: {
          clusterUuid,
          userId: { not: auth.user.id },
          user: {
            OR: [
              { plan: "FREE" },
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
              "This OpenSearch cluster was previously registered under a different account whose free trial has expired. " +
              "Please upgrade the original account to Pro to continue using OpenSearch Doctor with this cluster.",
          },
          { status: 403 }
        );
      }
    }

    // Enforce plan cluster limit before creating
    const user = await prisma.user.findUnique({ where: { id: auth.user.id }, select: { plan: true } });
    const clusterCount = await prisma.cluster.count({ where: { userId: auth.user.id } });
    if (user && !canAddCluster(user.plan, clusterCount)) {
      return NextResponse.json(
        { error: "Cluster limit reached for your plan. Upgrade to Pro for unlimited clusters." },
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

    // Create default alert rules for new cluster
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

  // Bind this agent key to the cluster
  if (!auth.agentKey.clusterId) {
    await prisma.agentKey.update({
      where: { id: auth.agentKey.id },
      data: { clusterId: cluster.id },
    });
  }

  return NextResponse.json({ clusterId: cluster.id });
  } catch (e) {
    console.error("[register] unhandled error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
