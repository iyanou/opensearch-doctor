export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { testChannel } from "@/lib/alerts/notify";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const channel = await prisma.notificationChannel.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await testChannel(channel);
  return NextResponse.json(result);
}
