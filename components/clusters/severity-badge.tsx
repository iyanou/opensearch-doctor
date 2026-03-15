import { cn } from "@/lib/utils";

type Severity = "CRITICAL" | "WARNING" | "INFO" | "OK";

const styles: Record<Severity, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  WARNING:  "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20",
  INFO:     "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  OK:       "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
};

const dots: Record<Severity, string> = {
  CRITICAL: "bg-red-500",
  WARNING:  "bg-yellow-500",
  INFO:     "bg-blue-500",
  OK:       "bg-emerald-500",
};

interface SeverityBadgeProps {
  severity: Severity;
  count?: number;
  compact?: boolean;
}

export function SeverityBadge({ severity, count, compact }: SeverityBadgeProps) {
  if (compact) {
    return (
      <span className="flex items-center gap-1.5">
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dots[severity])} />
        <span className="text-xs font-semibold uppercase tracking-wide">{severity}</span>
      </span>
    );
  }
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wide",
      styles[severity]
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dots[severity])} />
      {severity}
      {count !== undefined && <span className="font-normal opacity-80">({count})</span>}
    </span>
  );
}
