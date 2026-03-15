import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/dashboard/page-header";
import { AlertsList } from "@/components/alerts/alerts-list";
import { Bell, CheckCircle2, Flame } from "lucide-react";

export default async function AlertsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [firing, recent] = await Promise.all([
    prisma.alertEvent.findMany({
      where: { cluster: { userId }, status: { in: ["FIRING", "SNOOZED"] } },
      orderBy: { firedAt: "desc" },
      include: {
        rule: { select: { ruleKey: true, threshold: true } },
        cluster: { select: { id: true, name: true } },
      },
    }),
    prisma.alertEvent.findMany({
      where: { cluster: { userId }, status: "RESOLVED" },
      orderBy: { resolvedAt: "desc" },
      take: 20,
      include: {
        rule: { select: { ruleKey: true, threshold: true } },
        cluster: { select: { id: true, name: true } },
      },
    }),
  ]);

  return (
    <div className="min-h-full">
      <PageHeader
        title="Alerts"
        description="Proactive notifications across all your clusters"
      />
      <div className="p-6 max-w-4xl space-y-8">
        {firing.length === 0 && recent.length === 0 ? (
          <AllClearState />
        ) : (
          <>
            {/* Firing section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5 text-red-600" />
                </div>
                <h2 className="text-sm font-bold">Firing & Snoozed</h2>
                {firing.length > 0 && (
                  <span className="ml-1 text-xs font-semibold bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                    {firing.length}
                  </span>
                )}
              </div>
              {firing.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-card px-5 py-6 text-center">
                  <p className="text-sm text-muted-foreground">No active alerts right now</p>
                </div>
              ) : (
                <AlertsList events={firing} />
              )}
            </section>

            {/* Resolved section */}
            {recent.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h2 className="text-sm font-bold text-muted-foreground">Recently resolved</h2>
                  <span className="ml-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {recent.length}
                  </span>
                </div>
                <AlertsList events={recent} muted />
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AllClearState() {
  return (
    <div className="rounded-xl border border-border/60 bg-card py-20 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
        <Bell className="w-6 h-6 text-emerald-600" />
      </div>
      <div>
        <p className="font-bold text-base">All clear</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          No alerts are currently firing. Alerts are triggered automatically after each diagnostic run.
        </p>
      </div>
    </div>
  );
}
