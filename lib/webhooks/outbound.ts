/**
 * Outbound webhook delivery — posts diagnostic results to user-configured URL.
 */
import { createHmac } from "crypto";
import type { DiagnosticSession, Finding, Cluster } from "@prisma/client";
import { validateWebhookUrl } from "@/lib/safe-fetch";

export interface WebhookPayload {
  event: "diagnostic.completed";
  clusterId: string;
  clusterName: string;
  sessionId: string;
  healthScore: number | null;
  startedAt: string;
  completedAt: string | null;
  findings: Array<{
    severity: string;
    category: string;
    title: string;
    recommendation: string;
  }>;
  summary: {
    critical: number;
    warning: number;
    info: number;
    ok: number;
  };
}

export async function deliverWebhook(
  cluster: Pick<Cluster, "id" | "name" | "webhookUrl" | "webhookSecret">,
  session: DiagnosticSession & { findings: Finding[] }
): Promise<void> {
  if (!cluster.webhookUrl) return;
  const urlCheck = validateWebhookUrl(cluster.webhookUrl);
  if (!urlCheck.ok) {
    console.warn(`[webhook] Blocked delivery to cluster ${cluster.id}: ${urlCheck.error}`);
    return;
  }

  const findings = session.findings.map((f) => ({
    severity: f.severity,
    category: f.category,
    title: f.title,
    recommendation: f.recommendation,
  }));

  const payload: WebhookPayload = {
    event: "diagnostic.completed",
    clusterId: cluster.id,
    clusterName: cluster.name,
    sessionId: session.id,
    healthScore: session.healthScore,
    startedAt: session.startedAt.toISOString(),
    completedAt: session.completedAt?.toISOString() ?? null,
    findings,
    summary: {
      critical: findings.filter((f) => f.severity === "CRITICAL").length,
      warning: findings.filter((f) => f.severity === "WARNING").length,
      info: findings.filter((f) => f.severity === "INFO").length,
      ok: findings.filter((f) => f.severity === "OK").length,
    },
  };

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "OpenSearch-Doctor/1.0",
    "X-OSD-Event": "diagnostic.completed",
  };

  if (cluster.webhookSecret) {
    const sig = createHmac("sha256", cluster.webhookSecret).update(body).digest("hex");
    headers["X-OSD-Signature"] = `sha256=${sig}`;
  }

  await fetch(cluster.webhookUrl, { method: "POST", headers, body });
}
