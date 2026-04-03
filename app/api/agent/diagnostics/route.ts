export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { validateAgentKey } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { runAnalysis } from "@/lib/analysis/engine";
import { evaluateAlerts } from "@/lib/alerts/engine";
import { deliverWebhookQueued } from "@/lib/webhooks/outbound";
import { rateLimit } from "@/lib/rate-limit";
import { validate, DiagnosticsBodySchema } from "@/lib/validate";

/**
 * POST /api/agent/diagnostics
 * F1: Zod validation + payload size limit (F6)
 * F2: Prisma transaction for atomic writes
 * F16: Idempotency key to prevent duplicate submissions
 */
export async function POST(req: NextRequest) {
  const auth = await validateAgentKey(req.headers.get("Authorization"));
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // F6 — payload size limit (5 MB)
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Payload too large (max 5 MB)" }, { status: 413 });
  }

  // F6 — rate limit: 10 submissions per minute per agent key
  const rl = rateLimit(`diag:${auth.agentKey.id}`, { windowMs: 60 * 1000, max: 10 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded. Agent is submitting too frequently." }, { status: 429 });
  }

  // F1 — Zod validation
  const parsed = validate(DiagnosticsBodySchema, await req.json().catch(() => null));
  if (!parsed.success) return parsed.response;
  const { clusterId, agentVersion, osVersion, durationMs, data, idempotencyKey } = parsed.data;

  // F16 — idempotency: return existing session if already processed
  if (idempotencyKey) {
    const existing = await prisma.diagnosticSession.findUnique({
      where: { idempotencyKey },
      select: { id: true, healthScore: true },
    });
    if (existing) {
      return NextResponse.json({ sessionId: existing.id, healthScore: existing.healthScore, deduplicated: true });
    }
  }

  // Verify cluster belongs to this user and is not soft-deleted
  const cluster = await prisma.cluster.findFirst({
    where: { id: clusterId, userId: auth.user.id, deletedAt: null },
  });
  if (!cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
  }

  // Trial management: activate on first connection, reject if expired
  if (auth.user.plan === "FREE_TRIAL") {
    if (!auth.user.trialEndsAt) {
      // First ever agent connection — start the 14-day trial clock
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { trialEndsAt: new Date(Date.now() + 14 * 86_400_000) },
      });
    } else if (auth.user.trialEndsAt < new Date()) {
      return NextResponse.json(
        { error: "Trial expired. Please upgrade at https://opensearchdoctor.com/settings?tab=billing" },
        { status: 402 }
      );
    }
  }

  // Create session in RUNNING state
  const session = await prisma.diagnosticSession.create({
    data: {
      clusterId,
      agentVersion,
      osVersion,
      durationMs,
      rawData: data as Prisma.InputJsonObject,
      status: "RUNNING",
      idempotencyKey: idempotencyKey ?? null,
    },
  });

  // Run analysis outside the transaction (pure computation)
  let findings, healthScore, metrics;
  try {
    ({ findings, healthScore, metrics } = await runAnalysis(clusterId, data as Parameters<typeof runAnalysis>[1]));
  } catch (err) {
    console.error("[diagnostics] analysis engine crashed:", err);
    await prisma.diagnosticSession.update({ where: { id: session.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }

  // F2 — atomic transaction: all writes succeed or all roll back
  try {
    await prisma.$transaction(async (tx) => {
      await tx.diagnosticSession.update({
        where: { id: session.id },
        data: { status: "COMPLETED", completedAt: new Date(), healthScore },
      });

      if (findings.length > 0) {
        await tx.finding.createMany({
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

      if (metrics.length > 0) {
        await tx.metricSnapshot.createMany({ data: metrics });
      }

      await tx.cluster.update({
        where: { id: clusterId },
        data: { lastSeenAt: new Date(), osVersion, agentVersion },
      });
    });
  } catch (err) {
    console.error("[diagnostics] transaction failed:", err);
    await prisma.diagnosticSession.update({ where: { id: session.id }, data: { status: "FAILED" } }).catch(() => {});
    return NextResponse.json({ error: "Failed to persist diagnostic results" }, { status: 500 });
  }

  // F3 — queue outbound webhook via delivery table (non-blocking)
  if (cluster.webhookUrl) {
    const completedSession = await prisma.diagnosticSession.findUnique({
      where: { id: session.id },
      include: { findings: true },
    });
    if (completedSession) {
      deliverWebhookQueued(cluster, completedSession).catch((err) =>
        console.error("[diagnostics] webhook queue error:", err)
      );
    }
  }

  // Evaluate alert rules — non-blocking, never fail the request
  evaluateAlerts({
    clusterId,
    userId: auth.user.id,
    clusterName: cluster.name,
    result: { findings, metrics, healthScore },
    payload: data as Record<string, unknown>,
  }).catch((err) => console.error("[diagnostics] alert evaluation error:", err));

  // F15 — agent version compatibility warning
  const minVersion = process.env.MIN_AGENT_VERSION;
  const warning = minVersion && agentVersion && agentVersion < minVersion
    ? `Agent version ${agentVersion} is outdated. Please upgrade to ${minVersion} or later.`
    : undefined;

  return NextResponse.json({ sessionId: session.id, healthScore, ...(warning ? { warning } : {}) });
}
