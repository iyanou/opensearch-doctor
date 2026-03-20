"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
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
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-background">
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center mb-5 border border-red-200 dark:border-red-500/20">
        <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
      </div>
      <h1 className="text-xl font-bold mb-2 text-foreground">Something went wrong</h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed">
        An unexpected error occurred. Try refreshing the page — if the problem
        persists, please contact support.
      </p>
      {error.digest && (
        <p className="text-[11px] font-mono text-muted-foreground mb-5 bg-muted px-3 py-1.5 rounded-lg border border-border/60">
          ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        <RefreshCw className="w-4 h-4" /> Try again
      </button>
    </div>
  );
}
