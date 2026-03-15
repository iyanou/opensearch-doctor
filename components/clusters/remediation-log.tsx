"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, Clock, Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "@/lib/format";

type RemediationStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";

interface RemediationCommand {
  id: string;
  label: string;
  category: string;
  findingTitle: string;
  status: RemediationStatus;
  triggeredBy: string;
  createdAt: string;
  completedAt: string | null;
  result: string | null;
  error: string | null;
}

function StatusPill({ status }: { status: RemediationStatus }) {
  const map: Record<RemediationStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    COMPLETED: {
      label: "Completed",
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    FAILED: {
      label: "Failed",
      cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
      icon: <XCircle className="w-3 h-3" />,
    },
    RUNNING: {
      label: "Running",
      cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    PENDING: {
      label: "Pending",
      cls: "bg-muted text-muted-foreground",
      icon: <Clock className="w-3 h-3" />,
    },
    SKIPPED: {
      label: "Skipped",
      cls: "bg-muted text-muted-foreground",
      icon: null,
    },
  };
  const { label, cls, icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${cls}`}>
      {icon} {label}
    </span>
  );
}

export function RemediationLog({ initialCommands }: { initialCommands: RemediationCommand[] }) {
  const [commands] = useState(initialCommands);
  const [expanded, setExpanded] = useState(false);

  if (commands.length === 0) return null;

  const visible = expanded ? commands : commands.slice(0, 3);

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-bold">Auto-Ops Log</h3>
        <span className="ml-auto text-xs text-muted-foreground">{commands.length} actions</span>
      </div>

      <div className="divide-y divide-border/40">
        {visible.map((cmd) => (
          <div key={cmd.id} className="px-5 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold">{cmd.label}</p>
                  <StatusPill status={cmd.status} />
                </div>
                <p className="text-xs text-muted-foreground truncate">{cmd.findingTitle}</p>
                {cmd.error && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2 border border-red-200 dark:border-red-500/20">
                    {cmd.error}
                  </div>
                )}
                {cmd.result && cmd.status === "COMPLETED" && (
                  <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-500/10 rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-500/20 truncate">
                    {cmd.result}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                {formatDistanceToNow(new Date(cmd.createdAt))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {commands.length > 3 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-3 border-t border-border/40 hover:bg-muted/30 transition-colors"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Show {commands.length - 3} more</>
          )}
        </button>
      )}
    </div>
  );
}
