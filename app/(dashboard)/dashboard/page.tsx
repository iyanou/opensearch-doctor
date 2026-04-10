import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { HealthScore } from "@/components/clusters/health-score";
import { AgentStatusBadge } from "@/components/clusters/agent-status-badge";
import { SeverityBadge } from "@/components/clusters/severity-badge";
import { WelcomeWizard } from "@/components/dashboard/welcome-wizard";
import { ConnectClusterButton } from "@/components/dashboard/connect-cluster-button";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "@/lib/format";
import { getLimits } from "@/lib/plan";
import { ServerCrash, TrendingUp, AlertTriangle, Wifi, TrendingDown, Minus, HeartPulse, Plus } from "lucide-react";
import { ClusterDeleteButton } from "@/components/clusters/cluster-delete-button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id!;
  const sp = await searchParams;
  const isFirstVisit = sp.welcome === "1";

  const userPlan = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const planLimits = getLimits(userPlan?.plan ?? "FREE_TRIAL");

  const clusters = await prisma.cluster.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      sessions: {
        where: { status: "COMPLETED" },
        orderBy: { startedAt: "desc" },
        take: 2,
        select: {
          id: true, healthScore: true, startedAt: true,
          findings: { select: { severity: true } },
        },
      },
    },
  });

  const now = new Date();

  type ClusterItem = typeof clusters[number];

  const totalCritical = clusters.reduce((n: number, c: ClusterItem) => {
    const s = c.sessions[0];
    return n + (s?.findings.filter((f: { severity: string }) => f.severity === "CRITICAL").length ?? 0);
  }, 0);

  const agentsOnline = clusters.filter(
    (c: ClusterItem) => c.lastSeenAt && now.getTime() - new Date(c.lastSeenAt).getTime() < 10 * 60 * 1000
  ).length;

  const clustersWithScore = clusters.filter((c: ClusterItem) => c.sessions[0]?.healthScore != null);
  const avgHealthScore = clustersWithScore.length > 0
    ? Math.round(clustersWithScore.reduce((sum: number, c: ClusterItem) => sum + (c.sessions[0]!.healthScore ?? 0), 0) / clustersWithScore.length)
    : null;

  const hasAnyClusters = clusters.length > 0;
  const hasAnySession = clusters.some((c: ClusterItem) => c.sessions.length > 0);
  const showOnboarding = !hasAnyClusters || !hasAnySession;

  return (
    <div className="min-h-full">
      {isFirstVisit && <WelcomeWizard />}

      <PageHeader
        title="Clusters"
        description="Monitor your OpenSearch clusters"
        action={
          <ConnectClusterButton
            atLimit={planLimits.maxClusters !== Infinity && clusters.length >= planLimits.maxClusters}
            currentPlan={userPlan?.plan ?? "FREE"}
            clusterCount={clusters.length}
            clusterLimit={planLimits.maxClusters === Infinity ? 999 : planLimits.maxClusters}
          />
        }
      />

      <div className="p-4 md:p-6">
        {showOnboarding && (
          <OnboardingChecklist hasCluster={hasAnyClusters} hasSession={hasAnySession} />
        )}

        {clusters.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={<TrendingUp className="w-5 h-5 text-primary" />}
                label="Total clusters"
                value={clusters.length}
                bg="bg-primary/10"
              />
              <StatCard
                icon={<Wifi className="w-5 h-5 text-emerald-500" />}
                label="Agents online"
                value={`${agentsOnline} / ${clusters.length}`}
                bg="bg-emerald-50 dark:bg-emerald-500/10"
              />
              <StatCard
                icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
                label="Critical issues"
                value={totalCritical}
                danger={totalCritical > 0}
                bg="bg-red-50 dark:bg-red-500/10"
              />
              <StatCard
                icon={<HeartPulse className="w-5 h-5 text-blue-500" />}
                label="Avg health score"
                value={avgHealthScore ?? "—"}
                bg="bg-blue-50 dark:bg-blue-500/10"
              />
            </div>

            {/* Cluster cards */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {clusters.map((cluster) => {
                const latestSession = cluster.sessions[0] ?? null;
                const prevSession = cluster.sessions[1] ?? null;
                const agentOnline =
                  cluster.lastSeenAt
                    ? now.getTime() - new Date(cluster.lastSeenAt).getTime() < 10 * 60 * 1000
                    : false;
                const critCount = latestSession?.findings.filter((f) => f.severity === "CRITICAL").length ?? 0;
                const warnCount = latestSession?.findings.filter((f) => f.severity === "WARNING").length ?? 0;
                const scoreDiff = (latestSession?.healthScore != null && prevSession?.healthScore != null)
                  ? latestSession.healthScore - prevSession.healthScore
                  : null;

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
                        <div className="flex items-center gap-1.5 shrink-0">
                          {scoreDiff !== null && (
                            <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                              scoreDiff > 0 ? "text-emerald-600" : scoreDiff < 0 ? "text-red-500" : "text-muted-foreground"
                            }`}>
                              {scoreDiff > 0
                                ? <TrendingUp className="w-3 h-3" />
                                : scoreDiff < 0
                                ? <TrendingDown className="w-3 h-3" />
                                : <Minus className="w-3 h-3" />}
                              {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                            </span>
                          )}
                          <HealthScore score={latestSession?.healthScore ?? null} size="sm" />
                          <ClusterDeleteButton clusterId={cluster.id} clusterName={cluster.name} />
                        </div>
                      </div>

                      {/* Status row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <AgentStatusBadge online={agentOnline} lastSeenAt={cluster.lastSeenAt?.toISOString()} />
                        {critCount > 0 && <SeverityBadge severity="CRITICAL" count={critCount} />}
                        {warnCount > 0 && <SeverityBadge severity="WARNING" count={warnCount} />}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-xs text-muted-foreground truncate">
                            {latestSession
                              ? `Last run ${formatDistanceToNow(new Date(latestSession.startedAt))}`
                              : "No diagnostic runs yet"}
                          </p>
                          {cluster.osVersion && (
                            <span className="text-[10px] font-mono text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded shrink-0">
                              OS {cluster.osVersion}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-primary opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity font-medium shrink-0 ml-2">
                          View →
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

function OnboardingChecklist({ hasCluster, hasSession }: { hasCluster: boolean; hasSession: boolean }) {
  const steps = [
    { label: "Create your account", done: true },
    {
      label: "Install the agent & connect a cluster",
      done: hasCluster,
      cta: !hasCluster ? { text: "Generate API key →", href: "/settings?tab=keys" } : undefined,
    },
    {
      label: "First diagnostic run",
      done: hasSession,
      note: !hasSession && hasCluster ? "Waiting — agent runs automatically every 6h" : undefined,
    },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 mb-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Getting started</p>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold ${
              step.done
                ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600"
                : "bg-muted border border-border/60 text-muted-foreground"
            }`}>
              {step.done ? "✓" : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${step.done ? "line-through text-muted-foreground" : ""}`}>
                {step.label}
              </span>
              {step.note && (
                <p className="text-xs text-muted-foreground mt-0.5">{step.note}</p>
              )}
              {step.cta && (
                <Link href={step.cta.href} className="text-xs font-semibold text-primary hover:underline mt-0.5 block">
                  {step.cta.text}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
