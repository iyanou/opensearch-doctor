export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { validateAgentKey } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/agent/commands
 * Agent polls for pending remediation commands.
 * Returns PENDING commands and atomically marks them RUNNING.
 */
export async function GET(req: NextRequest) {
  const auth = await validateAgentKey(req.headers.get("Authorization"));
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!auth.agentKey.clusterId) {
    return NextResponse.json({ commands: [] });
  }

  const commands = await prisma.remediationCommand.findMany({
    where: {
      clusterId: auth.agentKey.clusterId,
      status: "PENDING",
    },
    orderBy: { createdAt: "asc" },
  });

  if (commands.length === 0) {
    return NextResponse.json({ commands: [] });
  }

  // Mark all as RUNNING
  await prisma.remediationCommand.updateMany({
    where: { id: { in: commands.map((c: { id: string }) => c.id) } },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  return NextResponse.json({ commands });
}
