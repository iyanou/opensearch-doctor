import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPlanInfo, getLimits, getTrialState } from "@/lib/plan";
import { UpgradeNudgeBanner } from "@/components/dashboard/upgrade-nudge-banner";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { ExpiredGateWrapper } from "@/components/dashboard/expired-gate-wrapper";
import { SidebarNoSSR } from "./sidebar-no-ssr";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [user, firingAlertsCount, clusterCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user!.id! },
      select: { plan: true, trialEndsAt: true, name: true, email: true, image: true },
    }),
    prisma.alertEvent.count({
      where: { cluster: { userId: session.user!.id! }, status: { in: ["FIRING", "SNOOZED"] } },
    }),
    prisma.cluster.count({
      where: { userId: session.user!.id!, deletedAt: null },
    }),
  ]);

  const planInfo = user ? getPlanInfo(user) : null;
  const limits   = user ? getLimits(user.plan) : null;
  const trial    = user ? getTrialState(user) : { isOnTrial: false, trialStarted: false, trialExpired: false, daysLeft: 0 };

  // Show cluster limit nudge when at/over limit (not on trial — trial has unlimited clusters)
  const clusterLimit = limits?.maxClusters ?? Infinity;
  const atLimit = !trial.isOnTrial && clusterLimit !== Infinity && clusterCount >= clusterLimit;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SidebarNoSSR
        user={{
          name:  user?.name  ?? session.user?.name,
          email: user?.email ?? session.user?.email,
          image: user?.image ?? session.user?.image,
        }}
        plan={user?.plan ?? null}
        trialDaysLeft={trial.daysLeft}
        firingAlertsCount={firingAlertsCount}
      />
      <div className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">

        {/* Trial banner — shown when trial has started and not yet expired */}
        {trial.trialStarted && !trial.trialExpired && (
          <TrialBanner daysLeft={trial.daysLeft} />
        )}

        {/* Cluster limit nudge — shown on paid plans when near limit */}
        {atLimit && planInfo && !planInfo.isScalePlan && (
          <UpgradeNudgeBanner plan={user!.plan} clusterCount={clusterCount} clusterLimit={clusterLimit} />
        )}

        <main className="flex-1 overflow-y-auto">
          {/* Expired gate — blocks everything except /settings when trial has expired */}
          <ExpiredGateWrapper isExpired={trial.trialExpired}>
            {children}
          </ExpiredGateWrapper>
        </main>
      </div>
    </div>
  );
}
