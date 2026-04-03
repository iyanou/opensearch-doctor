import type { Plan } from "@prisma/client";

// ─── Plan limits ──────────────────────────────────────────────────────────────

export const LIMITS = {
  // Trial: full Pro-level access for 14 days (starts on first agent connection)
  FREE_TRIAL: { maxClusters: Infinity, dataRetentionDays: 30,  alerts: true,  alertChannels: ["EMAIL", "SLACK", "WEBHOOK"] as string[], pdf: true,  api: true  },
  STARTER:    { maxClusters: 3,        dataRetentionDays: 30,  alerts: true,  alertChannels: ["EMAIL"]                     as string[], pdf: true,  api: false },
  PRO:        { maxClusters: 10,       dataRetentionDays: 90,  alerts: true,  alertChannels: ["EMAIL", "SLACK", "WEBHOOK"] as string[], pdf: true,  api: true  },
  SCALE:      { maxClusters: Infinity, dataRetentionDays: 180, alerts: true,  alertChannels: ["EMAIL", "SLACK", "WEBHOOK"] as string[], pdf: true,  api: true  },
};

export type PlanLimits = typeof LIMITS[keyof typeof LIMITS];

export function getLimits(plan: Plan): PlanLimits {
  return LIMITS[plan] ?? LIMITS.FREE_TRIAL;
}

// ─── Plan info ────────────────────────────────────────────────────────────────

export type PlanInfo = {
  plan: Plan;
  isOnTrial: boolean;
  isStarterPlan: boolean;
  isProPlan: boolean;
  isScalePlan: boolean;
  isPaid: boolean;
};

export function getPlanInfo(user: { plan: Plan }): PlanInfo {
  const plan = user.plan;
  return {
    plan,
    isOnTrial:     plan === "FREE_TRIAL",
    isStarterPlan: plan === "STARTER",
    isProPlan:     plan === "PRO",
    isScalePlan:   plan === "SCALE",
    isPaid: plan === "STARTER" || plan === "PRO" || plan === "SCALE",
  };
}

// ─── Trial helpers ────────────────────────────────────────────────────────────

export function getTrialState(user: { plan: Plan; trialEndsAt?: Date | null }) {
  const isOnTrial = user.plan === "FREE_TRIAL";
  const trialEndsAt = user.trialEndsAt ?? null;
  const trialStarted = isOnTrial && trialEndsAt !== null;
  const trialExpired = trialStarted && trialEndsAt! < new Date();
  const daysLeft = trialStarted && !trialExpired
    ? Math.max(0, Math.ceil((trialEndsAt!.getTime() - Date.now()) / 86_400_000))
    : 0;
  return { isOnTrial, trialStarted, trialExpired, daysLeft };
}

// ─── Cluster limit helpers ────────────────────────────────────────────────────

export function canAddCluster(plan: Plan, currentCount: number): boolean {
  return currentCount < getLimits(plan).maxClusters;
}

export function clusterLimitReached(plan: Plan, currentCount: number): boolean {
  return !canAddCluster(plan, currentCount);
}

/** Human-readable upgrade message shown when a user hits their cluster limit. */
export function clusterLimitMessage(plan: Plan): string {
  if (plan === "STARTER") return "Starter plan includes 3 clusters. Upgrade to Pro to monitor up to 10.";
  if (plan === "PRO")     return "Pro plan includes 10 clusters. Upgrade to Scale for unlimited clusters.";
  return "";
}

// ─── Pricing display ──────────────────────────────────────────────────────────

export const PLAN_PRICES = {
  STARTER: { monthly: 39,  annual: 390  },
  PRO:     { monthly: 99,  annual: 990  },
  SCALE:   { monthly: 199, annual: 1990 },
} as const;

export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  FREE_TRIAL: "Trial",
  STARTER:    "Starter",
  PRO:        "Pro",
  SCALE:      "Scale",
};
