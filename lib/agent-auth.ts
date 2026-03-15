import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { AgentKey, User } from "@prisma/client";

export type AgentAuthResult =
  | { success: true; agentKey: AgentKey; user: User }
  | { success: false; error: string };

/**
 * Validates the Bearer token sent by the agent in the Authorization header.
 * Format: "Bearer osd_<random>"
 */
export async function validateAgentKey(
  authHeader: string | null
): Promise<AgentAuthResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { success: false, error: "Missing or invalid Authorization header" };
  }

  const rawKey = authHeader.slice(7);
  if (!rawKey.startsWith("osd_")) {
    return { success: false, error: "Invalid key format" };
  }

  const prefix = rawKey.slice(0, 12); // "osd_" + first 8 chars

  // Find candidate keys by prefix (avoids full table scan)
  const candidates = await prisma.agentKey.findMany({
    where: { keyPrefix: prefix, revokedAt: null },
    include: { user: true },
  });

  for (const candidate of candidates) {
    const match = await bcrypt.compare(rawKey, candidate.keyHash);
    if (match) {
      // Update last used timestamp (fire-and-forget)
      prisma.agentKey
        .update({
          where: { id: candidate.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => {});

      return { success: true, agentKey: candidate, user: candidate.user };
    }
  }

  return { success: false, error: "Invalid or revoked API key" };
}

/**
 * Generates a new agent key, stores the hash, returns the raw key (shown once).
 */
export async function createAgentKey(
  userId: string,
  name: string,
  clusterId?: string
): Promise<{ rawKey: string; keyPrefix: string }> {
  const crypto = await import("crypto");
  const random = crypto.randomBytes(24).toString("hex");
  const rawKey = `osd_${random}`;
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = await bcrypt.hash(rawKey, 12);

  await prisma.agentKey.create({
    data: { userId, name, clusterId, keyHash, keyPrefix },
  });

  return { rawKey, keyPrefix };
}
