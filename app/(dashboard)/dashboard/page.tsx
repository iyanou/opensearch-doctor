import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { HealthScore } from "@/components/clusters/health-score";
import { AgentStatusBadge } from "@/components/clusters/agent-status-badge";
import { SeverityBadge } from "@/components/clusters/severity-badge";
import { WelcomeWizard } from "@/components/dashboard/welcome-wizard";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "@/lib/format";
import { Plus, ServerCrash, TrendingUp, AlertTriangle, Wifi } from "lucide-react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id!;
  const sp = await searchParams;
  const isFirstVisit = sp.welcome === "1";

  const clusters = await prisma.cluster.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      sessions: {
        where: { status: "COMPLETED" },
        orderBy: { startedAt: "desc" },
        take: 1,
        select: {
          id: true, healthScore: true, startedAt: true,
          findings: { select: { severity: true } },
        },
      },
    },
  });

  const now = new Date();

  const totalCritical = clusters.reduce((n, c) => {
    const s = c.sessions[0];
    return n + (s?.findings.filter((f) => f.severity === "CRITICAL").length ?? 0);
  }, 0);

  const agentsOnline = clusters.filter(
    (c) => c.lastSeenAt && now.getTime() - new Date(c.lastSeenAt).getTime() < 10 * 60 * 1000
  ).length;

  return (
    <div className="min-h-full">
      {isFirstVisit && <WelcomeWizard />}

      <PageHeader
        title="Clusters"
        description="Monitor your OpenSearch clusters"
        action={
          <Link href="/settings?tab=keys">
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Connect cluster
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        {clusters.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
                label="Total clusters"
                value={clusters.length}
                bg="bg-primary/10"
              />
              <StatCard
                icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
                label="Critical issues"
                value={totalCritical}
                danger={totalCritical > 0}
                bg="bg-red-50 dark:bg-red-500/10"
              />
              <StatCard
                icon={<Wifi className="w-5 h-5 text-emerald-500" />}
                label="Agents online"
                value={`${agentsOnline} / ${clusters.length}`}
                bg="bg-emerald-50 dark:bg-emerald-500/10"
              />
            </div>

            {/* Cluster cards */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {clusters.map((cluster) => {
                const latestSession = cluster.sessions[0] ?? null;
                const agentOnline =
                  cluster.lastSeenAt
                    ? now.getTime() - new Date(cluster.lastSeenAt).getTime() < 10 * 60 * 1000
                    : false;
                const critCount = latestSession?.findings.filter((f) => f.severity === "CRITICAL").length ?? 0;
                const warnCount = latestSession?.findings.filter((f) => f.severity === "WARNING").length ?? 0;

                return (
                  <Link key={cluster.id} href={`/clusters/${cluster.id}`}>
                    <div className={`group relative rounded-xl border border-border/60 bg-card p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer h-full flex flex-col gap-4 ${
                      critCount > 0 ? "border-l-4 border-l-red-500" : ""
                    }`}>
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-sm truncate">{cluster.name}</h3>
                            <EnvironmentBadge env={cluster.environment} />
                          </div>
                          <p className="text-xs text-muted-foreground truncate font-mono">{cluster.endpoint}</p>
                        </div>
                        <HealthScore score={latestSession?.healthScore ?? null} size="sm" />
                      </div>

                      {/* Status row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <AgentStatusBadge online={agentOnline} lastSeenAt={cluster.lastSeenAt?.toISOString()} />
                        {critCount > 0 && <SeverityBadge severity="CRITICAL" count={critCount} />}
                        {warnCount > 0 && <SeverityBadge severity="WARNING" count={warnCount} />}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
                        <p className="text-xs text-muted-foreground">
                          {latestSession
                            ? `Last run ${formatDistanceToNow(new Date(latestSession.startedAt))}`
                            : "No diagnostic runs yet"}
                        </p>
                        <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                          View details →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, danger, bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  danger?: boolean;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3.5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 leading-none ${danger ? "text-red-600" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function EnvironmentBadge({ env }: { env: string }) {
  const styles: Record<string, string> = {
    PRODUCTION: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    STAGING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    DEVELOPMENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    CUSTOM: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };
  return (
    <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide ${styles[env] ?? "bg-muted text-muted-foreground"}`}>
      {env.toLowerCase()}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5 border border-border/60">
        <ServerCrash className="w-7 h-7 text-muted-foreground" />
      </div>
      <h2 className="font-bold text-lg mb-2">No clusters connected</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
        Install the agent on your server, generate an API key, and your first cluster will appear here automatically.
      </p>
      <Link href="/settings">
        <Button className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Connect your first cluster
        </Button>
      </Link>
    </div>
  );
}
