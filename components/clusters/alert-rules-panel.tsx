"use client";

import { useState } from "react";
import { BellOff, Loader2, SlidersHorizontal } from "lucide-react";

// Only threshold-based rules are user-configurable. Binary rules (RED, YELLOW,
// UNASSIGNED_SHARDS, NO_RECENT_SNAPSHOT, AGENT_OFFLINE) are always enforced
// by the engine and don't appear here.
const THRESHOLD_RULES: Record<string, { label: string; icon: string; description: string; thresholdLabel: string; defaultThreshold: number }> = {
  HEALTH_SCORE_LOW: { icon: "📉", label: "Health score is low",   description: "Alert when health score drops below this value.", thresholdLabel: "Min score",  defaultThreshold: 70 },
  HEAP_USAGE_HIGH:  { icon: "📈", label: "JVM heap usage high",   description: "Alert when any node's heap exceeds this %.",      thresholdLabel: "Max heap %", defaultThreshold: 85 },
  DISK_USAGE_HIGH:  { icon: "💾", label: "Disk usage high",       description: "Alert when any node's disk exceeds this %.",      thresholdLabel: "Max disk %", defaultThreshold: 80 },
};

interface AlertRule {
  id: string;
  ruleKey: string;
  enabled: boolean;
  threshold: number | null;
}

export function AlertRulesPanel({ clusterId, initialRules }: { clusterId: string; initialRules: AlertRule[] }) {
  const [rules, setRules] = useState<AlertRule[]>(initialRules);
  const [saving, setSaving] = useState<string | null>(null);

  const configurableRules = rules.filter((r) => r.ruleKey in THRESHOLD_RULES);

  async function patch(ruleId: string, changes: { enabled?: boolean; threshold?: number }) {
    setSaving(ruleId);
    const res = await fetch(`/api/clusters/${clusterId}/alert-rules`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruleId, ...changes }),
    });
    if (res.ok) {
      setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, ...changes } : r)));
    }
    setSaving(null);
  }

  if (configurableRules.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Alert Thresholds</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Adjust when threshold-based alerts fire</p>
        </div>
      </div>

      <div className="divide-y divide-border/40">
        {configurableRules.map((rule) => {
          const meta = THRESHOLD_RULES[rule.ruleKey];
          const isSaving = saving === rule.id;

          return (
            <div key={rule.id} className={`flex items-center gap-4 px-5 py-3 transition-colors ${!rule.enabled ? "opacity-50" : ""}`}>
              <span className="text-lg w-7 shrink-0 text-center">{meta.icon}</span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{meta.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
              </div>

              {rule.enabled && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">{meta.thresholdLabel}:</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={rule.threshold ?? meta.defaultThreshold}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val !== rule.threshold) patch(rule.id, { threshold: val });
                    }}
                    className="w-14 h-7 text-xs text-center rounded-lg border border-border/60 bg-background px-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <button
                onClick={() => patch(rule.id, { enabled: !rule.enabled })}
                disabled={isSaving}
                className={`relative shrink-0 w-9 h-5 rounded-full transition-colors focus:outline-none ${
                  rule.enabled ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin absolute inset-0 m-auto text-white" />
                ) : (
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    rule.enabled ? "translate-x-4" : "translate-x-0.5"
                  }`} />
                )}
              </button>

              {!rule.enabled && <BellOff className="w-3 h-3 text-muted-foreground shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
