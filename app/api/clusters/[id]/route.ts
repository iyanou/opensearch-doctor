export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  // F9 — filter soft-deleted clusters
  const cluster = await prisma.cluster.findFirst({ where: { id, userId: session.user.id, deletedAt: null } });
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

  // F9 — soft delete: set deletedAt instead of hard delete (30-day recovery window)
  const cluster = await prisma.cluster.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!cluster) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.cluster.update({
    where: { id: cluster.id },
    data: { deletedAt: new Date() },
  });

  // F11 — audit log cluster deletion
  await auditLog(prisma, {
    userId: session.user.id,
    action: "CLUSTER_DELETED",
    entityId: cluster.id,
    entityType: "Cluster",
    ip: req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
