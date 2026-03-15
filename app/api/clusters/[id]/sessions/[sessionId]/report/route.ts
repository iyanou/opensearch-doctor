export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "@/lib/pdf/report";
import React from "react";

type NodeStat = {
  name: string; roles: string[];
  heapUsedPercent: number; cpuPercent: number; diskUsedPercent: number;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { id, sessionId } = await params;

  const cluster = await prisma.cluster.findFirst({
    where: { id, userId },
    select: { id: true, name: true, endpoint: true },
  });
  if (!cluster) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const diagSession = await prisma.diagnosticSession.findFirst({
    where: { id: sessionId, clusterId: cluster.id },
    include: {
      findings: { orderBy: [{ severity: "asc" }, { category: "asc" }] },
    },
  });
  if (!diagSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let nodes: NodeStat[] = [];
  if (diagSession.rawData) {
    const raw = diagSession.rawData as { nodes?: { nodes?: NodeStat[] } };
    nodes = raw?.nodes?.nodes ?? [];
  }

  const data = {
    clusterName: cluster.name,
    clusterEndpoint: cluster.endpoint,
    sessionDate: new Date(diagSession.startedAt).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    }),
    agentVersion: diagSession.agentVersion,
    osVersion: diagSession.osVersion,
    durationMs: diagSession.durationMs,
    healthScore: diagSession.healthScore,
    findings: diagSession.findings.map((f) => ({
      severity: f.severity,
      category: f.category,
      title: f.title,
      detail: f.detail,
      recommendation: f.recommendation,
    })),
    nodes,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(ReportDocument, { data }) as any);

  const filename = `report-${cluster.name.replace(/[^a-z0-9]/gi, "-")}-${sessionId.slice(-8)}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
