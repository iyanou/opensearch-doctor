"use client";

import { useState } from "react";
import { formatBytes } from "@/lib/format";
import { ArrowUpDown, Database, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IndexRow {
  name: string;
  health: "green" | "yellow" | "red";
  status: "open" | "close";
  primaryShards: number;
  replicas: number;
  docsCount: number;
  storeSizeBytes: number;
  isReadOnly: boolean;
}

type SortKey = "name" | "health" | "docsCount" | "storeSizeBytes" | "primaryShards";

const HEALTH_DOT: Record<string, string> = {
  green:  "bg-emerald-500",
  yellow: "bg-yellow-500",
  red:    "bg-red-500",
};

const HEALTH_TEXT: Record<string, string> = {
  green:  "text-emerald-700 dark:text-emerald-400",
  yellow: "text-yellow-700 dark:text-yellow-400",
  red:    "text-red-700 dark:text-red-400",
};

const ROW_BG: Record<string, string> = {
  red: "bg-red-50/60 dark:bg-red-500/5",
};

export function IndicesTable({ indices }: { indices: IndexRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("health");
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sorted = [...indices].sort((a, b) => {
    let diff = 0;
    if (sortKey === "name") diff = a.name.localeCompare(b.name);
    else if (sortKey === "health") {
      const order = { red: 0, yellow: 1, green: 2 };
      diff = order[a.health] - order[b.health];
    }
    else if (sortKey === "docsCount") diff = a.docsCount - b.docsCount;
    else if (sortKey === "storeSizeBytes") diff = a.storeSizeBytes - b.storeSizeBytes;
    else if (sortKey === "primaryShards") diff = a.primaryShards - b.primaryShards;
    return sortAsc ? diff : -diff;
  });

  function Th({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <th
        className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap transition-colors"
        onClick={() => toggleSort(k)}
      >
        <span className="flex items-center gap-1.5">
          {label}
          <ArrowUpDown className={cn("w-3 h-3 transition-opacity", active ? "text-foreground opacity-100" : "opacity-30")} />
        </span>
      </th>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <Database className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-bold">Indices</h3>
        <span className="ml-auto text-xs text-muted-foreground">{indices.length} total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <Th label="Name" k="name" />
              <Th label="Health" k="health" />
              <Th label="Docs" k="docsCount" />
              <Th label="Size" k="storeSizeBytes" />
              <Th label="Shards" k="primaryShards" />
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Replicas</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {sorted.map((idx) => (
              <tr
                key={idx.name}
                className={cn(
                  "hover:bg-muted/20 transition-colors",
                  ROW_BG[idx.health] ?? ""
                )}
              >
                <td className="px-4 py-3 font-mono text-xs max-w-[220px]">
                  <div className="flex items-center gap-1.5">
                    {idx.isReadOnly && (
                      <Lock className="w-3 h-3 text-red-500 shrink-0" />
                    )}
                    <span className="truncate" title={idx.name}>{idx.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", HEALTH_DOT[idx.health])} />
                    <span className={cn("text-xs font-semibold capitalize", HEALTH_TEXT[idx.health])}>
                      {idx.health}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-medium tabular-nums">{idx.docsCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs font-medium tabular-nums">{formatBytes(idx.storeSizeBytes)}</td>
                <td className="px-4 py-3 text-xs tabular-nums">{idx.primaryShards}</td>
                <td className="px-4 py-3 text-xs tabular-nums">{idx.replicas}</td>
                <td className="px-4 py-3">
                  {idx.status === "close" ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      closed
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      open
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
