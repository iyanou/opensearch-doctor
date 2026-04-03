"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Zap, ExternalLink, CreditCard, AlertTriangle } from "lucide-react";
import type { Plan } from "@prisma/client";

interface BillingPanelProps {
  plan: Plan;
  hasSubscription: boolean;
  subscriptionStatus?: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  successMessage?: boolean;
}

const PLAN_FEATURES: Record<string, { label: string; included: boolean }[]> = {
  FREE_TRIAL: [
    { label: "Unlimited clusters (trial)",       included: true  },
    { label: "All 11 check categories",          included: true  },
    { label: "50+ analysis rules",               included: true  },
    { label: "30-day data retention",            included: true  },
    { label: "Email + Slack + webhook alerts",   included: true  },
    { label: "PDF reports",                      included: true  },
    { label: "REST API access",                  included: true  },
  ],
  STARTER: [
    { label: "Up to 3 clusters",                included: true  },
    { label: "All 11 check categories",         included: true  },
    { label: "50+ analysis rules",              included: true  },
    { label: "30-day data retention",           included: true  },
    { label: "Email alerts",                    included: true  },
    { label: "PDF reports",                     included: true  },
    { label: "REST API access",                 included: false },
  ],
  PRO: [
    { label: "Up to 10 clusters",               included: true  },
    { label: "All 11 check categories",         included: true  },
    { label: "50+ analysis rules",              included: true  },
    { label: "90-day data retention",           included: true  },
    { label: "Email + Slack + webhook alerts",  included: true  },
    { label: "PDF reports",                     included: true  },
    { label: "REST API access",                 included: true  },
  ],
  SCALE: [
    { label: "Unlimited clusters",              included: true  },
    { label: "All 11 check categories",         included: true  },
    { label: "50+ analysis rules",              included: true  },
    { label: "180-day data retention",          included: true  },
    { label: "Email + Slack + webhook alerts",  included: true  },
    { label: "PDF reports",                     included: true  },
    { label: "REST API access",                 included: true  },
  ],
};

const UPGRADE_OPTIONS: Record<string, { plan: string; label: string; price: string }[]> = {
  FREE_TRIAL: [
    { plan: "starter", label: "Starter", price: "$39/mo" },
    { plan: "pro",     label: "Pro",     price: "$99/mo" },
    { plan: "scale",   label: "Scale",   price: "$199/mo" },
  ],
  STARTER: [
    { plan: "pro",   label: "Pro",   price: "$99/mo"  },
    { plan: "scale", label: "Scale", price: "$199/mo" },
  ],
  PRO: [
    { plan: "scale", label: "Scale", price: "$199/mo" },
  ],
  SCALE: [],
};

const PLAN_DISPLAY: Record<string, string> = {
  FREE_TRIAL: "Trial",
  STARTER:    "Starter",
  PRO:        "Pro",
  SCALE:      "Scale",
};

export function BillingPanel({
  plan,
  hasSubscription,
  subscriptionStatus,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  successMessage,
}: BillingPanelProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  async function startCheckout(targetPlan: string) {
    setCheckoutLoading(targetPlan);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: targetPlan, billing: "monthly" }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setCheckoutLoading(null);
  }

  async function openPortal() {
    setPortalLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setPortalLoading(false);
  }

  const isPaid = ["STARTER", "PRO", "SCALE"].includes(plan);
  const isPastDue = isPaid && subscriptionStatus === "PAST_DUE";
  const upgradeOptions = UPGRADE_OPTIONS[plan] ?? UPGRADE_OPTIONS["FREE_TRIAL"];
  const features = PLAN_FEATURES[plan] ?? PLAN_FEATURES["FREE_TRIAL"];

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-bold">Billing &amp; Plan</h3>
        <div className="ml-auto">
          <PlanBadge plan={plan} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Success */}
        {successMessage && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Your subscription is now active. Welcome!
          </div>
        )}

        {/* Past due */}
        {isPastDue && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20">
            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Payment failed</p>
              <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
                Your last payment didn&apos;t go through. Update your payment method to keep access.
              </p>
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="text-xs font-semibold text-orange-700 dark:text-orange-400 underline underline-offset-2 mt-1.5 hover:opacity-80"
              >
                {portalLoading ? "Opening…" : "Update payment method →"}
              </button>
            </div>
          </div>
        )}

        {/* Cancelling */}
        {isPaid && currentPeriodEnd && cancelAtPeriodEnd && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20">
            <XCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Subscription cancels on <strong>{new Date(currentPeriodEnd).toLocaleDateString()}</strong>. You keep access until then.
            </p>
          </div>
        )}

        {/* Next billing */}
        {isPaid && currentPeriodEnd && !cancelAtPeriodEnd && !isPastDue && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-muted/60 border border-border/60">
            <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Next billing: <strong className="text-foreground">{new Date(currentPeriodEnd).toLocaleDateString()}</strong>
            </p>
          </div>
        )}

        {/* Current plan features */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Your {PLAN_DISPLAY[plan]} plan includes
          </p>
          <ul className="space-y-2">
            {features.map(({ label, included }) => (
              <li key={label} className="flex items-center gap-2 text-sm">
                {included ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                )}
                <span className={included ? "" : "text-muted-foreground"}>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Upgrade options */}
        {upgradeOptions.length > 0 && (
          <div className="rounded-xl border border-border/60 p-4 bg-muted/20 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Upgrade</p>
            <div className="flex flex-wrap gap-3">
              {upgradeOptions.map(({ plan: targetPlan, label, price }) => (
                <div key={targetPlan} className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{price}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={targetPlan === "starter" ? "outline" : "default"}
                    onClick={() => startCheckout(targetPlan)}
                    disabled={checkoutLoading !== null}
                    className="gap-1.5 whitespace-nowrap"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {checkoutLoading === targetPlan ? "Redirecting…" : `Get ${label}`}
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Cancel anytime. No lock-in.</p>
          </div>
        )}

        {/* Manage subscription */}
        {hasSubscription && (
          <Button variant="outline" onClick={openPortal} disabled={portalLoading} className="gap-2">
            <ExternalLink className="w-4 h-4" />
            {portalLoading ? "Opening…" : "Manage subscription"}
          </Button>
        )}
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: Plan }) {
  if (plan === "SCALE") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400 uppercase tracking-wide">
        <Zap className="w-3 h-3" /> Scale
      </span>
    );
  }
  if (plan === "PRO") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 uppercase tracking-wide">
        <Zap className="w-3 h-3" /> Pro
      </span>
    );
  }
  if (plan === "STARTER") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 uppercase tracking-wide">
        <Zap className="w-3 h-3" /> Starter
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground uppercase tracking-wide border border-border/60">
      Trial
    </span>
  );
}
