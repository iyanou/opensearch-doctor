import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SidebarClient } from "@/components/dashboard/sidebar-wrapper";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { ExpiredGateWrapper } from "@/components/dashboard/expired-gate-wrapper";
import { getPlanInfo } from "@/lib/plan";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [user, firingAlertsCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user!.id! },
      select: { plan: true, trialEndsAt: true },
    }),
    prisma.alertEvent.count({
      where: { cluster: { userId: session.user!.id! }, status: { in: ["FIRING", "SNOOZED"] } },
    }),
  ]);

  const planInfo = user ? getPlanInfo(user) : null;
  const showBanner = planInfo?.isTrialActive;
  const isExpiredFree = planInfo?.isFree && !planInfo.isTrialActive;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarClient
        user={session.user ?? {}}
        plan={user?.plan ?? null}
        trialDaysLeft={planInfo?.trialDaysLeft ?? 0}
        firingAlertsCount={firingAlertsCount}
      />
      <div className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        {showBanner && (
          <TrialBanner daysLeft={planInfo!.trialDaysLeft} />
        )}
        <main className="flex-1 overflow-y-auto">
          <ExpiredGateWrapper isExpired={!!isExpiredFree}>
            {children}
          </ExpiredGateWrapper>
        </main>
      </div>
    </div>
  );
}
