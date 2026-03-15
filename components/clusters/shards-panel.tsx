import { formatBytes } from "@/lib/format";
import { AlertTriangle, GitBranch } from "lucide-react";

export interface ShardsInfo {
  unassignedCount: number;
  unassignedReasons: Record<string, number>;
  shardCountPerNode: Record<string, number>;
  avgShardSizeBytes: number;
}

const REASON_LABELS: Record<string, string> = {
  NODE_LEFT: "Node left",
  ALLOCATION_FAILED: "Alloc failed",
  INDEX_CREATED: "New index",
  CLUSTER_RECOVERED: "Cluster recovery",
  INDEX_REOPENED: "Index reopened",
  DANGLING_INDEX_IMPORTED: "Dangling import",
  NEW_INDEX_RESTORED: "Restored",
  EXISTING_INDEX_RESTORED: "Restored (existing)",
  REPLICA_ADDED: "Replica added",
  REROUTE_CANCELLED: "Reroute cancelled",
  REINITIALIZED: "Reinitialized",
  MANUAL_ALLOCATION: "Manual",
  UNKNOWN: "Unknown",
};

export function ShardsPanel({ shards }: { shards: ShardsInfo }) {
  const nodeEntries = Object.entries(shards.shardCountPerNode).sort(([, a], [, b]) => b - a);
  const maxShardsPerNode = Math.max(...nodeEntries.map(([, c]) => c), 1);

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-bold">Shards</h3>
        {shards.unassignedCount > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400 uppercase tracking-wide">
            <AlertTriangle className="w-3 h-3" />
            {shards.unassignedCount} unassigned
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Unassigned", value: shards.unassignedCount, danger: shards.unassignedCount > 0 },
            { label: "Avg shard size", value: formatBytes(shards.avgShardSizeBytes) },
            { label: "Nodes w/ shards", value: nodeEntries.length },
          ].map(({ label, value, danger }) => (
            <div key={label} className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-lg font-bold tabular-nums ${danger ? "text-red-600 dark:text-red-400" : ""}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Unassigned reasons */}
        {shards.unassignedCount > 0 && Object.keys(shards.unassignedReasons).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">Unassigned reasons</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(shards.unassignedReasons).map(([reason, count]) => (
                <span
                  key={reason}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg border border-border/60 bg-muted/50"
                >
                  {REASON_LABELS[reason] ?? reason}
                  <span className="ml-1.5 text-muted-foreground">({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Shard distribution per node */}
        {nodeEntries.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Distribution per node</p>
            <div className="space-y-2.5">
              {nodeEntries.slice(0, 10).map(([nodeId, count]) => (
                <div key={nodeId} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-20 truncate shrink-0" title={nodeId}>
                    {nodeId.slice(0, 8)}…
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        count > 1000 ? "bg-red-500" : count > 500 ? "bg-yellow-500" : "bg-primary"
                      }`}
                      style={{ width: `${(count / maxShardsPerNode) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold tabular-nums w-10 text-right">{count}</span>
                </div>
              ))}
              {nodeEntries.length > 10 && (
                <p className="text-xs text-muted-foreground">+{nodeEntries.length - 10} more nodes</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
