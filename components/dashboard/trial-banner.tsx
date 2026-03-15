"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, AlertTriangle, Clock } from "lucide-react";

interface TrialBannerProps {
  daysLeft: number;
  isExpired: boolean;
}

export function TrialBanner({ daysLeft, isExpired }: TrialBannerProps) {
  if (isExpired) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 dark:bg-red-500/10">
        <div className="flex items-center justify-between px-5 py-2.5 gap-3 flex-wrap max-w-full">
          <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Your free trial has ended — upgrade to Pro to keep full access.
          </div>
          <Link href="/settings?tab=billing">
            <Button size="sm" className="h-7 bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5 shadow-sm">
              <Zap className="w-3 h-3" /> Upgrade now
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const urgent = daysLeft <= 3;

  return (
    <div className={`border-b ${
      urgent
        ? "bg-orange-500/10 border-orange-500/20"
        : "bg-primary/5 border-primary/10"
    }`}>
      <div className="flex items-center justify-between px-5 py-2.5 gap-3 flex-wrap">
        <div className={`flex items-center gap-2 text-sm font-medium ${
          urgent ? "text-orange-700 dark:text-orange-400" : "text-primary"
        }`}>
          {urgent ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Clock className="w-4 h-4 shrink-0" />}
          {urgent
            ? `Only ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left on your free trial`
            : `Free trial — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
        </div>
        <Link href="/settings?tab=billing">
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5"
            variant={urgent ? "default" : "outline"}
          >
            <Zap className="w-3 h-3" /> Upgrade to Pro
          </Button>
        </Link>
      </div>
    </div>
  );
}
