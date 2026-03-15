export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, sessionId } = await params;
  const cluster = await prisma.cluster.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
  if (!cluster) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const diagSession = await prisma.diagnosticSession.findFirst({
    where: { id: sessionId, clusterId: cluster.id },
    include: { findings: { orderBy: [{ severity: "asc" }, { category: "asc" }] } },
  });
  if (!diagSession) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(diagSession);
}
