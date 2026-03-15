export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const cluster = await prisma.cluster.findFirst({ where: { id, userId: session.user.id } });
  if (!cluster) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const latestSession = await prisma.diagnosticSession.findFirst({
    where: { clusterId: cluster.id, status: "COMPLETED" },
    orderBy: { startedAt: "desc" },
    include: { findings: { orderBy: [{ severity: "asc" }, { category: "asc" }] } },
  });

  let nodes: unknown[] = [];
  if (latestSession?.rawData) {
    const raw = latestSession.rawData as { nodes?: { nodes?: unknown[] } };
    nodes = raw?.nodes?.nodes ?? [];
  }

  const now = new Date();
  return NextResponse.json({
    id: cluster.id, name: cluster.name, endpoint: cluster.endpoint,
    environment: cluster.environment, osVersion: cluster.osVersion,
    agentVersion: cluster.agentVersion,
    agentOnline: cluster.lastSeenAt ? now.getTime() - new Date(cluster.lastSeenAt).getTime() < 10 * 60 * 1000 : false,
    lastSeenAt: cluster.lastSeenAt, createdAt: cluster.createdAt,
    latestSession: latestSession ? {
      id: latestSession.id, healthScore: latestSession.healthScore, status: latestSession.status,
      startedAt: latestSession.startedAt, completedAt: latestSession.completedAt,
      durationMs: latestSession.durationMs, findings: latestSession.findings,
    } : null,
    nodes,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.cluster.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
