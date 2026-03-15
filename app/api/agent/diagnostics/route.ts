export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { validateAgentKey } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { runAnalysis } from "@/lib/analysis/engine";
import { evaluateAlerts } from "@/lib/alerts/engine";
import { deliverWebhook } from "@/lib/webhooks/outbound";

/**
 * POST /api/agent/diagnostics
 * Body: { clusterId, agentVersion, osVersion, collectedAt, durationMs, data: { ... } }
 */
export async function POST(req: NextRequest) {
  const auth = await validateAgentKey(req.headers.get("Authorization"));
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await req.json();
  const { clusterId, agentVersion, osVersion, durationMs, data } = body;

  if (!clusterId || !data) {
    return NextResponse.json(
      { error: "clusterId and data are required" },
      { status: 400 }
    );
  }

  // Verify cluster belongs to user
  const cluster = await prisma.cluster.findFirst({
    where: { id: clusterId, userId: auth.user.id },
  });
  if (!cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
  }

  // Create diagnostic session
  const session = await prisma.diagnosticSession.create({
    data: {
      clusterId,
      agentVersion,
      osVersion,
      durationMs,
      rawData: data,
      status: "RUNNING",
    },
  });

  // Run analysis engine (synchronous for now)
  const { findings, healthScore, metrics } = await runAnalysis(clusterId, data);

  // Persist findings
  if (findings.length > 0) {
    await prisma.finding.createMany({
      data: findings.map((f) => ({
        sessionId: session.id,
        category: f.category,
        severity: f.severity,
        title: f.title,
        detail: f.detail,
        recommendation: f.recommendation,
        docUrl: f.docUrl ?? null,
        metadata: f.metadata != null ? (f.metadata as Prisma.InputJsonObject) : Prisma.JsonNull,
      })),
    });
  }

  // Persist metric snapshots for charting
  if (metrics.length > 0) {
    await prisma.metricSnapshot.createMany({ data: metrics });
  }

  // Mark session complete
  await prisma.diagnosticSession.update({
    where: { id: session.id },
    data: { status: "COMPLETED", completedAt: new Date(), healthScore },
  });

  // Update cluster metadata
  await prisma.cluster.update({
    where: { id: clusterId },
    data: { lastSeenAt: new Date(), osVersion, agentVersion },
  });

  // Deliver outbound webhook if configured — non-blocking
  if (cluster.webhookUrl) {
    const completedSession = await prisma.diagnosticSession.findUnique({
      where: { id: session.id },
      include: { findings: true },
    });
    if (completedSession) {
      deliverWebhook(cluster, completedSession).catch((err) =>
        console.error("Outbound webhook delivery error:", err)
      );
    }
  }

  // Evaluate alert rules (fire & resolve) — non-blocking, don't fail the request
  evaluateAlerts({
    clusterId,
    userId: auth.user.id,
    clusterName: cluster.name,
    result: { findings, metrics, healthScore },
    payload: data,
  }).catch((err) => console.error("Alert evaluation error:", err));

  return NextResponse.json({ sessionId: session.id, healthScore });
}
