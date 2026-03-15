"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "@/lib/format";
import { Copy, Check, Trash2, Plus, Key, AlertCircle } from "lucide-react";

interface AgentKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: Date | string | null;
  createdAt: Date | string;
  clusterId: string | null;
}

export function AgentKeysPanel({ initialKeys }: { initialKeys: AgentKey[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");

    const res = await fetch("/api/agent/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to create key");
      return;
    }

    setNewKey(data.rawKey);
    setNewName("");
    const listRes = await fetch("/api/agent/keys");
    if (listRes.ok) setKeys(await listRes.json());
  }

  async function handleRevoke(id: string) {
    await fetch(`/api/agent/keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <Key className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Agent API Keys</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Paste into your agent&apos;s <code className="text-[10px] bg-muted px-1 py-0.5 rounded">config.yaml</code> as <code className="text-[10px] bg-muted px-1 py-0.5 rounded">saas.api_key</code>
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Create */}
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            placeholder="Key name — e.g. prod-server-1"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={creating || !newName.trim()} size="sm" className="shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {creating ? "Creating…" : "Create"}
          </Button>
        </form>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* New key reveal */}
        {newKey && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-2.5">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Copy this key now — it won&apos;t be shown again
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white dark:bg-background border border-border/60 rounded-lg px-3 py-2 font-mono break-all">
                {newKey}
              </code>
              <Button variant="outline" size="sm" className="shrink-0 h-9 w-9 p-0" onClick={copyKey}>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setNewKey(null)}
            >
              I&apos;ve saved it
            </button>
          </div>
        )}

        {/* Keys list */}
        {keys.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border/60 rounded-xl">
            <Key className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No keys yet. Create one above.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/40">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{key.name}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {key.keyPrefix}••••••••••••
                    <span className="font-sans ml-1.5">
                      {key.lastUsedAt
                        ? `· last used ${formatDistanceToNow(new Date(key.lastUsedAt))}`
                        : "· never used"}
                    </span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRevoke(key.id)}
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
