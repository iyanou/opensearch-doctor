export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLimits } from "@/lib/plan";

/**
 * GET /api/usage
 * F12: Returns current plan usage stats for the authenticated user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const limits = getLimits(user.plan);

  const [clusterCount, sessionCount, apiKeyCount] = await Promise.all([
    prisma.cluster.count({ where: { userId: session.user.id, deletedAt: null } }),
    prisma.diagnosticSession.count({
      where: { cluster: { userId: session.user.id } },
    }),
    prisma.apiKey.count({
      where: { userId: session.user.id, revokedAt: null },
    }),
  ]);

  return NextResponse.json({
    plan: user.plan,
    limits: {
      maxClusters: limits.maxClusters === Infinity ? null : limits.maxClusters,
      dataRetentionDays: limits.dataRetentionDays,
      alerts: limits.alerts,
      alertChannels: limits.alertChannels,
      pdf: limits.pdf,
      api: limits.api,
    },
    usage: {
      clusters: clusterCount,
      sessions: sessionCount,
      apiKeys: apiKeyCount,
    },
  });
}
