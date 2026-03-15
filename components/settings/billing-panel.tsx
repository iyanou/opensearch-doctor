"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap, ExternalLink, CreditCard, Clock, AlertCircle, XCircle } from "lucide-react";
import type { Plan } from "@prisma/client";

interface BillingPanelProps {
  plan: Plan;
  trialDaysLeft: number;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  hasSubscription: boolean;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  successMessage?: boolean;
}

const TRIAL_FEATURES = [
  "Unlimited clusters",
  "All 11 check categories",
  "50+ analysis rules",
  "Metric charts",
  "Alerts (email, Slack, webhook)",
  "30-day data retention",
  "PDF reports",
];

const PRO_FEATURES = [
  "Unlimited clusters",
  "All 11 check categories",
  "90-day data retention",
  "Alerts (email + Slack + webhook)",
  "PDF reports",
  "REST API access",
];

export function BillingPanel({
  plan,
  trialDaysLeft,
  isTrialActive,
  isTrialExpired,
  hasSubscription,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  successMessage,
}: BillingPanelProps) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function startCheckout() {
    setCheckoutLoading(true);
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setCheckoutLoading(false);
  }

  async function openPortal() {
    setPortalLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setPortalLoading(false);
  }

  const isPro = plan === "PRO";

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
          <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-bold">Billing &amp; Plan</h3>
        <div className="ml-auto">
          <PlanBadge plan={plan} isTrialActive={isTrialActive} />
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Success */}
        {successMessage && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Welcome to Pro! Your subscription is now active.
          </div>
        )}

        {/* Status banner */}
        {isTrialActive && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                Free trial active — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                Full Pro access until your trial ends.
              </p>
            </div>
          </div>
        )}

        {isTrialExpired && !isPro && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Trial expired</p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                You are now on the Free plan with limited features. Upgrade to restore full access.
              </p>
            </div>
          </div>
        )}

        {isPro && currentPeriodEnd && cancelAtPeriodEnd && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20">
            <XCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Subscription cancels on <strong>{currentPeriodEnd.toLocaleDateString()}</strong>.
            </p>
          </div>
        )}

        {isPro && currentPeriodEnd && !cancelAtPeriodEnd && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-muted/60 border border-border/60">
            <CreditCard className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Next billing date: <strong className="text-foreground">{currentPeriodEnd.toLocaleDateString()}</strong>
            </p>
          </div>
        )}

        {/* Features */}
        {!isPro ? (
          <div className="grid sm:grid-cols-2 gap-6 rounded-xl border border-border/60 p-5 bg-muted/20">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Your trial includes</p>
              <ul className="space-y-2">
                {TRIAL_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Pro adds</p>
              <ul className="space-y-2">
                {[
                  { label: "90-day data retention", note: "vs 30-day on trial" },
                  { label: "REST API access", note: "programmatic access" },
                  { label: "Continued access after trial", note: "" },
                ].map(({ label, note }) => (
                  <li key={label} className="flex items-start gap-2 text-sm">
                    <Zap className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      {label}
                      {note && <span className="text-xs text-muted-foreground ml-1">({note})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Your Pro plan</p>
            <ul className="space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {!isPro && (
          <div className="flex items-center gap-4 pt-1">
            <div>
              <p className="text-2xl font-extrabold">$29<span className="text-sm font-normal text-muted-foreground"> / mo</span></p>
              <p className="text-xs text-muted-foreground">Cancel anytime</p>
            </div>
            <Button onClick={startCheckout} disabled={checkoutLoading} className="gap-2" size="lg">
              <Zap className="w-4 h-4" />
              {checkoutLoading ? "Redirecting to Stripe…" : "Upgrade to Pro"}
            </Button>
          </div>
        )}

        {isPro && hasSubscription && (
          <Button variant="outline" onClick={openPortal} disabled={portalLoading} className="gap-2">
            <ExternalLink className="w-4 h-4" />
            {portalLoading ? "Opening…" : "Manage subscription"}
          </Button>
        )}
      </div>
    </div>
  );
}

function PlanBadge({ plan, isTrialActive }: { plan: Plan; isTrialActive: boolean }) {
  if (plan === "PRO") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 uppercase tracking-wide">
        <Zap className="w-3 h-3" /> Pro
      </span>
    );
  }
  if (isTrialActive) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 uppercase tracking-wide">
        <Clock className="w-3 h-3" /> Trial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground uppercase tracking-wide border border-border/60">
      Free
    </span>
  );
}
