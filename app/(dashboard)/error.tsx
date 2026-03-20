"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center mb-4 border border-red-200 dark:border-red-500/20">
        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <h2 className="text-lg font-bold mb-1.5">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs leading-relaxed">
        This section failed to load. You can try again or go back to the dashboard.
      </p>
      {error.digest && (
        <p className="text-[11px] font-mono text-muted-foreground mb-4 bg-muted px-3 py-1.5 rounded-lg border border-border/60">
          ID: {error.digest}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border/60 text-sm font-medium hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      </div>
    </div>
  );
}
