import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";
import { Server } from "lucide-react";

interface NodeStat {
  id: string;
  name: string;
  roles: string[];
  heapUsedPercent: number;
  cpuPercent: number;
  diskUsedPercent: number;
  diskTotalBytes: number;
  diskAvailableBytes: number;
  uptimeMs: number;
}

function PercentBar({ value, danger = 85, warn = 75 }: { value: number; danger?: number; warn?: number }) {
  const isCrit = value >= danger;
  const isWarn = !isCrit && value >= warn;
  const color = isCrit ? "bg-red-500" : isWarn ? "bg-yellow-500" : "bg-emerald-500";
  const textColor = isCrit ? "text-red-600 dark:text-red-400" : isWarn ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className={cn("text-xs font-semibold tabular-nums", textColor)}>
        {value.toFixed(0)}%
      </span>
    </div>
  );
}

export function NodesTable({ nodes }: { nodes: NodeStat[] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <Server className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-bold">Nodes</h3>
        <span className="ml-auto text-xs text-muted-foreground">{nodes.length} nodes</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground">Node</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Roles</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">JVM Heap</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">CPU</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Disk</th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground">Free</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {nodes.map((node) => (
              <tr key={node.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-semibold text-sm">{node.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{node.id.slice(0, 8)}…</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {node.roles.map((r) => (
                      <span key={r} className="text-[10px] font-semibold uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3"><PercentBar value={node.heapUsedPercent} /></td>
                <td className="px-4 py-3"><PercentBar value={node.cpuPercent} danger={90} warn={70} /></td>
                <td className="px-4 py-3"><PercentBar value={node.diskUsedPercent} /></td>
                <td className="px-5 py-3 text-xs font-medium text-muted-foreground font-mono">
                  {formatBytes(node.diskAvailableBytes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
