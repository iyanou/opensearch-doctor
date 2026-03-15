"use client";

import { useState, useMemo } from "react";
import { SeverityBadge } from "./severity-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown, ChevronUp, ExternalLink, Copy, Check, X,
  Wrench, Loader2, Search,
} from "lucide-react";
import { getRemediation } from "@/lib/remediation/catalogue";

type Severity = "CRITICAL" | "WARNING" | "INFO" | "OK";

interface Finding {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  detail: string;
  recommendation: string;
  docUrl?: string | null;
}

const SEVERITY_ORDER: Severity[] = ["CRITICAL", "WARNING", "INFO", "OK"];

const CATEGORY_LABELS: Record<string, string> = {
  CLUSTER_HEALTH: "Cluster Health",
  NODES: "Nodes",
  INDICES: "Indices",
  SHARDS: "Shards",
  PERFORMANCE: "Performance",
  SNAPSHOTS: "Snapshots",
  ISM_POLICIES: "ISM",
  SECURITY: "Security",
  PLUGINS: "Plugins",
  INGEST_PIPELINES: "Ingest",
  TEMPLATES: "Templates",
};

const SEV_BG: Record<Severity, string> = {
  CRITICAL: "bg-red-500",
  WARNING:  "bg-yellow-500",
  INFO:     "bg-blue-500",
  OK:       "bg-emerald-500",
};

export function FindingsList({ findings, clusterId }: { findings: Finding[]; clusterId?: string }) {
  const [severityFilter, setSeverityFilter] = useState<Severity | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(findings.map((f) => f.category))).sort(),
    [findings]
  );

  const filtered = useMemo(
    () =>
      findings.filter(
        (f) =>
          (!severityFilter || f.severity === severityFilter) &&
          (!categoryFilter || f.category === categoryFilter)
      ),
    [findings, severityFilter, categoryFilter]
  );

  const grouped = SEVERITY_ORDER.reduce<Record<Severity, Finding[]>>(
    (acc, s) => { acc[s] = filtered.filter((f) => f.severity === s); return acc; },
    { CRITICAL: [], WARNING: [], INFO: [], OK: [] }
  );

  const hasFilter = severityFilter !== null || categoryFilter !== null;

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-bold">Findings</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {findings.length}
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {SEVERITY_ORDER.map((s) => {
            const count = findings.filter((f) => f.severity === s).length;
            if (count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setSeverityFilter(severityFilter === s ? null : s)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all ${
                  severityFilter === s
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/60 hover:bg-muted hover:border-border"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${SEV_BG[s]}`} />
                {s}
                <span className={`font-normal ${severityFilter === s ? "text-background/70" : "text-muted-foreground"}`}>
                  {count}
                </span>
              </button>
            );
          })}

          {categories.length > 1 && (
            <select
              value={categoryFilter ?? ""}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
              className="text-xs border border-border/60 rounded-lg px-2.5 py-1 bg-background h-7 font-medium cursor-pointer focus:ring-1 focus:ring-primary"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</option>
              ))}
            </select>
          )}

          {hasFilter && (
            <button
              onClick={() => { setSeverityFilter(null); setCategoryFilter(null); }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-border/40">
        {filtered.length === 0 && findings.length > 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No findings match the current filter.
          </p>
        )}
        {findings.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-emerald-600 font-semibold">✓ No findings — cluster looks healthy</p>
          </div>
        )}
        {SEVERITY_ORDER.map((severity) =>
          grouped[severity].length > 0 ? (
            <FindingGroup
              key={severity}
              severity={severity}
              findings={grouped[severity]}
              clusterId={clusterId}
              allFindings={findings}
            />
          ) : null
        )}
      </div>
    </div>
  );
}

function FindingGroup({
  severity, findings, clusterId, allFindings,
}: {
  severity: Severity; findings: Finding[]; clusterId?: string; allFindings: Finding[];
}) {
  const [open, setOpen] = useState(severity === "CRITICAL" || severity === "WARNING");

  const headerBg: Record<Severity, string> = {
    CRITICAL: "bg-red-50/70 hover:bg-red-50 dark:bg-red-500/5 dark:hover:bg-red-500/8",
    WARNING:  "bg-yellow-50/70 hover:bg-yellow-50 dark:bg-yellow-500/5 dark:hover:bg-yellow-500/8",
    INFO:     "bg-blue-50/50 hover:bg-blue-50/80 dark:bg-blue-500/5",
    OK:       "bg-emerald-50/50 hover:bg-emerald-50/80 dark:bg-emerald-500/5",
  };

  return (
    <div>
      <button
        className={`w-full flex items-center justify-between px-5 py-3 transition-colors ${headerBg[severity]}`}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2.5">
          <SeverityBadge severity={severity} />
          <span className="text-xs text-muted-foreground font-medium">
            {findings.length} finding{findings.length !== 1 ? "s" : ""}
          </span>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="divide-y divide-border/30">
          {findings.map((f) => (
            <FindingRow key={f.id} finding={f} clusterId={clusterId} allFindings={allFindings} />
          ))}
        </div>
      )}
    </div>
  );
}

function FindingRow({
  finding, clusterId, allFindings,
}: {
  finding: Finding; clusterId?: string; allFindings: Finding[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fixState, setFixState] = useState<"idle" | "loading" | "queued" | "error">("idle");

  const remediation = getRemediation(finding.category, finding.title, allFindings);

  function copyRecommendation() {
    navigator.clipboard.writeText(finding.recommendation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function triggerFix() {
    if (!clusterId || fixState !== "idle") return;
    setFixState("loading");
    try {
      const res = await fetch(`/api/clusters/${clusterId}/remediate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: finding.category, title: finding.title }),
      });
      if (res.ok || res.status === 409) {
        setFixState("queued");
      } else {
        setFixState("error");
        setTimeout(() => setFixState("idle"), 3000);
      }
    } catch {
      setFixState("error");
      setTimeout(() => setFixState("idle"), 3000);
    }
  }

  return (
    <div className="px-5 py-3.5 hover:bg-muted/20 transition-colors">
      <button
        className="flex items-start justify-between w-full text-left gap-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-semibold">{finding.title}</p>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wide">
              {CATEGORY_LABELS[finding.category] ?? finding.category}
            </span>
          </div>
          {!expanded && (
            <p className="text-xs text-muted-foreground line-clamp-1">{finding.detail}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground shrink-0 mt-0.5 hover:text-primary transition-colors">
          {expanded ? "less" : "more"}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Detail</p>
            <p className="text-sm leading-relaxed">{finding.detail}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Recommendation</p>
            <div className="flex items-start gap-2">
              <pre className="text-xs flex-1 bg-muted/60 border border-border/60 rounded-xl p-3 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {finding.recommendation}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-8 w-8 p-0"
                onClick={copyRecommendation}
              >
                {copied
                  ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                  : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {finding.docUrl && (
              <a
                href={finding.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4 font-medium"
              >
                <ExternalLink className="w-3 h-3" /> OpenSearch docs
              </a>
            )}
            {remediation && clusterId && (
              <button
                onClick={triggerFix}
                disabled={fixState !== "idle"}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 border transition-all ${
                  fixState === "queued"
                    ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                    : fixState === "error"
                    ? "border-red-400 text-red-600 bg-red-50 dark:bg-red-950/20"
                    : "border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/50"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {fixState === "loading" && <Loader2 className="w-3 h-3 animate-spin" />}
                {fixState === "queued" && <Check className="w-3 h-3" />}
                {fixState === "idle" && <Wrench className="w-3 h-3" />}
                {fixState === "idle" && remediation.label}
                {fixState === "loading" && "Queuing…"}
                {fixState === "queued" && "Queued — agent will fix shortly"}
                {fixState === "error" && "Failed to queue"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
