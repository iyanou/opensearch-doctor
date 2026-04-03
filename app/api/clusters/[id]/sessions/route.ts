export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// F7 — pagination: ?page=1&limit=20
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const cluster = await prisma.cluster.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!cluster) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const [sessions, total] = await Promise.all([
    prisma.diagnosticSession.findMany({
      where: { clusterId: cluster.id },
      orderBy: { startedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true, startedAt: true, completedAt: true,
        healthScore: true, status: true, durationMs: true, agentVersion: true,
        _count: { select: { findings: true } },
      },
    }),
    prisma.diagnosticSession.count({ where: { clusterId: cluster.id } }),
  ]);

  return NextResponse.json({
    data: sessions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
