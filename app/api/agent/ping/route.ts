export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { validateAgentKey } from "@/lib/agent-auth";

/**
 * GET /api/agent/ping
 * Used by the agent --init wizard to validate the API key before writing config.
 */
export async function GET(req: NextRequest) {
  const auth = await validateAgentKey(req.headers.get("Authorization"));
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
