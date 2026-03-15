export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/v1-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const userId = await authenticateApiKey(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, sessionId } = await params;

  const cluster = await prisma.cluster.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!cluster) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await prisma.diagnosticSession.findFirst({
    where: { id: sessionId, clusterId: cluster.id },
    include: {
      findings: {
        orderBy: [{ severity: "asc" }, { category: "asc" }],
        select: { severity: true, category: true, title: true, detail: true, recommendation: true },
      },
    },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    data: {
      id: session.id,
      clusterId: session.clusterId,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      healthScore: session.healthScore,
      status: session.status,
      agentVersion: session.agentVersion,
      osVersion: session.osVersion,
      durationMs: session.durationMs,
      findings: session.findings,
    },
  });
}
