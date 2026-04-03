/**
 * F11 — Audit log helper.
 * Call in any mutation endpoint to record who did what and when.
 */
import type { PrismaClient } from "@prisma/client";

interface AuditParams {
  userId: string;
  action: string;        // e.g. "cluster.delete", "alert_rule.update", "api_key.revoke"
  entityId?: string;     // ID of the affected resource
  entityType?: string;   // "Cluster", "AlertRule", "ApiKey", etc.
  meta?: Record<string, unknown>;
  ip?: string | null;
}

export async function auditLog(
  prisma: PrismaClient,
  params: AuditParams
): Promise<void> {
  try {
    await (prisma as any).auditLog.create({
      data: {
        userId:     params.userId,
        action:     params.action,
        entityId:   params.entityId ?? null,
        entityType: params.entityType ?? null,
        meta:       params.meta ?? {},
        ip:         params.ip ?? null,
      },
    });
  } catch (err) {
    // Audit log failure must never break the main request
    console.error("[audit] Failed to write audit log:", err);
  }
}
