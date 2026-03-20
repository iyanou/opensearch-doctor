"use client";

import { useState } from "react";
import { Zap, Clock, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRO_FEATURES = [
  "Unlimited clusters",
  "All 11 check categories & 50+ rules",
  "90-day data retention",
  "Alerts (email, Slack, webhook)",
  "PDF reports",
  "REST API access",
];

export function ExpiredGate() {
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-6">

        {/* Icon + heading */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-muted border border-border/60 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Your trial has ended</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your 14-day free trial is over. Upgrade to Pro to restore full access
            to your clusters and diagnostic data.
          </p>
        </div>

        {/* Price + CTA */}
        <div className="rounded-2xl border border-primary bg-primary text-primary-foreground p-6 space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/60 mb-1">Pro Plan</p>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-extrabold">$29</span>
              <span className="text-sm text-primary-foreground/70 mb-1">/ month</span>
            </div>
            <p className="text-xs text-primary-foreground/60 mt-0.5">Cancel anytime · No hidden fees</p>
          </div>

          <ul className="space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-primary-foreground/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground/60 shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <Button
            onClick={startCheckout}
            disabled={loading}
            className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 font-semibold"
            size="lg"
          >
            <Zap className="w-4 h-4" />
            {loading ? "Redirecting to Stripe…" : "Upgrade to Pro"}
          </Button>
        </div>

        {/* Reassurance */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ExternalLink className="w-3 h-3" />
          Secure payment via Stripe · Your data is kept safe
        </div>
      </div>
    </div>
  );
}
