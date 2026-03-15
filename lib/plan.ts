import type { Plan } from "@prisma/client";

export type PlanInfo = {
  plan: Plan;
  trialEndsAt: Date | null;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysLeft: number;
  isPro: boolean;
  isFree: boolean;
};

export function getPlanInfo(user: { plan: Plan; trialEndsAt: Date | string | null }): PlanInfo {
  const now = new Date();
  const trialEndsAt = user.trialEndsAt ? new Date(user.trialEndsAt) : null;

  const isTrialActive = user.plan === "FREE_TRIAL" && trialEndsAt !== null && trialEndsAt > now;
  const isTrialExpired = user.plan === "FREE_TRIAL" && (trialEndsAt === null || trialEndsAt <= now);
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86_400_000)) : 0;

  const isPro = user.plan === "PRO";
  const isFree = user.plan === "FREE" || isTrialExpired;

  return { plan: user.plan, trialEndsAt, isTrialActive, isTrialExpired, trialDaysLeft, isPro, isFree };
}

// Plan limits
// FREE = expired trial — user must upgrade to Pro to continue.
// No clusters can be added; the UI prompts upgrade rather than offering a limited free tier.
export const LIMITS = {
  FREE_TRIAL: { maxClusters: Infinity, dataRetentionDays: 30, allCategories: true,  alerts: true  },
  FREE:       { maxClusters: 0,        dataRetentionDays: 0,  allCategories: false, alerts: false },
  PRO:        { maxClusters: Infinity, dataRetentionDays: 90, allCategories: true,  alerts: true  },
} as const satisfies Record<Plan, { maxClusters: number; dataRetentionDays: number; allCategories: boolean; alerts: boolean }>;

export function getLimits(plan: Plan) {
  return LIMITS[plan];
}

export function canAddCluster(plan: Plan, currentCount: number): boolean {
  return currentCount < LIMITS[plan].maxClusters;
}
