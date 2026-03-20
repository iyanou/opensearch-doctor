/**
 * Notification dispatcher — sends alerts via email (Resend), Slack, and custom webhooks.
 * notifyBatch: one notification per diagnostic run summarising all state changes.
 * notify: single-event notification used by the agent-offline cron.
 */
import { Resend } from "resend";
import type { AlertRule, AlertEvent, NotificationChannel } from "@prisma/client";
import type { AlertContext } from "./types";
import { prisma } from "@/lib/prisma";
import { validateWebhookUrl } from "@/lib/safe-fetch";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
  return new Resend(process.env.RESEND_API_KEY);
}
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "alerts@opensearchdoctor.com";

const RULE_LABELS: Record<string, string> = {
  CLUSTER_STATUS_RED:    "Cluster status is RED",
  CLUSTER_STATUS_YELLOW: "Cluster status is YELLOW",
  HEAP_USAGE_HIGH:       "JVM heap usage is high",
  DISK_USAGE_HIGH:       "Disk usage is high",
  UNASSIGNED_SHARDS:     "Unassigned shards detected",
  NO_RECENT_SNAPSHOT:    "No recent snapshot",
  AGENT_OFFLINE:         "Agent is offline",
  HEALTH_SCORE_LOW:      "Health score is low",
};

const RULE_ICONS: Record<string, string> = {
  CLUSTER_STATUS_RED:    "🔴",
  CLUSTER_STATUS_YELLOW: "🟡",
  HEAP_USAGE_HIGH:       "📈",
  DISK_USAGE_HIGH:       "💾",
  UNASSIGNED_SHARDS:     "⚠️",
  NO_RECENT_SNAPSHOT:    "📸",
  AGENT_OFFLINE:         "📡",
  HEALTH_SCORE_LOW:      "📉",
};

interface BatchEntry { event: AlertEvent; rule: AlertRule }

interface NotifyBatchParams {
  newlyFired: BatchEntry[];
  newlyResolved: BatchEntry[];
  ctx: AlertContext;
  channels: NotificationChannel[];
}

/** Send one notification per channel summarising all changes from one diagnostic run. */
export async function notifyBatch({ newlyFired, newlyResolved, ctx, channels }: NotifyBatchParams) {
  const notifiedChannels: string[] = [];

  for (const channel of channels) {
    try {
      if (channel.type === "EMAIL") {
        const cfg = channel.config as { email?: string };
        if (!cfg.email) continue;
        await sendBatchEmail({ to: cfg.email, newlyFired, newlyResolved, ctx });
        notifiedChannels.push(channel.id);
      } else if (channel.type === "SLACK") {
        const cfg = channel.config as { webhookUrl?: string };
        if (!cfg.webhookUrl) continue;
        await sendBatchSlack({ webhookUrl: cfg.webhookUrl, newlyFired, newlyResolved, ctx });
        notifiedChannels.push(channel.id);
      } else if (channel.type === "WEBHOOK") {
        const cfg = channel.config as { url?: string };
        if (!cfg.url) continue;
        await sendBatchWebhook({ url: cfg.url, newlyFired, newlyResolved, ctx });
        notifiedChannels.push(channel.id);
      }
    } catch (err) {
      console.error(`Failed to notify channel ${channel.id}:`, err);
    }
  }

  // Record notified channels on all newly fired events
  if (notifiedChannels.length > 0) {
    await Promise.all(
      [...newlyFired, ...newlyResolved].map(({ event }) =>
        prisma.alertEvent.update({ where: { id: event.id }, data: { notifiedChannels } }).catch(() => {})
      )
    );
  }
}

/** Single-event notification used by the agent-offline cron. */
export async function notify({
  event, rule, ctx, channels, transition,
}: {
  event: AlertEvent;
  rule: AlertRule;
  ctx: AlertContext;
  channels: NotificationChannel[];
  transition: "firing" | "resolved";
}) {
  const entry: BatchEntry = { event, rule };
  await notifyBatch({
    newlyFired: transition === "firing" ? [entry] : [],
    newlyResolved: transition === "resolved" ? [entry] : [],
    ctx,
    channels,
  });
}

// ── Email ────────────────────────────────────────────────────────────────────

async function sendBatchEmail({
  to, newlyFired, newlyResolved, ctx,
}: {
  to: string;
  newlyFired: BatchEntry[];
  newlyResolved: BatchEntry[];
  ctx: AlertContext;
}) {
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const totalFiring = newlyFired.length;
  const totalResolved = newlyResolved.length;

  const subject = totalFiring > 0
    ? `🔴 ${totalFiring} alert${totalFiring > 1 ? "s" : ""} firing — ${ctx.clusterName}`
    : `✅ ${totalResolved} alert${totalResolved > 1 ? "s" : ""} resolved — ${ctx.clusterName}`;

  function ruleRows(entries: BatchEntry[], color: string, emoji: string) {
    return entries.map(({ rule }) => {
      const label = RULE_LABELS[rule.ruleKey] ?? rule.ruleKey;
      const icon = RULE_ICONS[rule.ruleKey] ?? "⚡";
      return `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="font-size: 16px;">${icon}</span>
            <span style="margin-left: 8px; font-size: 14px; color: ${color}; font-weight: 600;">${label}</span>
            ${rule.threshold ? `<span style="margin-left: 8px; font-size: 11px; color: #9ca3af; font-family: monospace;">threshold: ${rule.threshold}</span>` : ""}
          </td>
        </tr>`;
    }).join("");
  }

  const firingSection = newlyFired.length > 0 ? `
    <p style="font-size: 13px; font-weight: 700; color: #ef4444; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">
      🔴 Now Firing
    </p>
    <table style="width: 100%; border-collapse: collapse;">
      ${ruleRows(newlyFired, "#ef4444", "🔴")}
    </table>` : "";

  const resolvedSection = newlyResolved.length > 0 ? `
    <p style="font-size: 13px; font-weight: 700; color: #10b981; margin: 20px 0 8px; text-transform: uppercase; letter-spacing: 0.05em;">
      ✅ Resolved
    </p>
    <table style="width: 100%; border-collapse: collapse;">
      ${ruleRows(newlyResolved, "#10b981", "✅")}
    </table>` : "";

  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background: #f9fafb; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
    <div style="background: ${totalFiring > 0 ? "#ef4444" : "#10b981"}; padding: 16px 24px;">
      <h1 style="color: white; margin: 0; font-size: 16px;">${subject}</h1>
    </div>
    <div style="padding: 24px;">
      <p style="color: #6b7280; margin: 0 0 4px; font-size: 13px;">Cluster</p>
      <p style="font-size: 15px; font-weight: 700; margin: 0 0 16px;">${ctx.clusterName}</p>
      <p style="color: #6b7280; margin: 0 0 4px; font-size: 13px;">Health score</p>
      <p style="font-size: 15px; font-weight: 700; margin: 0 0 16px;">${ctx.result.healthScore}</p>
      ${firingSection}
      ${resolvedSection}
      <div style="margin-top: 24px;">
        <a href="${appUrl}/clusters/${ctx.clusterId}"
           style="display: inline-block; background: #111827; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; margin-right: 8px;">
          View cluster →
        </a>
        <a href="${appUrl}/alerts"
           style="display: inline-block; background: #f3f4f6; color: #374151; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">
          All alerts
        </a>
      </div>
    </div>
    <div style="padding: 12px 24px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Sent by <a href="${appUrl}" style="color: #6b7280;">OpenSearch Doctor</a>.
        Manage alerts in your <a href="${appUrl}/settings?tab=notifications" style="color: #6b7280;">notification settings</a>.
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ── Slack ────────────────────────────────────────────────────────────────────

async function sendBatchSlack({
  webhookUrl, newlyFired, newlyResolved, ctx,
}: {
  webhookUrl: string;
  newlyFired: BatchEntry[];
  newlyResolved: BatchEntry[];
  ctx: AlertContext;
}) {
  const check = validateWebhookUrl(webhookUrl);
  if (!check.ok) throw new Error(`Slack webhook URL rejected: ${check.error}`);

  const fields = [];
  if (newlyFired.length > 0) {
    fields.push({
      title: "🔴 Now Firing",
      value: newlyFired.map(({ rule }) => `• ${RULE_LABELS[rule.ruleKey] ?? rule.ruleKey}`).join("\n"),
      short: false,
    });
  }
  if (newlyResolved.length > 0) {
    fields.push({
      title: "✅ Resolved",
      value: newlyResolved.map(({ rule }) => `• ${RULE_LABELS[rule.ruleKey] ?? rule.ruleKey}`).join("\n"),
      short: false,
    });
  }

  const color = newlyFired.length > 0 ? "#ef4444" : "#10b981";
  const summary = newlyFired.length > 0
    ? `🔴 *${newlyFired.length} alert${newlyFired.length > 1 ? "s" : ""} firing* on *${ctx.clusterName}*`
    : `✅ *${newlyResolved.length} alert${newlyResolved.length > 1 ? "s" : ""} resolved* on *${ctx.clusterName}*`;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: summary,
      attachments: [{ color, fields }],
    }),
  });
}

// ── Custom Webhook ───────────────────────────────────────────────────────────

async function sendBatchWebhook({
  url, newlyFired, newlyResolved, ctx,
}: {
  url: string;
  newlyFired: BatchEntry[];
  newlyResolved: BatchEntry[];
  ctx: AlertContext;
}) {
  const check = validateWebhookUrl(url);
  if (!check.ok) throw new Error(`Webhook URL rejected: ${check.error}`);

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "alert_batch",
      clusterId: ctx.clusterId,
      clusterName: ctx.clusterName,
      healthScore: ctx.result.healthScore,
      newlyFired: newlyFired.map(({ rule, event }) => ({
        ruleKey: rule.ruleKey,
        eventId: event.id,
        firedAt: event.firedAt,
        threshold: rule.threshold,
      })),
      newlyResolved: newlyResolved.map(({ rule, event }) => ({
        ruleKey: rule.ruleKey,
        eventId: event.id,
        resolvedAt: event.resolvedAt,
      })),
    }),
  });
}

// ── Test channel ─────────────────────────────────────────────────────────────

export async function testChannel(
  channel: NotificationChannel,
  clusterName = "Test Cluster",
  clusterId = "test"
) {
  const fakeCtx: AlertContext = {
    clusterId,
    userId: "",
    clusterName,
    result: { findings: [], metrics: [], healthScore: 82 },
    payload: {},
  };
  const fakeRule = {
    id: "test",
    clusterId,
    ruleKey: "HEALTH_SCORE_LOW" as const,
    enabled: true,
    threshold: 70,
    cooldownUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const fakeEvent = {
    id: "test",
    clusterId,
    ruleId: "test",
    status: "FIRING" as const,
    firedAt: new Date(),
    resolvedAt: null,
    snoozedUntil: null,
    acknowledgedAt: null,
    notifiedChannels: null,
  };

  try {
    await notifyBatch({
      newlyFired: [{ event: fakeEvent, rule: fakeRule }],
      newlyResolved: [],
      ctx: fakeCtx,
      channels: [channel],
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
