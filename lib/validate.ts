/**
 * F1 — Zod validation helper for API routes.
 * Returns { success: true, data } or { success: false, response } — caller returns response on failure.
 */
import { z } from "zod";
import { NextResponse } from "next/server";

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid request", issues: result.error.issues },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: result.data };
}

// ── Shared schemas ────────────────────────────────────────────────────────────

/** Strip HTML tags and control characters from a string */
export function sanitizeString(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

export const DiagnosticsBodySchema = z.object({
  clusterId:    z.string().min(1).max(128),
  agentVersion: z.string().max(50).optional(),
  osVersion:    z.string().max(100).optional(),
  durationMs:   z.number().int().nonnegative().max(300_000).optional(),
  data:         z.record(z.string(), z.unknown()),
  idempotencyKey: z.string().uuid().optional(), // F16
});

export const RegisterBodySchema = z.object({
  clusterName:  z.string().min(1).max(100),
  endpoint:     z.string().url().max(500).refine(
    (u) => u.startsWith("http://") || u.startsWith("https://"),
    { message: "endpoint must use http or https" }
  ),
  clusterUuid:  z.string().optional(),
  environment:  z.preprocess(
    (v) => (typeof v === "string" ? v.toUpperCase() : v),
    z.enum(["PRODUCTION", "STAGING", "DEVELOPMENT", "CUSTOM"])
  ).default("PRODUCTION"),
  osVersion:    z.string().max(50).optional(),
  agentVersion: z.string().max(50).optional(),
});

export const HeartbeatBodySchema = z.object({
  clusterId:    z.string().min(1).max(128),
  agentVersion: z.string().max(50).optional(),
});
