"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "@/lib/format";
import { Copy, Plus, Trash2, Loader2, Check, Code2, AlertCircle } from "lucide-react";

interface ApiKeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | string | null;
  createdAt: Date | string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </Button>
  );
}

export function ApiKeysPanel({ initialKeys }: { initialKeys: ApiKeyRow[] }) {
  const [keys, setKeys] = useState<ApiKeyRow[]>(initialKeys);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    if (!newKeyName.trim()) { setError("Name is required"); return; }
    setCreating(true);
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setRevealedKey(data.rawKey);
      setKeys((prev) => [{ id: data.id, name: data.name, keyPrefix: data.keyPrefix, createdAt: data.createdAt, lastUsedAt: null }, ...prev]);
      setNewKeyName("");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create key");
    }
    setCreating(false);
  }

  async function handleRevoke(id: string) {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-bold">REST API Keys</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Use with <code className="text-[10px] bg-muted px-1 py-0.5 rounded">Authorization: Bearer &lt;key&gt;</code> header
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Create */}
        <div className="flex gap-2">
          <Input
            placeholder="Key name — e.g. CI Pipeline"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1"
          />
          <Button size="sm" className="shrink-0" onClick={handleCreate} disabled={creating}>
            {creating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <Plus className="w-3.5 h-3.5 mr-1.5" />
            )}
            Create
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Revealed key */}
        {revealedKey && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-2.5">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Key created — copy it now. You won&apos;t see it again.
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono flex-1 break-all bg-white dark:bg-background border border-border/60 rounded-lg px-3 py-2">
                {revealedKey}
              </code>
              <CopyButton text={revealedKey} />
            </div>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setRevealedKey(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Keys list */}
        {keys.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border/60 rounded-xl">
            <Code2 className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No API keys yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{k.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <code className="text-xs text-muted-foreground font-mono">{k.keyPrefix}••••••••</code>
                    {k.lastUsedAt ? (
                      <span className="text-xs text-muted-foreground">
                        · Last used {formatDistanceToNow(new Date(k.lastUsedAt))}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Never used
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(k.createdAt).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => handleRevoke(k.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
