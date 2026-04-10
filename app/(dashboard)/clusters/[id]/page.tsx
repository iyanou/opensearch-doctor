import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { HealthScore } from "@/components/clusters/health-score";
import { AgentStatusBadge } from "@/components/clusters/agent-status-badge";
import { FindingsList } from "@/components/clusters/findings-list";
import { NodesTable } from "@/components/clusters/nodes-table";
import { IndicesTable } from "@/components/clusters/indices-table";
import { ShardsPanel } from "@/components/clusters/shards-panel";
import { SessionHistory } from "@/components/clusters/session-history";
import { MetricsCharts } from "@/components/clusters/metrics-chart";
import { RemediationLog } from "@/components/clusters/remediation-log";
import { AlertRulesPanel } from "@/components/clusters/alert-rules-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow, formatDuration } from "@/lib/format";

export default async function ClusterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;

  const cluster = await prisma.cluster.findFirst({ where: { id, userId } });
  if (!cluster) notFound();

  const latestSession = await prisma.diagnosticSession.findFirst({
    where: { clusterId: cluster.id, status: "COMPLETED" },
    orderBy: { startedAt: "desc" },
    include: {
      findings: { orderBy: [{ severity: "asc" }, { category: "asc" }] },
    },
  });

  const recentSessions = await prisma.diagnosticSession.findMany({
    where: { clusterId: cluster.id },
    orderBy: { startedAt: "desc" },
    take: 5,
    select: {
      id: true, startedAt: true, healthScore: true,
      status: true, durationMs: true,
      _count: { select: { findings: true } },
    },
  });

  const alertRules = await prisma.alertRule.findMany({
    where: { clusterId: cluster.id },
    orderBy: { ruleKey: "asc" },
  });

  const recentRemediations = await prisma.remediationCommand.findMany({
    where: { clusterId: cluster.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const now = new Date();
  const agentOnline = cluster.lastSeenAt
    ? now.getTime() - new Date(cluster.lastSeenAt).getTime() < 10 * 60 * 1000
    : false;

  type NodeStat = {
    id: string; name: string; roles: string[];
    heapUsedPercent: number; cpuPercent: number; diskUsedPercent: number;
    diskTotalBytes: number; diskAvailableBytes: number; uptimeMs: number;
  };
  type IndexRow = {
    name: string; health: "green" | "yellow" | "red"; status: "open" | "close";
    primaryShards: number; replicas: number; docsCount: number;
    storeSizeBytes: number; isReadOnly: boolean;
  };
  type ShardsInfo = {
    unassignedCount: number; unassignedReasons: Record<string, number>;
    shardCountPerNode: Record<string, number>; avgShardSizeBytes: number;
  };

  let nodes: NodeStat[] = [];
  let indices: IndexRow[] = [];
  let shards: ShardsInfo | null = null;

  if (latestSession?.rawData) {
    const raw = latestSession.rawData as Record<string, unknown>;
    nodes = (raw?.nodes as { nodes?: NodeStat[] })?.nodes ?? [];
    indices = (raw?.indices as { indices?: IndexRow[] })?.indices ?? [];
    shards = (raw?.shards as ShardsInfo) ?? null;
  }

  const critCount = latestSession?.findings.filter((f: { severity: string }) => f.severity === "CRITICAL").length ?? 0;
  const warnCount = latestSession?.findings.filter((f: { severity: string }) => f.severity === "WARNING").length ?? 0;
  const infoCount = latestSession?.findings.filter((f: { severity: string }) => f.severity === "INFO").length ?? 0;
  const okCount = latestSession?.findings.filter((f: { severity: string }) => f.severity === "OK").length ?? 0;

  const envStyles: Record<string, string> = {
    PRODUCTION: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    STAGING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    DEVELOPMENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    CUSTOM: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <div className="min-h-full">
      <PageHeader
        title={cluster.name}
        description={cluster.endpoint}
        action={
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> All clusters
            </Button>
          </Link>
        }
      />

      <div className="p-4 md:p-6 space-y-6 max-w-7xl">

        {/* ── Overview row ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* Health Score card */}
          <div className="rounded-xl border border-border/60 bg-card p-5 flex flex-col items-center justify-center gap-2 min-h-[120px]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Health Score</p>
            <HealthScore score={latestSession?.healthScore ?? null} size="md" />
          </div>

          {/* Status & meta card */}
          <div className="md:col-span-3 rounded-xl border border-border/60 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <AgentStatusBadge online={agentOnline} lastSeenAt={cluster.lastSeenAt?.toISOString()} />
                <span className={`text-xs px-2 py-0.5 rounded-md font-semibold uppercase ${envStyles[cluster.environment] ?? "bg-muted text-muted-foreground"}`}>
                  {cluster.environment.toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {cluster.osVersion && (
                  <Badge variant="outline" className="text-xs font-mono">OS {cluster.osVersion}</Badge>
                )}
                {cluster.agentVersion && (
                  <Badge variant="outline" className="text-xs font-mono">Agent {cluster.agentVersion}</Badge>
                )}
              </div>
            </div>

            {/* Finding counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FindingStatPill
                icon={<AlertCircle className="w-3.5 h-3.5" />}
                label="Critical"
                count={critCount}
                color={critCount > 0 ? "text-red-600 bg-red-50 dark:bg-red-500/10" : "text-muted-foreground bg-muted/50"}
              />
              <FindingStatPill
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
                label="Warnings"
                count={warnCount}
                color={warnCount > 0 ? "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10" : "text-muted-foreground bg-muted/50"}
              />
              <FindingStatPill
                icon={<Info className="w-3.5 h-3.5" />}
                label="Info"
                count={infoCount}
                color="text-blue-600 bg-blue-50 dark:bg-blue-500/10"
              />
              <FindingStatPill
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                label="OK"
                count={okCount}
                color="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
              />
            </div>

            {latestSession && (
              <div className="flex items-center gap-4 pt-1 border-t border-border/40 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Last run {formatDistanceToNow(new Date(latestSession.startedAt))}
                </div>
                {latestSession.durationMs && (
                  <span>· Took {formatDuration(latestSession.durationMs)}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Metrics ──────────────────────────────────────────── */}
        <MetricsCharts clusterId={cluster.id} />

        {/* ── Findings ─────────────────────────────────────────── */}
        {latestSession ? (
          <FindingsList findings={latestSession.findings} clusterId={cluster.id} />
        ) : (
          <NoRunYet agentOnline={agentOnline} />
        )}

        {/* ── Shards / Nodes / Indices ──────────────────────────── */}
        {shards && <ShardsPanel shards={shards} />}
        {nodes.length > 0 && <NodesTable nodes={nodes} />}
        {indices.length > 0 && <IndicesTable indices={indices} />}

        {/* ── Remediation log + Session history ────────────────── */}
        <RemediationLog initialCommands={recentRemediations.map(r => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          completedAt: r.completedAt?.toISOString() ?? null,
        }))} />

        {recentSessions.length > 0 && (
          <SessionHistory sessions={recentSessions} clusterId={cluster.id} />
        )}

        {/* ── Alert Rules ───────────────────────────────────────── */}
        {alertRules.length > 0 && (
          <AlertRulesPanel
            clusterId={cluster.id}
            initialRules={alertRules.map((r) => ({
              id: r.id,
              ruleKey: r.ruleKey,
              enabled: r.enabled,
              threshold: r.threshold,
            }))}
          />
        )}
      </div>
    </div>
  );
}

function FindingStatPill({
  icon, label, count, color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className={`rounded-lg px-3 py-2.5 flex items-center gap-2 ${color}`}>
      {icon}
      <div>
        <p className="text-xs font-medium leading-none">{label}</p>
        <p className="text-xl font-bold mt-0.5 leading-none">{count}</p>
      </div>
    </div>
  );
}

function NoRunYet({ agentOnline }: { agentOnline: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-muted mx-auto flex items-center justify-center mb-4">
        <Clock className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="font-semibold mb-1">No diagnostic data yet</p>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
        {agentOnline
          ? "Agent is online — waiting for the first diagnostic run."
          : "Install and start the agent to begin collecting diagnostics."}
      </p>
      {!agentOnline && (
        <Link href="/settings?tab=keys" className="text-primary text-sm font-medium hover:underline underline-offset-4">
          Get your API key →
        </Link>
      )}
    </div>
  );
}
