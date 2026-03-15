export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/alerts/[id] — snooze or acknowledge
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const event = await prisma.alertEvent.findFirst({
    where: { id, cluster: { userId: session.user.id } },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { action, snoozeHours } = body as { action: "snooze" | "acknowledge"; snoozeHours?: number };

  if (action === "snooze") {
    const hours = snoozeHours ?? 4;
    const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    const updated = await prisma.alertEvent.update({
      where: { id },
      data: { status: "SNOOZED", snoozedUntil },
    });
    return NextResponse.json(updated);
  }

  if (action === "acknowledge") {
    const updated = await prisma.alertEvent.update({
      where: { id },
      data: { acknowledgedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
