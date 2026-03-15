/**
 * Notification dispatcher — sends alerts via email (Resend), Slack, and custom webhooks.
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
  CLUSTER_STATUS_RED: "Cluster status is RED",
  CLUSTER_STATUS_YELLOW: "Cluster status is YELLOW",
  HEAP_USAGE_HIGH: "JVM heap usage is high",
  DISK_USAGE_HIGH: "Disk usage is high",
  UNASSIGNED_SHARDS: "Unassigned shards detected",
  NO_RECENT_SNAPSHOT: "No recent snapshot",
  AGENT_OFFLINE: "Agent is offline",
  HEALTH_SCORE_LOW: "Health score is low",
};

interface NotifyParams {
  event: AlertEvent;
  rule: AlertRule;
  ctx: AlertContext;
  channels: NotificationChannel[];
  transition: "firing" | "resolved";
}

export async function notify({ event, rule, ctx, channels, transition }: NotifyParams) {
  const label = RULE_LABELS[rule.ruleKey] ?? rule.ruleKey;
  const isFiring = transition === "firing";
  const subject = isFiring
    ? `🔴 Alert: ${label} — ${ctx.clusterName}`
    : `✅ Resolved: ${label} — ${ctx.clusterName}`;

  const notifiedChannels: string[] = [];

  for (const channel of channels) {
    try {
      if (channel.type === "EMAIL") {
        const cfg = channel.config as { email?: string };
        const to = cfg.email;
        if (!to) continue;
        await sendEmail({ to, subject, label, clusterName: ctx.clusterName, isFiring, clusterId: ctx.clusterId });
        notifiedChannels.push(channel.id);
      } else if (channel.type === "SLACK") {
        const cfg = channel.config as { webhookUrl?: string };
        if (!cfg.webhookUrl) continue;
        await sendSlack({ webhookUrl: cfg.webhookUrl, subject, label, clusterName: ctx.clusterName, isFiring });
        notifiedChannels.push(channel.id);
      } else if (channel.type === "WEBHOOK") {
        const cfg = channel.config as { url?: string };
        if (!cfg.url) continue;
        await sendWebhook({ url: cfg.url, event, rule, ctx, transition });
        notifiedChannels.push(channel.id);
      }
    } catch (err) {
      console.error(`Failed to notify channel ${channel.id}:`, err);
    }
  }

  // Record which channels were notified
  await prisma.alertEvent.update({
    where: { id: event.id },
    data: { notifiedChannels },
  });
}

async function sendEmail({
  to, subject, label, clusterName, isFiring, clusterId,
}: {
  to: string; subject: string; label: string; clusterName: string;
  isFiring: boolean; clusterId: string;
}) {
  const appUrl = process.env.NEXTAUTH_URL ?? (
    process.env.NODE_ENV === "production"
      ? (() => { throw new Error("NEXTAUTH_URL must be set in production"); })()
      : "http://localhost:3000"
  );
  const color = isFiring ? "#ef4444" : "#10b981";
  const statusText = isFiring ? "FIRING" : "RESOLVED";

  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background: #f9fafb; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;">
    <div style="background: ${color}; padding: 16px 24px;">
      <h1 style="color: white; margin: 0; font-size: 16px;">
        ${isFiring ? "🔴" : "✅"} Alert ${statusText}
      </h1>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 18px; font-weight: 600; margin: 0 0 8px;">${label}</p>
      <p style="color: #6b7280; margin: 0 0 20px;">Cluster: <strong>${clusterName}</strong></p>
      ${isFiring
        ? `<p style="color: #374151; margin: 0 0 20px;">This alert was triggered during the latest diagnostic run. Visit your dashboard to review findings and take action.</p>`
        : `<p style="color: #374151; margin: 0 0 20px;">This condition has been resolved. Your cluster is back to normal for this check.</p>`
      }
      <a href="${appUrl}/clusters/${clusterId}"
         style="display: inline-block; background: #111827; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">
        View cluster →
      </a>
    </div>
    <div style="padding: 12px 24px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        Sent by <a href="${appUrl}" style="color: #6b7280;">OpenSearch Doctor</a>.
        Manage alerts in your <a href="${appUrl}/alerts" style="color: #6b7280;">dashboard</a>.
      </p>
    </div>
  </div>
</body>
</html>`,
  });
}

async function sendSlack({
  webhookUrl, subject, label, clusterName, isFiring,
}: {
  webhookUrl: string; subject: string; label: string;
  clusterName: string; isFiring: boolean;
}) {
  const check = validateWebhookUrl(webhookUrl);
  if (!check.ok) throw new Error(`Slack webhook URL rejected: ${check.error}`);

  const color = isFiring ? "#ef4444" : "#10b981";
  const icon = isFiring ? ":red_circle:" : ":white_check_mark:";

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `${icon} *${subject}*`,
      attachments: [
        {
          color,
          fields: [
            { title: "Cluster", value: clusterName, short: true },
            { title: "Alert", value: label, short: true },
            { title: "Status", value: isFiring ? "FIRING" : "RESOLVED", short: true },
          ],
        },
      ],
    }),
  });
}

async function sendWebhook({
  url, event, rule, ctx, transition,
}: {
  url: string; event: AlertEvent; rule: AlertRule;
  ctx: AlertContext; transition: string;
}) {
  const check = validateWebhookUrl(url);
  if (!check.ok) throw new Error(`Webhook URL rejected: ${check.error}`);

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "alert",
      transition,
      clusterId: ctx.clusterId,
      clusterName: ctx.clusterName,
      ruleKey: rule.ruleKey,
      eventId: event.id,
      firedAt: event.firedAt,
      healthScore: ctx.result.healthScore,
    }),
  });
}

// Test a channel by sending a sample notification
export async function testChannel(
  channel: NotificationChannel,
  clusterName = "Test Cluster",
  clusterId = "test"
) {
  const subject = "🔔 Test notification — OpenSearch Doctor";
  try {
    if (channel.type === "EMAIL") {
      const cfg = channel.config as { email?: string };
      if (!cfg.email) throw new Error("No email configured");
      await sendEmail({ to: cfg.email, subject, label: "Test alert", clusterName, isFiring: true, clusterId });
    } else if (channel.type === "SLACK") {
      const cfg = channel.config as { webhookUrl?: string };
      if (!cfg.webhookUrl) throw new Error("No webhook URL configured");
      await sendSlack({ webhookUrl: cfg.webhookUrl, subject, label: "Test alert", clusterName, isFiring: true });
    } else if (channel.type === "WEBHOOK") {
      const cfg = channel.config as { url?: string };
      if (!cfg.url) throw new Error("No URL configured");
      const check = validateWebhookUrl(cfg.url);
      if (!check.ok) throw new Error(`Webhook URL rejected: ${check.error}`);
      await fetch(cfg.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "test", source: "opensearch-doctor", clusterName }),
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
