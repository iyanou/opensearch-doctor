import { cn } from "@/lib/utils";

interface HealthScoreProps {
  score: number | null;
  size?: "sm" | "md" | "lg";
}

export function healthScoreColor(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 50) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

export function healthScoreBg(score: number | null) {
  if (score === null) return "bg-muted/50 border-border/60";
  if (score >= 90) return "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/25";
  if (score >= 70) return "bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/25";
  if (score >= 50) return "bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/25";
  return "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/25";
}

export function healthScoreLabel(score: number | null) {
  if (score === null) return "No data";
  if (score >= 90) return "Healthy";
  if (score >= 70) return "Degraded";
  if (score >= 50) return "At Risk";
  return "Critical";
}

export function HealthScore({ score, size = "md" }: HealthScoreProps) {
  const sizes = {
    sm: { num: "text-2xl", label: "text-[10px]", pad: "px-3 py-2.5", minw: "min-w-[64px]" },
    md: { num: "text-4xl", label: "text-xs",      pad: "px-5 py-4",   minw: "min-w-[88px]" },
    lg: { num: "text-6xl", label: "text-sm",      pad: "px-6 py-5",   minw: "min-w-[120px]" },
  };
  const s = sizes[size];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-xl border",
      s.pad, s.minw,
      healthScoreBg(score)
    )}>
      <span className={cn("font-extrabold leading-none", s.num, healthScoreColor(score))}>
        {score !== null ? score : "—"}
      </span>
      <span className={cn("font-semibold mt-1 leading-none uppercase tracking-wide", s.label, healthScoreColor(score))}>
        {healthScoreLabel(score)}
      </span>
    </div>
  );
}
