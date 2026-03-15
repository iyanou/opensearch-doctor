export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/v1-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = await authenticateApiKey(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clusters = await prisma.cluster.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      endpoint: true,
      environment: true,
      osVersion: true,
      agentVersion: true,
      lastSeenAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: clusters });
}
