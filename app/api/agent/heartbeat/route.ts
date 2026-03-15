export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { validateAgentKey } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/agent/heartbeat
 * Body: { clusterId, agentVersion }
 */
export async function POST(req: NextRequest) {
  const auth = await validateAgentKey(req.headers.get("Authorization"));
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await req.json();
  const { clusterId, agentVersion } = body;

  if (!clusterId) {
    return NextResponse.json({ error: "clusterId is required" }, { status: 400 });
  }

  await prisma.cluster.updateMany({
    where: { id: clusterId, userId: auth.user.id },
    data: { lastSeenAt: new Date(), agentVersion },
  });

  return NextResponse.json({ ok: true });
}
