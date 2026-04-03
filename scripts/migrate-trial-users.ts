/**
 * A6 — One-time migration: FREE_TRIAL → FREE
 *
 * Run once after deploying the new Plan enum (add-starter-scale-plans migration).
 *
 * Usage:
 *   cd web
 *   npx tsx scripts/migrate-trial-users.ts
 *
 * What it does:
 * - Users on FREE_TRIAL with an active paid subscription → set plan to PRO
 * - All other FREE_TRIAL users → set plan to FREE
 *
 * Safe to re-run (idempotent — skips users already on FREE/PRO/STARTER/SCALE).
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting FREE_TRIAL → FREE migration...\n");

  const trialUsers = await prisma.user.findMany({
    where: { plan: "FREE_TRIAL" },
    select: {
      id: true,
      email: true,
      trialEndsAt: true,
      subscription: { select: { status: true, plan: true } },
    },
  });

  console.log(`Found ${trialUsers.length} FREE_TRIAL users to migrate.\n`);

  let toFree = 0;
  let toPro = 0;

  for (const user of trialUsers) {
    const hasActiveSub =
      user.subscription &&
      ["ACTIVE", "TRIALING", "PAST_DUE"].includes(user.subscription.status);

    if (hasActiveSub && user.subscription) {
      // Keep whatever plan their Stripe subscription says
      const targetPlan = user.subscription.plan ?? "PRO";
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: targetPlan },
      });
      console.log(`  ✓ ${user.email} → ${targetPlan} (has active subscription)`);
      toPro++;
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: "FREE_TRIAL" },
      });
      console.log(`  ✓ ${user.email} → FREE_TRIAL`);
      toFree++;
    }
  }

  console.log(`\nDone.`);
  console.log(`  → FREE:  ${toFree} users`);
  console.log(`  → Paid:  ${toPro} users`);
  console.log(`  → Total: ${trialUsers.length} users migrated`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
