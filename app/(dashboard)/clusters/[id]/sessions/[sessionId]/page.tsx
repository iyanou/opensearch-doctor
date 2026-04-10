import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { HealthScore } from "@/components/clusters/health-score";
import { FindingsList } from "@/components/clusters/findings-list";
import { NodesTable } from "@/components/clusters/nodes-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Download, Clock, Tag, Gauge } from "lucide-react";
import { formatDuration } from "@/lib/format";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id, sessionId } = await params;

  const cluster = await prisma.cluster.findFirst({
    where: { id, userId },
    select: { id: true, name: true, endpoint: true },
  });
  if (!cluster) notFound();

  const diagSession = await prisma.diagnosticSession.findFirst({
    where: { id: sessionId, clusterId: cluster.id },
    include: {
      findings: { orderBy: [{ severity: "asc" }, { category: "asc" }] },
    },
  });
  if (!diagSession) notFound();

  type NodeStat = {
    id: string; name: string; roles: string[];
    heapUsedPercent: number; cpuPercent: number; diskUsedPercent: number;
    diskTotalBytes: number; diskAvailableBytes: number; uptimeMs: number;
  };
  let nodes: NodeStat[] = [];
  if (diagSession.rawData) {
    const raw = diagSession.rawData as { nodes?: { nodes?: NodeStat[] } };
    nodes = raw?.nodes?.nodes ?? [];
  }

  const critCount = diagSession.findings.filter((f: { severity: string }) => f.severity === "CRITICAL").length;
  const warnCount = diagSession.findings.filter((f: { severity: string }) => f.severity === "WARNING").length;
  const infoCount = diagSession.findings.filter((f: { severity: string }) => f.severity === "INFO").length;
  const okCount   = diagSession.findings.filter((f: { severity: string }) => f.severity === "OK").length;

  const startedAt = new Date(diagSession.startedAt);

  return (
    <div>
      <PageHeader
        title={`Session — ${startedAt.toLocaleString()}`}
        description={`${cluster.name} · ${cluster.endpoint}`}
        action={
          <div className="flex items-center gap-2">
            <a href={`/api/clusters/${cluster.id}/sessions/${sessionId}/report`} download>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1.5" /> Download PDF
              </Button>
            </a>
            <Link href={`/clusters/${cluster.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* Summary row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Score card */}
          <div className="rounded-xl border border-border/60 bg-card p-5 flex flex-col items-center justify-center gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Health Score</p>
            <HealthScore score={diagSession.healthScore ?? null} size="lg" />
          </div>

          {/* Meta + counts */}
          <div className="md:col-span-3 rounded-xl border border-border/60 bg-card p-5 space-y-4">
            {/* Status + badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {diagSession.status === "COMPLETED" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 uppercase tracking-wide">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                </span>
              )}
              {diagSession.status === "FAILED" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 uppercase tracking-wide">
                  <XCircle className="w-3.5 h-3.5" /> Failed
                </span>
              )}
              {diagSession.status === "RUNNING" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 uppercase tracking-wide">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running
                </span>
              )}
              {diagSession.durationMs && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border/60">
                  <Clock className="w-3 h-3" /> {formatDuration(diagSession.durationMs)}
                </span>
              )}
              {diagSession.agentVersion && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border/60">
                  <Tag className="w-3 h-3" /> Agent {diagSession.agentVersion}
                </span>
              )}
              {diagSession.osVersion && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border/60">
                  <Gauge className="w-3 h-3" /> OS {diagSession.osVersion}
                </span>
              )}
            </div>

            {/* Finding counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FindingCountCard label="Critical" value={critCount} color="red" />
              <FindingCountCard label="Warnings" value={warnCount} color="yellow" />
              <FindingCountCard label="Info" value={infoCount} color="blue" />
              <FindingCountCard label="OK" value={okCount} color="green" />
            </div>
          </div>
        </div>

        {/* Findings */}
        {diagSession.findings.length > 0 ? (
          <FindingsList findings={diagSession.findings} />
        ) : (
          <div className="rounded-xl border border-border/60 bg-card py-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-emerald-600">No findings — cluster looked healthy</p>
          </div>
        )}

        {/* Nodes */}
        {nodes.length > 0 && <NodesTable nodes={nodes} />}
      </div>
    </div>
  );
}

function FindingCountCard({
  label, value, color,
}: {
  label: string; value: number; color: "red" | "yellow" | "blue" | "green";
}) {
  const styles = {
    red:    { bg: "bg-red-50 dark:bg-red-500/10",     text: value > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground" },
    yellow: { bg: "bg-yellow-50 dark:bg-yellow-500/10", text: value > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground" },
    blue:   { bg: "bg-blue-50 dark:bg-blue-500/10",   text: "text-blue-600 dark:text-blue-400" },
    green:  { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" },
  }[color];

  return (
    <div className={`rounded-xl border border-border/40 p-3.5 ${styles.bg}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-extrabold tabular-nums ${styles.text}`}>{value}</p>
    </div>
  );
}
