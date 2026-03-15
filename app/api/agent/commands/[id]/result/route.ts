export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { validateAgentKey } from "@/lib/agent-auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/agent/commands/:id/result
 * Agent reports the result of executing a remediation command.
 * Body: { success: boolean, result?: string, error?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateAgentKey(req.headers.get("Authorization"));
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as { success: boolean; result?: string; error?: string };

  const command = await prisma.remediationCommand.findFirst({
    where: { id, clusterId: auth.agentKey.clusterId ?? "" },
  });
  if (!command) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.remediationCommand.update({
    where: { id },
    data: {
      status: body.success ? "COMPLETED" : "FAILED",
      completedAt: new Date(),
      result: body.result,
      error: body.error,
    },
  });

  return NextResponse.json({ ok: true });
}
