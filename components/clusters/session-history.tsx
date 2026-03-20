import Link from "next/link";
import { healthScoreColor } from "./health-score";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, formatDuration } from "@/lib/format";
import { CheckCircle2, XCircle, Loader2, History, ChevronRight } from "lucide-react";

interface Session {
  id: string;
  startedAt: Date | string;
  healthScore: number | null;
  status: string;
  durationMs: number | null;
  _count: { findings: number };
}

export function SessionHistory({ sessions, clusterId }: { sessions: Session[]; clusterId: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <History className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-bold">Recent runs</h3>
        <span className="ml-auto text-xs text-muted-foreground">{sessions.length} runs</span>
      </div>
      <div className="divide-y divide-border/40">
        {sessions.map((s, idx) => (
          <Link
            key={s.id}
            href={`/clusters/${clusterId}/sessions/${s.id}`}
            className="group flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors"
          >
            {/* Status icon */}
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              s.status === "COMPLETED" ? "bg-emerald-100 dark:bg-emerald-500/15" :
              s.status === "FAILED" ? "bg-red-100 dark:bg-red-500/15" :
              "bg-muted"
            )}>
              {s.status === "COMPLETED" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : s.status === "FAILED" ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : (
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {formatDistanceToNow(new Date(s.startedAt))}
                </p>
                {idx === 0 && (
                  <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wide">
                    Latest
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {s._count.findings} finding{s._count.findings !== 1 ? "s" : ""}
                {s.durationMs ? ` · ${formatDuration(s.durationMs)}` : ""}
              </p>
            </div>

            {/* Score + arrow */}
            <div className="flex items-center gap-3 shrink-0">
              {s.healthScore !== null && (
                <span className={cn("text-base font-extrabold tabular-nums", healthScoreColor(s.healthScore))}>
                  {s.healthScore}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
