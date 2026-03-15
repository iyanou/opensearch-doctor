export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/clusters/[id]/alert-rules
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const cluster = await prisma.cluster.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
  if (!cluster) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rules = await prisma.alertRule.findMany({
    where: { clusterId: cluster.id },
    orderBy: { ruleKey: "asc" },
  });
  return NextResponse.json(rules);
}

// PATCH /api/clusters/[id]/alert-rules — update enabled/threshold for a rule
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const cluster = await prisma.cluster.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
  if (!cluster) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { ruleId, enabled, threshold } = body;

  const rule = await prisma.alertRule.findFirst({ where: { id: ruleId, clusterId: cluster.id } });
  if (!rule) return NextResponse.json({ error: "Rule not found" }, { status: 404 });

  const updated = await prisma.alertRule.update({
    where: { id: ruleId },
    data: {
      ...(enabled !== undefined ? { enabled } : {}),
      ...(threshold !== undefined ? { threshold } : {}),
    },
  });
  return NextResponse.json(updated);
}
