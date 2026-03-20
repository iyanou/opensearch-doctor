/**
 * API key authentication for the public REST API v1.
 * Expects: Authorization: Bearer osd_<key>
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export async function authenticateApiKey(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const raw = auth.slice(7).trim();
  if (!raw) return null;

  const keyHash = createHash("sha256").update(raw).digest("hex");

  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash, revokedAt: null },
    select: { id: true, userId: true, user: { select: { plan: true } } },
  });
  if (!apiKey) return null;

  // REST API is a Pro-only feature
  if (apiKey.user.plan !== "PRO") return null;

  // Update last used timestamp (fire and forget)
  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return apiKey.userId;
}
