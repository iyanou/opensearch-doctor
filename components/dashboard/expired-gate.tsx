"use client";

import { useState } from "react";
import { Zap, Clock, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: "$39",
    description: "Up to 3 clusters · Email alerts · 30-day retention",
    popular: false,
  },
  {
    key: "pro",
    name: "Pro",
    price: "$99",
    description: "Up to 10 clusters · All alert channels · 90-day retention · API",
    popular: true,
  },
  {
    key: "scale",
    name: "Scale",
    price: "$199",
    description: "Unlimited clusters · All channels · 180-day retention",
    popular: false,
  },
];

const WHAT_YOU_GET = [
  "All 11 diagnostic check categories",
  "50+ automated analysis rules",
  "Proactive alerts (email, Slack, webhook)",
  "Metric charts and trends",
  "PDF reports",
  "REST API access (Pro & Scale)",
];

export function ExpiredGate() {
  const [loading, setLoading] = useState<string | null>(null);

  async function startCheckout(plan: string) {
    setLoading(plan);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, billing: "monthly" }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(null);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-2xl space-y-8">

        {/* Icon + heading */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-muted border border-border/60 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Your trial has ended</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            Your 14-day free trial is over. Choose a plan to restore full access
            to your clusters and diagnostic data.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-2xl border p-5 flex flex-col gap-4 relative ${
                plan.popular
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold bg-primary-foreground text-primary px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    Most popular
                  </span>
                </div>
              )}
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan.popular ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>/mo</span>
                </div>
                <p className={`text-xs mt-1.5 leading-relaxed ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
              </div>
              <Button
                onClick={() => startCheckout(plan.key)}
                disabled={loading !== null}
                size="sm"
                className={`w-full gap-1.5 font-semibold ${
                  plan.popular
                    ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    : ""
                }`}
                variant={plan.popular ? "secondary" : "outline"}
              >
                <Zap className="w-3.5 h-3.5" />
                {loading === plan.key ? "Redirecting…" : `Get ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>

        {/* What you get */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">All plans include</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WHAT_YOU_GET.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Reassurance */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ExternalLink className="w-3 h-3" />
          Secure payment via Stripe · Cancel anytime · No lock-in
        </div>
      </div>
    </div>
  );
}
