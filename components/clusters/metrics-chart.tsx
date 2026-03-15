"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useTheme } from "next-themes";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return {
    tickColor:  dark ? "#94a3b8" : "#64748b",
    gridColor:  dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    popoverBg:  dark ? "#1e1e2e" : "#ffffff",
    popoverBorder: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
  };
}

type DataPoint = { time: string; value: number; nodeId?: string };
type MetricsMap = Record<string, DataPoint[]>;

const RANGES = [
  { label: "24h", days: 1 },
  { label: "7d",  days: 7 },
  { label: "30d", days: 30 },
];

const CHART_CONFIGS: {
  key: string;
  title: string;
  unit: string;
  color: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  domain?: [number, number];
}[] = [
  { key: "health_score",      title: "Health Score",    unit: "",   color: "#10b981", domain: [0, 100] },
  { key: "heap_percent",      title: "JVM Heap",        unit: "%",  color: "#6366f1", warningThreshold: 75, criticalThreshold: 85, domain: [0, 100] },
  { key: "cpu_percent",       title: "CPU",             unit: "%",  color: "#f59e0b", warningThreshold: 80, criticalThreshold: 90, domain: [0, 100] },
  { key: "disk_percent",      title: "Disk",            unit: "%",  color: "#ec4899", warningThreshold: 75, criticalThreshold: 85, domain: [0, 100] },
  { key: "unassigned_shards", title: "Unassigned Shards", unit: "", color: "#ef4444" },
  { key: "search_latency_ms", title: "Search Latency", unit: "ms", color: "#8b5cf6", warningThreshold: 1000, criticalThreshold: 5000 },
  { key: "bulk_rejections",   title: "Bulk Rejections", unit: "",   color: "#f97316" },
  { key: "indexing_rate",     title: "Indexing Rate",   unit: "/s", color: "#14b8a6" },
];

function formatTime(iso: string, days: number): string {
  const d = new Date(iso);
  if (days <= 1) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function collapseByTime(points: DataPoint[]): { time: string; value: number }[] {
  const map = new Map<string, number[]>();
  for (const p of points) {
    if (!map.has(p.time)) map.set(p.time, []);
    map.get(p.time)!.push(p.value);
  }
  return Array.from(map.entries()).map(([time, vals]) => ({
    time,
    value: vals.reduce((a, b) => a + b, 0) / vals.length,
  }));
}

interface SingleChartProps {
  title: string;
  data: { time: string; value: number }[];
  unit: string;
  color: string;
  days: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  domain?: [number, number];
  colors: ReturnType<typeof useChartColors>;
}

function SingleChart({ title, data, unit, color, days, warningThreshold, criticalThreshold, domain, colors }: SingleChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">{title}</p>
        <div className="h-24 flex items-center justify-center">
          <p className="text-xs text-muted-foreground/60">No data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-xs font-semibold mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={data} margin={{ top: 2, right: 2, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={(v) => formatTime(v, days)}
            tick={{ fontSize: 9, fill: colors.tickColor }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={domain ?? ["auto", "auto"]}
            tick={{ fontSize: 9, fill: colors.tickColor }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}${unit}`}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              background: colors.popoverBg,
              border: `1px solid ${colors.popoverBorder}`,
              borderRadius: "8px",
              padding: "6px 10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
            formatter={(v) => [`${Number(v).toFixed(1)}${unit}`, title]}
            labelFormatter={(l) => formatTime(l, days)}
          />
          {warningThreshold && (
            <ReferenceLine y={warningThreshold} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1} />
          )}
          {criticalThreshold && (
            <ReferenceLine y={criticalThreshold} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1} />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MetricsCharts({ clusterId }: { clusterId: string }) {
  const [days, setDays] = useState(7);
  const [metrics, setMetrics] = useState<MetricsMap>({});
  const [loading, setLoading] = useState(true);
  const colors = useChartColors();

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clusters/${clusterId}/metrics?days=${days}`);
      if (res.ok) setMetrics(await res.json());
    } finally {
      setLoading(false);
    }
  }, [clusterId, days]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const availableCharts = CHART_CONFIGS.filter((c) => metrics[c.key]?.length > 0);

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-bold">Metrics</h3>
        <div className="ml-auto flex items-center gap-1 bg-muted/60 rounded-lg p-0.5 border border-border/40">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-all",
                days === r.days
                  ? "bg-background shadow-sm text-foreground border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-muted/30 p-4 h-[162px]">
                <div className="h-2.5 w-20 bg-muted rounded animate-pulse mb-4" />
                <div className="h-24 bg-muted/60 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : availableCharts.length === 0 ? (
          <div className="py-10 text-center">
            <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No metric data yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Run a diagnostic to start collecting metrics.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {availableCharts.map((cfg) => {
              const raw = metrics[cfg.key] ?? [];
              const hasNodes = raw.some((p) => p.nodeId);
              const data = hasNodes ? collapseByTime(raw) : raw.map((p) => ({ time: p.time, value: p.value }));
              return (
                <SingleChart
                  key={cfg.key}
                  title={cfg.title}
                  data={data}
                  unit={cfg.unit}
                  color={cfg.color}
                  days={days}
                  warningThreshold={cfg.warningThreshold}
                  criticalThreshold={cfg.criticalThreshold}
                  domain={cfg.domain}
                  colors={colors}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
