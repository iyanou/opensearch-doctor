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

  const { searchParams } = new URL(req.url);
  const daysRaw = parseInt(searchParams.get("days") ?? "7", 10);
  const days = Math.min(isNaN(daysRaw) || daysRaw < 1 ? 7 : daysRaw, 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const metrics = await prisma.metricSnapshot.findMany({
    where: { clusterId: cluster.id, recordedAt: { gte: since } },
    orderBy: { recordedAt: "asc" },
    select: { recordedAt: true, metricKey: true, metricValue: true, nodeId: true },
  });

  const grouped: Record<string, { time: string; value: number; nodeId?: string }[]> = {};
  for (const m of metrics) {
    if (!grouped[m.metricKey]) grouped[m.metricKey] = [];
    grouped[m.metricKey].push({ time: m.recordedAt.toISOString(), value: m.metricValue, nodeId: m.nodeId ?? undefined });
  }
  return NextResponse.json(grouped);
}
