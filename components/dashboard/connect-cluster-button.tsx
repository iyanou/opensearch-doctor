"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Zap, X, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  atLimit: boolean;
  currentPlan: string;
  clusterCount: number;
  clusterLimit: number;
}

const UPGRADE_PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: "$39/mo",
    clusters: 3,
    highlights: ["Up to 3 clusters", "30-day retention", "Email alerts", "PDF reports"],
    excluded: ["Slack/webhook alerts", "REST API"],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$99/mo",
    clusters: 10,
    highlights: ["Up to 10 clusters", "90-day retention", "All alert channels", "PDF reports", "REST API"],
    excluded: [],
    popular: true,
  },
  {
    key: "scale",
    name: "Scale",
    price: "$199/mo",
    clusters: Infinity,
    highlights: ["Unlimited clusters", "180-day retention", "All alert channels", "PDF reports", "REST API"],
    excluded: [],
  },
];

export function ConnectClusterButton({ atLimit, currentPlan, clusterCount, clusterLimit }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    if (atLimit) {
      setOpen(true);
    } else {
      router.push("/settings?tab=keys");
    }
  }

  async function startCheckout(plan: string) {
    setLoading(plan);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billing: "monthly" }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(null);
  }

  // Determine which plans make sense to show based on current plan
  const plansToShow = UPGRADE_PLANS.filter((p) => {
    if (currentPlan === "FREE_TRIAL") return true;
    if (currentPlan === "STARTER") return p.key === "pro" || p.key === "scale";
    if (currentPlan === "PRO") return p.key === "scale";
    return false;
  });

  return (
    <>
      <Button size="sm" className="gap-1.5 shadow-sm" onClick={handleClick}>
        <Plus className="w-3.5 h-3.5" /> Connect cluster
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card rounded-2xl border border-border/60 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-border/60 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-base">Cluster limit reached</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  You&apos;re using {clusterCount} of {clusterLimit} cluster{clusterLimit !== 1 ? "s" : ""} on the{" "}
                  <span className="font-medium capitalize">{currentPlan.toLowerCase().replace("_", " ")}</span> plan.
                  Upgrade to monitor more clusters.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Plan cards */}
            <div className="p-6">
              <div className={`grid gap-4 ${plansToShow.length === 1 ? "grid-cols-1 max-w-sm mx-auto" : plansToShow.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
                {plansToShow.map((plan) => (
                  <div
                    key={plan.key}
                    className={`rounded-xl border p-4 relative flex flex-col gap-3 ${
                      plan.popular
                        ? "border-primary bg-primary/5"
                        : "border-border/60 bg-muted/20"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                          Most popular
                        </span>
                      </div>
                    )}

                    <div>
                      <div className="flex items-baseline gap-1.5 mb-0.5">
                        <span className="font-bold text-base">{plan.name}</span>
                        <span className="text-xs text-muted-foreground">{plan.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {plan.clusters === Infinity ? "Unlimited" : `Up to ${plan.clusters}`} clusters
                      </p>
                    </div>

                    <ul className="space-y-1.5 flex-1">
                      {plan.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-1.5 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          {h}
                        </li>
                      ))}
                      {plan.excluded.map((h) => (
                        <li key={h} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>

                    <Button
                      size="sm"
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full gap-1.5 mt-1"
                      disabled={loading !== null}
                      onClick={() => startCheckout(plan.key)}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {loading === plan.key ? "Redirecting…" : `Get ${plan.name}`}
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">Cancel anytime · No lock-in · Annual billing saves 2 months</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
