/**
 * Onboarding email sequence — 5 emails sent over the 14-day trial.
 *
 * Email 1 — WELCOME       Day 0   (instant on signup)         Always sent
 * Email 2 — STUCK_SETUP   Day 2   (if no diagnostic yet)      Helps activate
 * Email 3 — EDUCATION     Day 5   (if diagnostic exists)       Builds value
 * Email 4 — TRIAL_ENDING  Day 10  (if still on FREE_TRIAL)    Conversion nudge
 * Email 5 — LAST_CHANCE   Day 13  (if still on FREE_TRIAL)    Final CTA
 *
 * All emails signed personally by Eraste — not "the team".
 * Tracking: onboarding_emails table prevents duplicate sends.
 */

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const FROM      = process.env.RESEND_FROM_EMAIL ?? "noreply@opensearchdoctor.com";
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? "https://opensearchdoctor.com";
const SENDER    = "Eraste from OpenSearch Doctor";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
  return new Resend(process.env.RESEND_API_KEY);
}

// ── Shared HTML wrapper ───────────────────────────────────────────────────────

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 10px; border: 1px solid #e5e7eb; overflow: hidden;">

    <!-- Header -->
    <div style="background: #111827; padding: 20px 28px; display: flex; align-items: center;">
      <span style="color: white; font-size: 15px; font-weight: 700; letter-spacing: -0.3px;">OpenSearch Doctor</span>
    </div>

    <!-- Body -->
    <div style="padding: 28px; color: #111827; font-size: 15px; line-height: 1.6;">
      ${body}
    </div>

    <!-- Footer -->
    <div style="padding: 16px 28px; border-top: 1px solid #f3f4f6; background: #f9fafb;">
      <p style="font-size: 12px; color: #9ca3af; margin: 0;">
        OpenSearch Doctor · <a href="${APP_URL}" style="color: #6b7280; text-decoration: none;">opensearchdoctor.com</a>
        · <a href="${APP_URL}/settings?tab=notifications" style="color: #6b7280; text-decoration: none;">Manage notifications</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display: inline-block; background: #111827; color: white; padding: 11px 22px; border-radius: 7px; text-decoration: none; font-size: 14px; font-weight: 600; margin-top: 4px;">${label} →</a>`;
}

function codeBlock(code: string): string {
  return `<div style="background: #1e293b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
    <code style="color: #e2e8f0; font-family: 'Courier New', monospace; font-size: 13px; white-space: pre-wrap; word-break: break-all;">${code}</code>
  </div>`;
}

// ── Email 1 — Welcome ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string | null) {
  const firstName = name ? name.split(" ")[0] : "there";
  const subject   = "Get your first diagnostic in 5 minutes";

  const html = wrap(`
    <p>Hi ${firstName},</p>
    <p>Welcome to OpenSearch Doctor — glad you're here.</p>
    <p>Here's how to connect your first cluster in 3 steps:</p>

    <p style="margin: 0; font-weight: 600; color: #374151;">Step 1 — Create an agent key</p>
    <p style="margin: 4px 0 12px;">Go to <a href="${APP_URL}/settings?tab=agent-keys" style="color: #2563eb;">Settings → Agent Keys</a> and create a new key. Copy it — you'll need it in Step 3.</p>

    <p style="margin: 0; font-weight: 600; color: #374151;">Step 2 — Download the agent</p>
    <p style="margin: 4px 0 4px;">Run this on your server (Linux/macOS):</p>
    ${codeBlock(`curl -L https://github.com/eraXXX/opensearch-doctor-agent/releases/latest/download/osd-agent-linux-amd64 -o osd-agent && chmod +x osd-agent`)}

    <p style="margin: 0; font-weight: 600; color: #374151;">Step 3 — Connect your cluster</p>
    ${codeBlock(`./osd-agent --api-url https://opensearchdoctor.com --api-key YOUR_AGENT_KEY --cluster-url http://localhost:9200`)}

    <p>Within 30 minutes you'll see your first diagnostic session in the dashboard.</p>

    ${btn(APP_URL + "/settings?tab=quick-start", "Go to Quick Start")}

    <p style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 14px; color: #6b7280;">
      If you hit any issues during setup, reply to this email — I read them personally and will help you get sorted.
    </p>
    <p style="font-size: 14px; margin: 0;">Eraste<br><span style="color: #9ca3af;">Founder, OpenSearch Doctor</span></p>
  `);

  await getResend().emails.send({ from: `${SENDER} <${FROM}>`, to, subject, html });
}

// ── Email 2 — Stuck on setup ─────────────────────────────────────────────────

export async function sendStuckSetupEmail(to: string, name: string | null) {
  const firstName = name ? name.split(" ")[0] : "there";
  const subject   = "Stuck on setup? Here's what trips people up";

  const html = wrap(`
    <p>Hi ${firstName},</p>
    <p>I noticed you haven't connected a cluster yet — that's the step where most people get stuck, so I wanted to check in.</p>
    <p>Here are the 3 most common issues and how to fix them:</p>

    <p style="margin: 8px 0 4px; font-weight: 600;">1. "Connection refused" or timeout</p>
    <p style="margin: 0 0 12px; color: #374151;">Your cluster URL might be wrong. If OpenSearch runs locally on the server, use <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px;">http://localhost:9200</code> — not the public IP.</p>

    <p style="margin: 8px 0 4px; font-weight: 600;">2. "Unauthorized" error</p>
    <p style="margin: 0 0 12px; color: #374151;">If your cluster has security enabled, add <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px;">--cluster-user admin --cluster-password yourpassword</code> to the agent command.</p>

    <p style="margin: 8px 0 4px; font-weight: 600;">3. Agent starts but no data appears</p>
    <p style="margin: 0 0 12px; color: #374151;">The first diagnostic runs 30 minutes after the agent connects. Check the agent logs with <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 13px;">./osd-agent --help</code> to see log options.</p>

    ${btn(APP_URL + "/docs/installation", "View full installation docs")}

    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
      Still stuck? Reply here with the error message you're seeing and I'll help you fix it directly.
      <br>Your 14-day trial is still running — let's make sure you actually get value from it.
    </p>
    <p style="font-size: 14px; margin: 0;">Eraste<br><span style="color: #9ca3af;">Founder, OpenSearch Doctor</span></p>
  `);

  await getResend().emails.send({ from: `${SENDER} <${FROM}>`, to, subject, html });
}

// ── Email 3 — Education ───────────────────────────────────────────────────────

export async function sendEducationEmail(to: string, name: string | null) {
  const firstName = name ? name.split(" ")[0] : "there";
  const subject   = "The 3 OpenSearch metrics that actually matter";

  const html = wrap(`
    <p>Hi ${firstName},</p>
    <p>Your agent is running — that's great. Now let me tell you what to actually watch for in your diagnostics.</p>
    <p>In my experience monitoring dozens of OpenSearch clusters, these 3 metrics cause 80% of incidents:</p>

    <div style="border-left: 3px solid #ef4444; padding: 12px 16px; margin: 16px 0; background: #fef2f2; border-radius: 0 6px 6px 0;">
      <p style="margin: 0 0 4px; font-weight: 700; color: #dc2626;">🔴 JVM Heap Usage above 75%</p>
      <p style="margin: 0; font-size: 14px; color: #374151;">When heap crosses 75%, OpenSearch starts spending more time on garbage collection than on serving requests. Latency spikes. At 85%, you risk an OOM crash. Watch this closely — it's the #1 cause of unexpected downtime.</p>
    </div>

    <div style="border-left: 3px solid #f59e0b; padding: 12px 16px; margin: 16px 0; background: #fffbeb; border-radius: 0 6px 6px 0;">
      <p style="margin: 0 0 4px; font-weight: 700; color: #d97706;">🟡 Unassigned Shards</p>
      <p style="margin: 0; font-size: 14px; color: #374151;">Even 1 unassigned shard means your cluster status goes YELLOW. At YELLOW, you have no redundancy for those shards — any node failure could make that data temporarily unavailable. Understand why shards are unassigned before assuming they'll self-heal.</p>
    </div>

    <div style="border-left: 3px solid #f59e0b; padding: 12px 16px; margin: 16px 0; background: #fffbeb; border-radius: 0 6px 6px 0;">
      <p style="margin: 0 0 4px; font-weight: 700; color: #d97706;">🟡 Disk Usage above 80%</p>
      <p style="margin: 0; font-size: 14px; color: #374151;">OpenSearch has a built-in flood-stage watermark at 95% — at that point it makes all indices read-only and stops accepting writes entirely. By 80% you should already be planning capacity. OpenSearch Doctor will alert you before you hit the flood stage.</p>
    </div>

    <p>Go check your current values in the dashboard:</p>

    ${btn(APP_URL + "/dashboard", "Open dashboard")}

    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
      Any questions about what you're seeing? Hit reply — I'm happy to help interpret your specific diagnostics.
    </p>
    <p style="font-size: 14px; margin: 0;">Eraste<br><span style="color: #9ca3af;">Founder, OpenSearch Doctor</span></p>
  `);

  await getResend().emails.send({ from: `${SENDER} <${FROM}>`, to, subject, html });
}

// ── Email 4 — Trial ending ────────────────────────────────────────────────────

export async function sendTrialEndingEmail(to: string, name: string | null) {
  const firstName = name ? name.split(" ")[0] : "there";
  const subject   = "Your OpenSearch Doctor trial ends in 4 days";

  const html = wrap(`
    <p>Hi ${firstName},</p>
    <p>Your 14-day free trial ends in 4 days. I wanted to give you a heads-up so you don't lose access to your monitoring unexpectedly.</p>

    <p style="font-weight: 600; margin-bottom: 8px;">What happens when the trial ends:</p>
    <ul style="color: #374151; padding-left: 20px; margin: 0 0 16px;">
      <li style="margin-bottom: 6px;">Your agent stops sending diagnostics to the dashboard</li>
      <li style="margin-bottom: 6px;">Alert rules stop firing — no more email notifications</li>
      <li style="margin-bottom: 6px;">Your diagnostic history is preserved for 30 days</li>
    </ul>

    <p style="font-weight: 600; margin-bottom: 8px;">Continue monitoring from $39/month:</p>
    <ul style="color: #374151; padding-left: 20px; margin: 0 0 20px;">
      <li style="margin-bottom: 6px;"><strong>Starter ($39/mo)</strong> — up to 3 clusters, email alerts, 30-day history</li>
      <li style="margin-bottom: 6px;"><strong>Pro ($99/mo)</strong> — up to 10 clusters, Slack + webhook alerts, 90-day history</li>
      <li style="margin-bottom: 6px;"><strong>Scale ($199/mo)</strong> — unlimited clusters, 180-day history</li>
    </ul>

    ${btn(APP_URL + "/settings?tab=billing", "Upgrade now — cancel anytime")}

    <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
      Not ready to upgrade yet? Reply and tell me what's holding you back.
      If you're still evaluating or have questions, I'm happy to help.
    </p>
    <p style="font-size: 14px; margin: 0;">Eraste<br><span style="color: #9ca3af;">Founder, OpenSearch Doctor</span></p>
  `);

  await getResend().emails.send({ from: `${SENDER} <${FROM}>`, to, subject, html });
}

// ── Email 5 — Last chance ─────────────────────────────────────────────────────

export async function sendLastChanceEmail(to: string, name: string | null) {
  const firstName = name ? name.split(" ")[0] : "there";
  const subject   = "Last day of your free trial";

  const html = wrap(`
    <p>Hi ${firstName},</p>
    <p>Your OpenSearch Doctor trial ends today.</p>
    <p>After today, your agent will stop sending diagnostics and alerts will stop firing. You won't know if your cluster goes into a degraded state until your users start reporting issues.</p>
    <p>If you've found value in the monitoring, now is the time to keep it running:</p>

    ${btn(APP_URL + "/settings?tab=billing", "Upgrade — cancel anytime")}

    <p style="margin-top: 24px; font-size: 14px; color: #374151;">
      If you're choosing not to upgrade, I'd genuinely appreciate 1 minute of feedback:
      what was missing, what didn't work, or what would have made you pay?
      Just reply to this email.
    </p>
    <p style="font-size: 14px; color: #6b7280;">That feedback directly shapes what I build next.</p>
    <p style="font-size: 14px; margin: 0;">Eraste<br><span style="color: #9ca3af;">Founder, OpenSearch Doctor</span></p>
  `);

  await getResend().emails.send({ from: `${SENDER} <${FROM}>`, to, subject, html });
}

// ── Send + track (prevents duplicate sends) ───────────────────────────────────

export type OnboardingEmailType =
  | "WELCOME"
  | "STUCK_SETUP"
  | "EDUCATION"
  | "TRIAL_ENDING"
  | "LAST_CHANCE";

/**
 * Sends an onboarding email only if it hasn't been sent before.
 * Returns true if email was sent, false if already sent or skipped.
 */
export async function sendOnboardingEmail(
  userId: string,
  email: string,
  name: string | null,
  type: OnboardingEmailType
): Promise<boolean> {
  // Check if already sent
  const existing = await prisma.onboardingEmail.findUnique({
    where: { userId_emailType: { userId, emailType: type } },
  });
  if (existing) return false;

  // Send the right email
  try {
    switch (type) {
      case "WELCOME":       await sendWelcomeEmail(email, name);       break;
      case "STUCK_SETUP":   await sendStuckSetupEmail(email, name);    break;
      case "EDUCATION":     await sendEducationEmail(email, name);     break;
      case "TRIAL_ENDING":  await sendTrialEndingEmail(email, name);   break;
      case "LAST_CHANCE":   await sendLastChanceEmail(email, name);    break;
    }
  } catch (err) {
    console.error(`[onboarding] Failed to send ${type} to ${email}:`, err);
    return false;
  }

  // Record that it was sent
  await prisma.onboardingEmail.create({
    data: { userId, emailType: type },
  });

  console.log(`[onboarding] Sent ${type} to ${email}`);
  return true;
}
