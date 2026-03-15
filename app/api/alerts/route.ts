export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/alerts — list all firing/snoozed alerts for the user
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // "FIRING" | "RESOLVED" | null (all)
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const events = await prisma.alertEvent.findMany({
    where: {
      cluster: { userId: session.user.id },
      ...(status ? { status: status as "FIRING" | "RESOLVED" | "SNOOZED" } : {}),
    },
    orderBy: { firedAt: "desc" },
    take: limit,
    include: {
      rule: { select: { ruleKey: true, threshold: true } },
      cluster: { select: { id: true, name: true, endpoint: true } },
    },
  });

  return NextResponse.json(events);
}
