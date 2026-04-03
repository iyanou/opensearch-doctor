export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/onboarding-status
 * E6 — Onboarding wizard polls this to detect when the first agent connects.
 * Returns { connected: true, clusterId, clusterName } when any cluster has sent
 * a heartbeat in the last 15 minutes.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const cluster = await prisma.cluster.findFirst({
    where: {
      userId: session.user.id,
      deletedAt: null,
      lastSeenAt: { gte: fifteenMinutesAgo },
    },
    select: { id: true, name: true, lastSeenAt: true },
    orderBy: { lastSeenAt: "desc" },
  });

  if (cluster) {
    return NextResponse.json({ connected: true, clusterId: cluster.id, clusterName: cluster.name });
  }

  return NextResponse.json({ connected: false });
}
