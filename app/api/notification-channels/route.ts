export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLimits } from "@/lib/plan";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const channels = await prisma.notificationChannel.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(channels);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  const limits = getLimits(user?.plan ?? "FREE_TRIAL");

  const body = await req.json();
  const { type, name, config } = body;

  const VALID_TYPES = ["EMAIL", "SLACK", "WEBHOOK"];
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
  }

  if (!limits.alertChannels.includes(type)) {
    const allowed = limits.alertChannels.length > 0 ? limits.alertChannels.join(", ") : "none";
    return NextResponse.json(
      { error: `Your plan does not support ${type} notification channels. Allowed: ${allowed}. Upgrade to unlock more channels.` },
      { status: 403 }
    );
  }
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return NextResponse.json({ error: "config must be an object" }, { status: 400 });
  }

  // Type-specific config validation
  if (type === "EMAIL") {
    if (!config.email || typeof config.email !== "string" || !config.email.includes("@")) {
      return NextResponse.json({ error: "config.email must be a valid email address" }, { status: 400 });
    }
  } else if (type === "SLACK") {
    if (!config.webhookUrl || typeof config.webhookUrl !== "string") {
      return NextResponse.json({ error: "config.webhookUrl is required for SLACK channels" }, { status: 400 });
    }
  } else if (type === "WEBHOOK") {
    if (!config.url || typeof config.url !== "string") {
      return NextResponse.json({ error: "config.url is required for WEBHOOK channels" }, { status: 400 });
    }
    // Validate URL is safe (no SSRF)
    const { validateWebhookUrl } = await import("@/lib/safe-fetch");
    const check = validateWebhookUrl(config.url);
    if (!check.ok) {
      return NextResponse.json({ error: `Invalid webhook URL: ${check.error}` }, { status: 400 });
    }
  }

  const channel = await prisma.notificationChannel.create({
    data: { userId: session.user.id, type, name: name.trim(), config },
  });
  return NextResponse.json(channel);
}
