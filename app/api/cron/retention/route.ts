export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLimits } from "@/lib/plan";
import { validateCronSecret } from "@/lib/cron-auth";

// Called by Railway cron — daily at 3 AM UTC
export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest) {
  // F13 — centralized cron auth
  const authError = validateCronSecret(req);
  if (authError) return authError;

  const users = await prisma.user.findMany({
    select: { id: true, plan: true },
  });

  let totalSessionsDeleted = 0;

  for (const user of users) {
    const { dataRetentionDays } = getLimits(user.plan);

    // Skip if retention is 0 or infinite (safety guard — should not happen with new plans)
    if (!dataRetentionDays || dataRetentionDays <= 0) continue;

    const cutoff = new Date(Date.now() - dataRetentionDays * 86_400_000);

    const [{ count }] = await Promise.all([
      // Delete old diagnostic sessions (cascades to findings)
      prisma.diagnosticSession.deleteMany({
        where: {
          cluster: { userId: user.id },
          startedAt: { lt: cutoff },
        },
      }),
      // Delete old metric snapshots
      prisma.metricSnapshot.deleteMany({
        where: {
          cluster: { userId: user.id },
          recordedAt: { lt: cutoff },
        },
      }),
    ]);

    totalSessionsDeleted += count;
  }

  return NextResponse.json({ deleted: totalSessionsDeleted, users: users.length });
}
