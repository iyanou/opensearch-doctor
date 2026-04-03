import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const ContactSchema = z.object({
  name:    z.string().min(1).max(100),
  email:   z.string().email().max(200),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
});

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? "support@opensearchdoctor.com";
const FROM_EMAIL    = process.env.RESEND_FROM_EMAIL ?? "noreply@opensearchdoctor.com";

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    // Silently accept in dev — don't expose missing config to the browser
    console.warn("[contact] RESEND_API_KEY not set — email not sent");
    return NextResponse.json({ ok: true });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const result = ContactSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid request", issues: result.error.issues }, { status: 400 });
  }

  const { name, email, subject, message } = result.data;

  // Basic rate guard — one submission per IP per 60s is handled by the in-memory limiter
  // (not wired here to keep the contact form dependency-light; add if abused)

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from:    `OpenSearch Doctor Contact <${FROM_EMAIL}>`,
      to:      SUPPORT_EMAIL,
      replyTo: email,
      subject: `[Contact] ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1a1a1a">New contact form submission</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#666;width:80px"><strong>Name</strong></td><td style="padding:8px 0">${escHtml(name)}</td></tr>
            <tr><td style="padding:8px 0;color:#666"><strong>Email</strong></td><td style="padding:8px 0"><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td></tr>
            <tr><td style="padding:8px 0;color:#666"><strong>Subject</strong></td><td style="padding:8px 0">${escHtml(subject)}</td></tr>
          </table>
          <div style="background:#f5f5f5;border-radius:8px;padding:16px;white-space:pre-wrap;font-size:14px;line-height:1.6">${escHtml(message)}</div>
          <p style="color:#999;font-size:12px;margin-top:24px">Sent from opensearchdoctor.com/contact</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[contact] Resend error:", err);
    return NextResponse.json({ error: "Failed to send message. Please try emailing us directly." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
