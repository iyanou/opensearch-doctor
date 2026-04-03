export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { validateAgentKey } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";
import { validate, HeartbeatBodySchema } from "@/lib/validate";

/**
 * POST /api/agent/heartbeat
 * F1:  Zod validation
 * F14: Use update (unique) instead of updateMany
 * F15: Agent version compatibility warning
 */
export async function POST(req: NextRequest) {
  const auth = await validateAgentKey(req.headers.get("Authorization"));
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // F1 — Zod validation
  const parsed = validate(HeartbeatBodySchema, await req.json().catch(() => ({})));
  if (!parsed.success) return parsed.response;
  const { clusterId, agentVersion } = parsed.data;

  // F14 — use findFirst + update (unique) instead of updateMany
  const cluster = await prisma.cluster.findFirst({
    where: { id: clusterId, userId: auth.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 });
  }

  await prisma.cluster.update({
    where: { id: cluster.id },
    data: { lastSeenAt: new Date(), ...(agentVersion ? { agentVersion } : {}) },
  });

  // Activate trial on first heartbeat if not already started
  if (auth.user.plan === "FREE_TRIAL" && !auth.user.trialEndsAt) {
    await prisma.user.update({
      where: { id: auth.user.id },
      data: { trialEndsAt: new Date(Date.now() + 14 * 86_400_000) },
    });
  }

  // F15 — agent version compatibility warning
  const minVersion = process.env.MIN_AGENT_VERSION;
  const warning = minVersion && agentVersion && agentVersion < minVersion
    ? `Agent version ${agentVersion} is outdated. Please upgrade to ${minVersion} or later.`
    : undefined;

  return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
}
