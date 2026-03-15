export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRemediation } from "@/lib/remediation/catalogue";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cluster = await prisma.cluster.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!cluster) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { category, title } = body as { category: string; title: string };

  if (!category || !title) {
    return NextResponse.json({ error: "category and title required" }, { status: 400 });
  }

  // Load latest session findings so getRemediation can make context-aware decisions
  // (e.g. single-node cluster detection)
  const latestSession = await prisma.diagnosticSession.findFirst({
    where: { clusterId: cluster.id, status: "COMPLETED" },
    orderBy: { startedAt: "desc" },
    select: {
      findings: { select: { category: true, title: true } },
    },
  });
  const allFindings = latestSession?.findings ?? [];

  const template = getRemediation(category, title, allFindings);
  if (!template) {
    return NextResponse.json({ error: "No remediation available for this finding" }, { status: 422 });
  }

  // Prevent duplicate pending/running commands for the same fix
  const existing = await prisma.remediationCommand.findFirst({
    where: {
      clusterId: cluster.id,
      commandKey: template.key,
      status: { in: ["PENDING", "RUNNING"] },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "A remediation for this issue is already queued", command: existing }, { status: 409 });
  }

  const command = await prisma.remediationCommand.create({
    data: {
      clusterId: cluster.id,
      findingTitle: title,
      category,
      commandKey: template.key,
      label: template.label,
      method: template.method,
      path: template.path,
      body: template.body,
      triggeredBy: "user",
    },
  });

  return NextResponse.json({ command }, { status: 201 });
}
