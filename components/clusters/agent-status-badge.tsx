import { cn } from "@/lib/utils";

interface AgentStatusBadgeProps {
  online: boolean;
  lastSeenAt?: string | null;
}

export function AgentStatusBadge({ online, lastSeenAt }: AgentStatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
      online
        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25"
        : lastSeenAt
        ? "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20"
        : "bg-muted text-muted-foreground border-border/60"
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full shrink-0",
        online ? "bg-emerald-500 shadow-[0_0_0_2px_theme(colors.emerald.500/0.3)] animate-pulse" : "bg-zinc-400"
      )} />
      {online ? "Agent online" : lastSeenAt ? "Agent offline" : "Never connected"}
    </span>
  );
}
