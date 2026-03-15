"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Download, Key, PlayCircle, CheckCircle2, X, Terminal } from "lucide-react";

const STEPS = [
  { id: 1, title: "Generate key",   icon: Key },
  { id: 2, title: "Copy key",       icon: Download },
  { id: 3, title: "Run agent",      icon: PlayCircle },
];

export function OnboardingWizard({ onDismiss }: { onDismiss?: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [keyName, setKeyName] = useState("my-cluster");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

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
          <p className="text-sm text-muted-foreground">Follow 3 steps to start monitoring your OpenSearch cluster.</p>

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
        <div className="p-6 space-y-4">
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
                I&apos;ve copied it → Download agent
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/60 border border-border/60 overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/40">
                  <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">config.yaml</span>
                </div>
                <pre className="text-xs font-mono p-4 whitespace-pre-wrap leading-relaxed">{`cluster:
  name: "My Cluster"
  endpoint: "https://localhost:9200"
  username: "admin"
  password: "your-password"

saas:
  api_key: "${apiKey ?? "<your-key>"}"

agent:
  interval_minutes: 360`}</pre>
              </div>

              <div className="rounded-xl bg-muted/60 border border-border/60 overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/40">
                  <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Shell</span>
                </div>
                <pre className="text-xs font-mono p-4 leading-relaxed">{`./opensearch-doctor-agent --config config.yaml --test
./opensearch-doctor-agent --config config.yaml`}</pre>
              </div>

              <Button onClick={handleDone} className="w-full">
                Done — go to dashboard
              </Button>
            </div>
          )}

          <button
            className="text-xs text-muted-foreground hover:text-foreground w-full text-center transition-colors"
            onClick={handleDone}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
