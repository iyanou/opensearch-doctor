export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // F9 — exclude soft-deleted clusters
  const clusters = await prisma.cluster.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      sessions: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { id: true, healthScore: true, status: true, completedAt: true, startedAt: true },
      },
      _count: { select: { sessions: true } },
    },
  });

  const now = new Date();
  return NextResponse.json(
    clusters.map((c) => ({
      id: c.id,
      name: c.name,
      endpoint: c.endpoint,
      environment: c.environment,
      osVersion: c.osVersion,
      agentVersion: c.agentVersion,
      agentOnline: c.lastSeenAt
        ? now.getTime() - c.lastSeenAt.getTime() < 10 * 60 * 1000  // online if seen < 10m ago
        : false,
      lastSeenAt: c.lastSeenAt,
      createdAt: c.createdAt,
      sessionCount: c._count.sessions,
      latestSession: c.sessions[0] ?? null,
    }))
  );
}
