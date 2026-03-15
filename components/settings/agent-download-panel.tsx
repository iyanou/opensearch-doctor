"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download, Terminal, Server, Monitor, Key,
  Copy, Check, CheckCircle2, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";

const RELEASE_BASE =
  "https://github.com/iyanou/opensearch-doctor-agent/releases/latest/download";

type Platform = "linux" | "macos" | "windows";

interface AgentKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
}

export function AgentDownloadPanel() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [keys, setKeys] = useState<AgentKey[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // Load existing keys
  const loadKeys = useCallback(async () => {
    const res = await fetch("/api/agent/keys");
    if (res.ok) {
      const data = await res.json();
      setKeys(data.keys ?? []);
    }
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  // Poll for first connection once user reaches step 3
  useEffect(() => {
    if (step !== 3) return;
    if (connected) return;
    const timer = setInterval(async () => {
      setPollCount((n) => n + 1);
      const res = await fetch("/api/clusters");
      if (!res.ok) return;
      const data = await res.json();
      const clusters: { lastSeenAt: string | null }[] = data.clusters ?? [];
      const now = Date.now();
      const recent = clusters.some((c) => {
        if (!c.lastSeenAt) return false;
        return now - new Date(c.lastSeenAt).getTime() < 2 * 60 * 1000;
      });
      if (recent) {
        setConnected(true);
        clearInterval(timer);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [step, connected]);

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    const res = await fetch("/api/agent/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setRevealedKey(data.key);
      setSelectedKey(data.key);
      setNewKeyName("");
      await loadKeys();
    }
    setCreatingKey(false);
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedBlock(id);
    setTimeout(() => setCopiedBlock(null), 2000);
  }

  const displayKey = revealedKey ?? selectedKey ?? "osd_...your_api_key...";

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Install Agent</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Connect your OpenSearch cluster in 3 steps
          </p>
        </div>
        {/* Step indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          {([1, 2, 3] as const).map((s) => (
            <div
              key={s}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : step > s
                  ? "bg-emerald-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <Check className="w-3 h-3" /> : s}
            </div>
          ))}
        </div>
      </div>

      <div className="p-5">
        {/* ── STEP 1: Create / select API key ─────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">Create an agent key</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              The agent uses this key to authenticate with OpenSearch Doctor.
              Create a key now — you will need it during setup.
            </p>

            {/* Existing keys */}
            {keys.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Existing keys</p>
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 text-sm"
                  >
                    <Key className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-medium">{k.name}</span>
                    <span className="text-muted-foreground font-mono text-xs">{k.keyPrefix}...</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1">
                  Or create a new key specifically for this cluster:
                </p>
              </div>
            )}

            {/* Create new key */}
            <div className="flex gap-2">
              <Input
                placeholder="Key name, e.g. prod-cluster-1"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createKey()}
                className="h-9 text-sm"
              />
              <Button onClick={createKey} disabled={creatingKey || !newKeyName.trim()} size="sm" className="h-9 shrink-0">
                {creatingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create"}
              </Button>
            </div>

            {/* Revealed key */}
            {revealedKey && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3.5 space-y-2">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Copy this key now — it will not be shown again.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-white dark:bg-black/20 rounded-lg px-3 py-2 border border-amber-200 dark:border-amber-500/20 break-all">
                    {revealedKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-8"
                    onClick={() => copy(revealedKey, "key")}
                  >
                    {copiedBlock === "key" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                onClick={() => setStep(2)}
                disabled={!revealedKey && keys.length === 0}
                size="sm"
              >
                Next: Choose platform →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Choose platform ──────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">Where will you run the agent?</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <PlatformCard
                icon={<Server className="w-5 h-5" />}
                label="Linux server"
                description="Recommended for 24/7 monitoring"
                badge="Recommended"
                selected={platform === "linux"}
                onClick={() => setPlatform("linux")}
              />
              <PlatformCard
                icon={<Monitor className="w-5 h-5" />}
                label="macOS"
                description="Personal computer or Mac server"
                selected={platform === "macos"}
                onClick={() => setPlatform("macos")}
              />
              <PlatformCard
                icon={<Monitor className="w-5 h-5" />}
                label="Windows"
                description="Personal computer or Windows server"
                selected={platform === "windows"}
                onClick={() => setPlatform("windows")}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              For continuous monitoring, prefer running the agent on a server that stays online 24/7.
              On personal computers, the agent installs as a background service that starts at login.
            </p>

            <div className="flex justify-between pt-1">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>← Back</Button>
              <Button size="sm" disabled={!platform} onClick={() => setStep(3)}>
                Next: Install →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Install instructions ─────────────────────────── */}
        {step === 3 && platform && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">
                Install on {platform === "linux" ? "Linux" : platform === "macos" ? "macOS" : "Windows"}
              </h4>
            </div>

            {platform === "linux" && (
              <InstallBlock
                title="Linux (x86_64)"
                language="bash"
                copyId="linux-amd64"
                copiedBlock={copiedBlock}
                onCopy={copy}
                code={`# 1. Download the agent
curl -Lo agent ${RELEASE_BASE}/agent-linux-amd64
chmod +x agent

# 2. Run the setup wizard
#    It will ask for your cluster endpoint, credentials, and API key
#    then install a systemd service automatically
./agent --init`}
              />
            )}

            {platform === "macos" && (
              <InstallBlock
                title="macOS (Apple Silicon)"
                language="bash"
                copyId="macos-arm64"
                copiedBlock={copiedBlock}
                onCopy={copy}
                code={`# 1. Download the agent
curl -Lo agent ${RELEASE_BASE}/agent-darwin-arm64
chmod +x agent

# If you have an Intel Mac, use agent-darwin-amd64 instead

# 2. Run the setup wizard
#    It will ask for your cluster endpoint, credentials, and API key
#    then install a launchd service automatically (starts at login)
./agent --init`}
              />
            )}

            {platform === "windows" && (
              <InstallBlock
                title="Windows (PowerShell)"
                language="powershell"
                copyId="windows"
                copiedBlock={copiedBlock}
                onCopy={copy}
                code={`# 1. Download the agent
Invoke-WebRequest -Uri "${RELEASE_BASE}/agent-windows-amd64.exe" -OutFile agent.exe

# 2. Run the setup wizard
#    It will ask for your cluster endpoint, credentials, and API key
#    then register a Task Scheduler task automatically (starts at login)
.\\agent.exe --init`}
              />
            )}

            {/* API key reminder */}
            <div className="rounded-xl bg-muted/60 border border-border/60 p-3.5">
              <p className="text-xs font-semibold mb-1.5">Your API key (created in Step 1)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono break-all">{displayKey}</code>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-7"
                  onClick={() => copy(displayKey, "key-reminder")}
                >
                  {copiedBlock === "key-reminder" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Paste this when the wizard asks for your OpenSearch Doctor API key.
              </p>
            </div>

            {/* Manual config — collapsible */}
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold hover:bg-muted/40 transition-colors"
                onClick={() => setManualOpen((v) => !v)}
              >
                <span>Manual configuration (advanced)</span>
                {manualOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {manualOpen && (
                <div className="border-t border-border/60">
                  <InstallBlock
                    title="config.yaml"
                    language="yaml"
                    copyId="config-yaml"
                    copiedBlock={copiedBlock}
                    onCopy={copy}
                    code={`cluster:
  name: "my-cluster"
  endpoint: "https://my-opensearch:9200"
  username: "admin"
  password: "your-password"
  tls_skip_verify: true

saas:
  api_url: "https://app.opensearchdoctor.com"
  api_key: "${displayKey}"

agent:
  interval_minutes: 30
  heartbeat_seconds: 60`}
                  />
                  <div className="px-4 pb-3">
                    <p className="text-xs text-muted-foreground">
                      Save as <code className="font-mono bg-muted px-1 rounded">config.yaml</code> then run:{" "}
                      <code className="font-mono bg-muted px-1 rounded">./agent --config config.yaml</code>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Connection status */}
            <div className={`rounded-xl border p-3.5 flex items-center gap-3 transition-colors ${
              connected
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                : "bg-muted/40 border-border/60"
            }`}>
              {connected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Agent connected!</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Your cluster is now being monitored. Go to the dashboard to see it.</p>
                  </div>
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 text-muted-foreground shrink-0 animate-spin" />
                  <div>
                    <p className="text-sm font-medium">Waiting for agent to connect…</p>
                    <p className="text-xs text-muted-foreground">
                      Once the agent starts, your cluster will appear here automatically.
                      {pollCount > 0 && ` (checking every 5s)`}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between pt-1">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>← Back</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlatformCard({
  icon, label, description, badge, selected, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative text-left rounded-xl border p-4 transition-all hover:border-primary/50 ${
        selected ? "border-primary bg-primary/5" : "border-border/60"
      }`}
    >
      {badge && (
        <span className="absolute top-2.5 right-2.5 text-xs font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
          {badge}
        </span>
      )}
      <div className={`mb-2 ${selected ? "text-primary" : "text-muted-foreground"}`}>{icon}</div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </button>
  );
}

function InstallBlock({
  title, code, copyId, copiedBlock, onCopy,
}: {
  title: string;
  language: string;
  code: string;
  copyId: string;
  copiedBlock: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  return (
    <div className="rounded-xl bg-muted/60 border border-border/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        </div>
        <button
          onClick={() => onCopy(code, copyId)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copiedBlock === copyId ? (
            <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Copied</span></>
          ) : (
            <><Copy className="w-3 h-3" /><span>Copy</span></>
          )}
        </button>
      </div>
      <pre className="text-xs font-mono p-4 whitespace-pre-wrap leading-relaxed text-foreground overflow-x-auto">
        {code}
      </pre>
    </div>
  );
}
