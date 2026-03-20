"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, MoreVertical } from "lucide-react";

export function ClusterDeleteButton({ clusterId, clusterName }: { clusterId: string; clusterName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/clusters/${clusterId}`, { method: "DELETE" });
    setDeleting(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative" onClick={(e) => e.preventDefault()}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); setConfirming(false); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); }} />

          <div className="absolute right-0 top-8 z-20 w-52 rounded-xl border border-border/60 bg-popover shadow-lg overflow-hidden">
            {!confirming ? (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirming(true); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete cluster
              </button>
            ) : (
              <div className="p-3 space-y-2.5">
                <p className="text-xs font-semibold text-foreground">Delete <span className="text-red-600">{clusterName}</span>?</p>
                <p className="text-xs text-muted-foreground">This removes all sessions and findings. The agent will keep running until you stop it.</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); setConfirming(false); }}
                    className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
                    disabled={deleting}
                    className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                  >
                    {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
