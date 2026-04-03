"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Copy, Check, Download, Key, PlayCircle, CheckCircle2,
  X, Terminal, Loader2, Wifi, ExternalLink,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Generate key",  icon: Key },
  { id: 2, title: "Copy key",      icon: Download },
  { id: 3, title: "Install agent", icon: PlayCircle },
  { id: 4, title: "Connecting…",   icon: Wifi },
];

type OS = "linux" | "macos" | "windows";

const AGENT_BASE = "https://github.com/opensearch-doctor/agent/releases/latest/download";

const DOWNLOAD_OPTIONS: Record<OS, { label: string; file: string; cmd: string }[]> = {
  linux: [
    {
      label: "Linux x86_64",
      file: "agent-linux-amd64",
      cmd: `curl -Lo agent ${AGENT_BASE}/agent-linux-amd64\nchmod +x agent\n./agent --init`,
    },
    {
      label: "Linux ARM64",
      file: "agent-linux-arm64",
      cmd: `curl -Lo agent ${AGENT_BASE}/agent-linux-arm64\nchmod +x agent\n./agent --init`,
    },
  ],
  macos: [
    {
      label: "macOS Apple Silicon",
      file: "agent-darwin-arm64",
      cmd: `curl -Lo agent ${AGENT_BASE}/agent-darwin-arm64\nchmod +x agent\n./agent --init`,
    },
    {
      label: "macOS Intel",
      file: "agent-darwin-amd64",
      cmd: `curl -Lo agent ${AGENT_BASE}/agent-darwin-amd64\nchmod +x agent\n./agent --init`,
    },
  ],
  windows: [
    {
      label: "Windows x86_64",
      file: "agent-windows-amd64.exe",
      cmd: `Invoke-WebRequest -Uri "${AGENT_BASE}/agent-windows-amd64.exe" -OutFile agent.exe\n.\\agent.exe --init`,
    },
  ],
};

function detectOS(): OS {
  if (typeof navigator === "undefined") return "linux";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  return "linux";
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="rounded-xl bg-muted/60 border border-border/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        </div>
        <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="text-xs font-mono p-4 whitespace-pre-wrap leading-relaxed">{code}</pre>
    </div>
  );
}

export function OnboardingWizard({ onDismiss }: { onDismiss?: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [keyName, setKeyName] = useState("my-cluster");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [os, setOs] = useState<OS>("linux");
  const [osTab, setOsTab] = useState(0);
  const [agentConnected, setAgentConnected] = useState(false);
  const [connectedCluster, setConnectedCluster] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  // Detect OS on mount
  useEffect(() => {
    const detected = detectOS();
    setOs(detected);
    setOsTab(0);
  }, []);

  // Poll for agent connection when on step 4
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding-status");
      if (!res.ok) return;
      const data = await res.json();
      if (data.connected) {
        setAgentConnected(true);
        setConnectedCluster(data.clusterName);
        setPolling(false);
      }
    } catch {
      // network error — keep polling
    }
  }, []);

  useEffect(() => {
    if (step !== 4 || agentConnected) return;
    setPolling(true);
    const interval = setInterval(pollStatus, 5000);
    pollStatus(); // immediate first check
    return () => clearInterval(interval);
  }, [step, agentConnected, pollStatus]);

  async function generateKey() {
    setCreating(true);
    const res = await fetch("/api/agent/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: keyName || "my-cluster" }),
    });
    const data = await res.json();
    setCreating(false);
    if (res.ok) {
      setApiKey(data.rawKey);
      setStep(2);
    }
  }

  function copyKey() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDone() {
    if (onDismiss) onDismiss();
    else router.replace("/dashboard");
  }

  function goToDashboard() {
    router.replace("/dashboard");
  }

  const downloads = DOWNLOAD_OPTIONS[os];
  const currentDownload = downloads[osTab] ?? downloads[0];

  const configSnippet = `cluster:
  name: "My Cluster"
  endpoint: "https://localhost:9200"
  username: "admin"
  password: "your-password"
  tls_skip_verify: true

saas:
  api_key: "${apiKey ?? "<paste-your-key>"}"

agent:
  interval_minutes: 360`;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card rounded-2xl border border-border/60 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-border/60 relative">
          <button
            onClick={handleDone}
            className="absolute right-5 top-5 w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <h2 className="text-base font-bold mb-0.5">Connect your first cluster</h2>
          <p className="text-sm text-muted-foreground">Follow 4 steps to start monitoring your OpenSearch cluster.</p>

          {/* Step indicators */}
          <div className="flex items-center gap-0 mt-4">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    step > s.id
                      ? "bg-primary text-primary-foreground"
                      : step === s.id
                      ? "border-2 border-primary text-primary bg-primary/5"
                      : "border-2 border-border text-muted-foreground"
                  }`}>
                    {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${
                    step >= s.id ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {s.title}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 transition-colors ${step > s.id ? "bg-primary/40" : "bg-border/60"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Step 1 — Generate key */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Give this key a name to identify which cluster it belongs to.
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Key name</Label>
                <Input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. production-cluster"
                  onKeyDown={(e) => e.key === "Enter" && generateKey()}
                />
              </div>
              <Button onClick={generateKey} disabled={creating} className="w-full">
                {creating ? "Generating…" : "Generate API key →"}
              </Button>
            </div>
          )}

          {/* Step 2 — Copy key */}
          {step === 2 && apiKey && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-2.5">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Copy this key — it won&apos;t be shown again
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white dark:bg-background border border-border/60 rounded-lg px-3 py-2 font-mono break-all">
                    {apiKey}
                  </code>
                  <Button variant="outline" size="sm" className="shrink-0 h-9 w-9 p-0" onClick={copyKey}>
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={() => setStep(3)} className="w-full">
                I&apos;ve copied it → Install agent
              </Button>
            </div>
          )}

          {/* Step 3 — Download & install */}
          {step === 3 && (
            <div className="space-y-4">
              {/* OS tabs */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Your platform</Label>
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  {(["linux", "macos", "windows"] as OS[]).map((o) => (
                    <button
                      key={o}
                      onClick={() => { setOs(o); setOsTab(0); }}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${
                        os === o
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {o === "macos" ? "macOS" : o.charAt(0).toUpperCase() + o.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Architecture sub-tabs (only for Linux/macOS) */}
              {downloads.length > 1 && (
                <div className="flex gap-2">
                  {downloads.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => setOsTab(i)}
                      className={`text-xs px-3 py-1 rounded-full border transition-all ${
                        osTab === i
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Download button */}
              <a
                href={`${AGENT_BASE}/${currentDownload.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-border/60 hover:border-primary/60 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div>
                    <div className="text-sm font-semibold">{currentDownload.label}</div>
                    <div className="text-xs text-muted-foreground">{currentDownload.file}</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>

              {/* Install command */}
              <CodeBlock
                code={currentDownload.cmd}
                label={os === "windows" ? "PowerShell" : "Terminal"}
              />

              {/* Config preview with key pre-filled */}
              <CodeBlock code={configSnippet} label="config.yaml (auto-generated by --init)" />

              <Button onClick={() => setStep(4)} className="w-full">
                I&apos;ve run the agent → Waiting for connection
              </Button>
            </div>
          )}

          {/* Step 4 — Waiting for agent */}
          {step === 4 && !agentConnected && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6 gap-4 text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">Waiting for agent to connect…</p>
                  <p className="text-sm text-muted-foreground">
                    This page checks automatically every 5 seconds.
                    <br />
                    Once the agent sends its first heartbeat, you&apos;ll be taken to the dashboard.
                  </p>
                </div>

                <div className="w-full rounded-xl bg-muted/60 border border-border/60 p-4 text-left space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Still not connected? Check that</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>The agent binary is running (not just downloaded)</li>
                    <li>The <code className="font-mono bg-muted px-1 rounded">saas.api_key</code> in your config matches the key you copied</li>
                    <li>The server can reach <code className="font-mono bg-muted px-1 rounded">opensearchdoctor.com</code> on port 443</li>
                    <li>You ran <code className="font-mono bg-muted px-1 rounded">--init</code> to completion (it tested the key before saving)</li>
                  </ul>
                </div>
              </div>

              {polling && (
                <p className="text-xs text-center text-muted-foreground">
                  Checking…
                </p>
              )}

              <button
                className="text-xs text-muted-foreground hover:text-foreground w-full text-center transition-colors"
                onClick={handleDone}
              >
                Skip for now — go to dashboard
              </button>
            </div>
          )}

          {/* Step 4 — Connected! */}
          {step === 4 && agentConnected && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border-4 border-emerald-200 dark:border-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">
                    Agent connected!
                  </p>
                  {connectedCluster && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{connectedCluster}</span> is online.
                      <br />
                      Your first diagnostic is starting now.
                    </p>
                  )}
                </div>
              </div>
              <Button onClick={goToDashboard} className="w-full">
                Go to dashboard →
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
