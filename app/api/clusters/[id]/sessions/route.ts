export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const cluster = await prisma.cluster.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
  if (!cluster) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sessions = await prisma.diagnosticSession.findMany({
    where: { clusterId: cluster.id },
    orderBy: { startedAt: "desc" },
    take: 50,
    select: {
      id: true, startedAt: true, completedAt: true,
      healthScore: true, status: true, durationMs: true, agentVersion: true,
      _count: { select: { findings: true } },
    },
  });
  return NextResponse.json(sessions);
}
