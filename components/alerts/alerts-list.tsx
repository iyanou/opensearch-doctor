"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/format";
import { AlertTriangle, CheckCircle2, Clock, BellOff, Check, ExternalLink, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const RULE_LABELS: Record<string, string> = {
  CLUSTER_STATUS_RED: "Cluster status RED",
  CLUSTER_STATUS_YELLOW: "Cluster status YELLOW",
  HEAP_USAGE_HIGH: "JVM heap usage is high",
  DISK_USAGE_HIGH: "Disk usage is high",
  UNASSIGNED_SHARDS: "Unassigned shards detected",
  NO_RECENT_SNAPSHOT: "No recent snapshot (>48h)",
  AGENT_OFFLINE: "Agent is offline",
  HEALTH_SCORE_LOW: "Health score is low",
};

const RULE_ICONS: Record<string, string> = {
  CLUSTER_STATUS_RED: "🔴",
  CLUSTER_STATUS_YELLOW: "🟡",
  HEAP_USAGE_HIGH: "📈",
  DISK_USAGE_HIGH: "💾",
  UNASSIGNED_SHARDS: "⚠️",
  NO_RECENT_SNAPSHOT: "📸",
  AGENT_OFFLINE: "📡",
  HEALTH_SCORE_LOW: "📉",
};

interface AlertEvent {
  id: string;
  status: string;
  firedAt: Date | string;
  resolvedAt?: Date | string | null;
  snoozedUntil?: Date | string | null;
  acknowledgedAt?: Date | string | null;
  rule: { ruleKey: string; threshold: number | null };
  cluster: { id: string; name: string };
}

const SNOOZE_OPTIONS = [
  { label: "1 hour", hours: 1 },
  { label: "4 hours", hours: 4 },
  { label: "24 hours", hours: 24 },
];

function AlertRow({ event, muted, onDelete }: { event: AlertEvent; muted?: boolean; onDelete: (id: string) => void }) {
  const [status, setStatus] = useState(event.status);
  const [acknowledgedAt, setAcknowledgedAt] = useState(event.acknowledgedAt);
  const [snoozing, setSnoozing] = useState(false);
  const [loading, setLoading] = useState(false);

  const isFiring = status === "FIRING";
  const isSnoozed = status === "SNOOZED";
  const isResolved = status === "RESOLVED";
  const isAcknowledged = !!acknowledgedAt;

  async function snooze(hours: number) {
    setLoading(true);
    setSnoozing(false);
    const res = await fetch(`/api/alerts/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "snooze", snoozeHours: hours }),
    });
    if (res.ok) setStatus("SNOOZED");
    setLoading(false);
  }

  async function acknowledge() {
    setLoading(true);
    const res = await fetch(`/api/alerts/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "acknowledge" }),
    });
    if (res.ok) setAcknowledgedAt(new Date().toISOString());
    setLoading(false);
  }

  async function deleteAlert() {
    setLoading(true);
    const res = await fetch(`/api/alerts/${event.id}`, { method: "DELETE" });
    if (res.ok) onDelete(event.id);
    setLoading(false);
  }

  const label = RULE_LABELS[event.rule.ruleKey] ?? event.rule.ruleKey;
  const icon = RULE_ICONS[event.rule.ruleKey] ?? "⚡";

  return (
    <div className={cn(
      "group p-4 rounded-xl border transition-all duration-150",
      isFiring && !isAcknowledged
        ? "border-red-200 bg-red-50/60 dark:bg-red-500/8 dark:border-red-500/20"
        : isSnoozed
        ? "border-yellow-200 bg-yellow-50/60 dark:bg-yellow-500/8 dark:border-yellow-500/20"
        : "border-border/60 bg-card opacity-60",
    )}>
      {/* Top row: icon + content + actions (desktop inline) */}
      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base",
          isFiring && !isAcknowledged ? "bg-red-100 dark:bg-red-500/15" :
          isSnoozed ? "bg-yellow-100 dark:bg-yellow-500/15" :
          "bg-muted"
        )}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className={cn(
              "text-sm font-semibold",
              isResolved && "text-muted-foreground"
            )}>
              {label}
            </p>
            {event.rule.threshold && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                threshold: {event.rule.threshold}
              </span>
            )}
            {isAcknowledged && (
              <Badge variant="secondary" className="text-[10px] py-0 h-4 gap-1">
                <Check className="w-2.5 h-2.5" /> Acknowledged
              </Badge>
            )}
            {isSnoozed && (
              <Badge className="text-[10px] py-0 h-4 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200">
                <BellOff className="w-2.5 h-2.5 mr-1" />
                Snoozed
                {event.snoozedUntil && ` until ${new Date(event.snoozedUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
              </Badge>
            )}
            {isResolved && (
              <Badge variant="outline" className="text-[10px] py-0 h-4 gap-1 text-emerald-600 border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-2.5 h-2.5" /> Resolved
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <Link
              href={`/clusters/${event.cluster.id}`}
              className="flex items-center gap-1 text-primary hover:underline underline-offset-2 font-medium"
            >
              {event.cluster.name} <ExternalLink className="w-3 h-3" />
            </Link>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isResolved && event.resolvedAt
                ? `Resolved ${formatDistanceToNow(new Date(event.resolvedAt))}`
                : `Fired ${formatDistanceToNow(new Date(event.firedAt))}`}
            </span>
          </div>
        </div>

        {/* Desktop actions — hidden on mobile, visible on hover */}
        <div className="hidden md:flex items-center gap-1.5 shrink-0 relative opacity-0 group-hover:opacity-100 transition-opacity">
          <AlertActions
            isResolved={isResolved} muted={muted} isAcknowledged={isAcknowledged}
            snoozing={snoozing} setSnoozing={setSnoozing}
            loading={loading} acknowledge={acknowledge} snooze={snooze} deleteAlert={deleteAlert}
          />
        </div>
      </div>

      {/* Mobile actions row — visible below content on small screens */}
      <div className="mt-3 flex items-center gap-1.5 md:hidden pl-[52px]">
        <AlertActions
          isResolved={isResolved} muted={muted} isAcknowledged={isAcknowledged}
          snoozing={snoozing} setSnoozing={setSnoozing}
          loading={loading} acknowledge={acknowledge} snooze={snooze} deleteAlert={deleteAlert}
        />
      </div>
    </div>
  );
}

function AlertActions({
  isResolved, muted, isAcknowledged, snoozing, setSnoozing,
  loading, acknowledge, snooze, deleteAlert,
}: {
  isResolved: boolean; muted?: boolean; isAcknowledged: boolean;
  snoozing: boolean; setSnoozing: (fn: (v: boolean) => boolean) => void;
  loading: boolean;
  acknowledge: () => void;
  snooze: (hours: number) => void;
  deleteAlert: () => void;
}) {
  return (
    <>
      {!isResolved && !muted && (
        <>
          {!isAcknowledged && (
            <Button
              variant="outline" size="sm"
              className="h-7 text-xs gap-1"
              onClick={acknowledge} disabled={loading}
            >
              <Check className="w-3 h-3" /> Ack
            </Button>
          )}

          <div className="relative">
            <Button
              variant="outline" size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setSnoozing((v) => !v)} disabled={loading}
            >
              <BellOff className="w-3 h-3" /> Snooze
            </Button>
            {snoozing && (
              <div className="absolute left-0 top-full mt-1 z-20 bg-popover border border-border rounded-xl shadow-lg p-1.5 min-w-[130px]">
                {SNOOZE_OPTIONS.map((o) => (
                  <button
                    key={o.hours}
                    className="flex items-center w-full text-left text-xs px-3 py-1.5 hover:bg-accent rounded-lg transition-colors"
                    onClick={() => snooze(o.hours)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Button
        variant="ghost" size="sm"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        onClick={deleteAlert} disabled={loading}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </>
  );
}

export function AlertsList({ events, muted }: { events: AlertEvent[]; muted?: boolean }) {
  const [items, setItems] = useState(events);

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((e) => e.id !== id));
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((e) => (
        <AlertRow key={e.id} event={e} muted={muted} onDelete={handleDelete} />
      ))}
    </div>
  );
}
