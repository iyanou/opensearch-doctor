export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const key = await prisma.apiKey.findFirst({
    where: { id, userId: session.user.id, revokedAt: null },
  });
  if (!key) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });

  // F11 — audit log key revocation
  await auditLog(prisma, {
    userId: session.user.id,
    action: "API_KEY_REVOKED",
    entityId: id,
    entityType: "ApiKey",
    ip: _req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ ok: true });
}
