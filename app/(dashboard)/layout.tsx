import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { getPlanInfo } from "@/lib/plan";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user!.id! },
    select: { plan: true, trialEndsAt: true },
  });

  const planInfo = user ? getPlanInfo(user) : null;
  const showBanner = planInfo && (planInfo.isTrialActive || planInfo.isTrialExpired);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={session.user ?? {}} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {showBanner && (
          <TrialBanner
            daysLeft={planInfo.trialDaysLeft}
            isExpired={planInfo.isTrialExpired}
          />
        )}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
