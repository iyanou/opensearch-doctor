export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { LIMITS } from "@/lib/plan";

// Called by Railway cron or external scheduler — daily
// Protect with a shared secret to prevent public triggering
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  const valid =
    authHeader.length === expected.length &&
    timingSafeEqual(
      createHash("sha256").update(authHeader).digest(),
      createHash("sha256").update(expected).digest()
    );
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, plan: true },
  });

  let totalDeleted = 0;

  for (const user of users) {
    const retentionDays = LIMITS[user.plan].dataRetentionDays;
    const cutoff = new Date(Date.now() - retentionDays * 86_400_000);

    // Delete old diagnostic sessions (cascades to findings)
    const { count } = await prisma.diagnosticSession.deleteMany({
      where: {
        cluster: { userId: user.id },
        startedAt: { lt: cutoff },
      },
    });

    // Delete old metric snapshots
    await prisma.metricSnapshot.deleteMany({
      where: {
        cluster: { userId: user.id },
        recordedAt: { lt: cutoff },
      },
    });

    totalDeleted += count;
  }

  return NextResponse.json({ deleted: totalDeleted, users: users.length });
}
