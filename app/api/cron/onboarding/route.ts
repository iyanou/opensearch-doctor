export const dynamic = "force-dynamic";

/**
 * Onboarding email cron — run daily at 8:00 AM UTC.
 * Sends the right email to each FREE_TRIAL user based on how many days
 * have passed since signup and whether they've connected an agent.
 *
 * Email 2 — STUCK_SETUP   Day 2  if no diagnostic session yet
 * Email 3 — EDUCATION     Day 5  if at least 1 diagnostic session exists
 * Email 4 — TRIAL_ENDING  Day 10 if still on FREE_TRIAL
 * Email 5 — LAST_CHANCE   Day 13 if still on FREE_TRIAL
 *
 * Email 1 (WELCOME) is sent instantly via the NextAuth createUser event in auth.ts.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCronSecret } from "@/lib/cron-auth";
import { sendOnboardingEmail } from "@/lib/email/onboarding";

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  const authError = validateCronSecret(req);
  if (authError) return authError;

  const now   = new Date();
  const stats = { stuck_setup: 0, education: 0, trial_ending: 0, last_chance: 0, skipped: 0 };

  // Only process FREE_TRIAL users created within the last 15 days
  const cutoff = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

  const users = await prisma.user.findMany({
    where: {
      plan:      "FREE_TRIAL",
      createdAt: { gte: cutoff },
      email:     { not: undefined },
    },
    select: {
      id:        true,
      email:     true,
      name:      true,
      createdAt: true,
      clusters:  {
        select: {
          sessions: {
            select: { id: true },
            take:   1,
          },
        },
        where: { deletedAt: null },
        take: 1,
      },
    },
  });

  for (const user of users) {
    const daysOld    = Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const hasSession = user.clusters.some((c) => c.sessions.length > 0);

    // Day 2 — no agent connected yet
    if (daysOld >= 2 && daysOld < 5 && !hasSession) {
      const sent = await sendOnboardingEmail(user.id, user.email!, user.name, "STUCK_SETUP");
      if (sent) stats.stuck_setup++;
      else stats.skipped++;
      continue;
    }

    // Day 5 — agent is running, teach them what to look for
    if (daysOld >= 5 && daysOld < 10 && hasSession) {
      const sent = await sendOnboardingEmail(user.id, user.email!, user.name, "EDUCATION");
      if (sent) stats.education++;
      else stats.skipped++;
      continue;
    }

    // Day 10 — trial ending warning
    if (daysOld >= 10 && daysOld < 13) {
      const sent = await sendOnboardingEmail(user.id, user.email!, user.name, "TRIAL_ENDING");
      if (sent) stats.trial_ending++;
      else stats.skipped++;
      continue;
    }

    // Day 13 — last chance
    if (daysOld >= 13 && daysOld <= 14) {
      const sent = await sendOnboardingEmail(user.id, user.email!, user.name, "LAST_CHANCE");
      if (sent) stats.last_chance++;
      else stats.skipped++;
      continue;
    }
  }

  console.log("[cron/onboarding]", stats);
  return NextResponse.json({ ok: true, ...stats });
}
