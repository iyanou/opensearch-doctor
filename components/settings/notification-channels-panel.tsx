"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Mail, Slack, Webhook, Plus, Trash2, TestTube2, Loader2, Bell, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface Channel {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  config: Record<string, string>;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  EMAIL:   <Mail    className="w-3.5 h-3.5" />,
  SLACK:   <Slack   className="w-3.5 h-3.5" />,
  WEBHOOK: <Webhook className="w-3.5 h-3.5" />,
};

const TYPE_LABELS: Record<string, string> = {
  EMAIL:   "Email",
  SLACK:   "Slack",
  WEBHOOK: "Webhook",
};

const TYPE_COLORS: Record<string, string> = {
  EMAIL:   "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  SLACK:   "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
  WEBHOOK: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400 border-orange-200 dark:border-orange-500/20",
};

function ChannelRow({ channel, onDelete, onToggle }: {
  channel: Channel;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/notification-channels/${channel.id}/test`, { method: "POST" });
      const data = await res.json();
      setTestResult({ ok: res.ok && data.ok !== false, message: data.message ?? (res.ok ? "Sent successfully" : "Failed") });
    } catch {
      setTestResult({ ok: false, message: "Request failed" });
    }
    setTesting(false);
    setTimeout(() => setTestResult(null), 5000);
  }

  const destination = channel.config.email ?? channel.config.webhookUrl ?? "—";

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors">
      {/* Type icon badge */}
      <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg border shrink-0 ${TYPE_COLORS[channel.type] ?? "bg-muted text-muted-foreground"}`}>
        {TYPE_ICONS[channel.type]}
        <span className="hidden sm:inline">{TYPE_LABELS[channel.type]}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{channel.name}</p>
        <p className="text-xs text-muted-foreground truncate">{destination}</p>
      </div>

      {/* Test result */}
      {testResult && (
        <div className={`hidden sm:flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
          testResult.ok
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
        }`}>
          {testResult.ok
            ? <CheckCircle2 className="w-3 h-3" />
            : <XCircle className="w-3 h-3" />}
          {testResult.message}
        </div>
      )}

      {/* Test button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs shrink-0 text-muted-foreground hover:text-foreground"
        onClick={handleTest}
        disabled={testing}
      >
        {testing
          ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
          : <TestTube2 className="w-3.5 h-3.5 mr-1" />}
        Test
      </Button>

      <Switch
        checked={channel.enabled}
        onCheckedChange={(v) => onToggle(channel.id, v)}
        className="shrink-0"
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
        onClick={() => onDelete(channel.id)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

interface AddFormState {
  type: string;
  name: string;
  email: string;
  webhookUrl: string;
}

const EMPTY_FORM: AddFormState = { type: "EMAIL", name: "", email: "", webhookUrl: "" };

export function NotificationChannelsPanel({ initialChannels }: { initialChannels: Channel[] }) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (form.type === "EMAIL" && !form.email.trim()) { setError("Email address is required"); return; }
    if ((form.type === "SLACK" || form.type === "WEBHOOK") && !form.webhookUrl.trim()) {
      setError("Webhook URL is required"); return;
    }

    setSaving(true);
    const config: Record<string, string> = {};
    if (form.type === "EMAIL") config.email = form.email.trim();
    else config.webhookUrl = form.webhookUrl.trim();

    const res = await fetch("/api/notification-channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: form.type, name: form.name.trim(), config }),
    });

    if (res.ok) {
      const ch = await res.json();
      setChannels((prev) => [ch, ...prev]);
      setAdding(false);
      setForm(EMPTY_FORM);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create channel");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/notification-channels/${id}`, { method: "DELETE" });
    if (res.ok) setChannels((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleToggle(id: string, enabled: boolean) {
    setChannels((prev) => prev.map((c) => c.id === id ? { ...c, enabled } : c));
    await fetch(`/api/notification-channels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <Bell className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-bold">Notification Channels</h3>
        {!adding && (
          <Button size="sm" variant="outline" className="ml-auto h-8" onClick={() => setAdding(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Channel
          </Button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="p-5 border-b border-border/60 bg-muted/20">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v ?? "EMAIL" }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Name</Label>
                <Input
                  className="h-9 text-sm"
                  placeholder="e.g. Ops Team"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
            </div>

            {form.type === "EMAIL" ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
                  className="h-9 text-sm"
                  type="email"
                  placeholder="alerts@yourcompany.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  {form.type === "SLACK" ? "Slack Webhook URL" : "Webhook URL"}
                </Label>
                <Input
                  className="h-9 text-sm"
                  placeholder={form.type === "SLACK" ? "https://hooks.slack.com/services/..." : "https://..."}
                  value={form.webhookUrl}
                  onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                />
                {form.type === "SLACK" && (
                  <p className="text-xs text-muted-foreground">Create an incoming webhook at api.slack.com/apps</p>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={saving}>
                {saving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                Save channel
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setAdding(false); setForm(EMPTY_FORM); setError(null); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Channel list */}
      {channels.length === 0 && !adding ? (
        <div className="py-10 text-center">
          <Bell className="w-7 h-7 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No channels configured.</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Add one to receive alert notifications.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {channels.map((ch) => (
            <ChannelRow
              key={ch.id}
              channel={ch}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
