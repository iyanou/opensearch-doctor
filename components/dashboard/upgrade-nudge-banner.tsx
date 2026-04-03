"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, LayoutGrid } from "lucide-react";
import type { Plan } from "@prisma/client";
import { clusterLimitMessage } from "@/lib/plan";

interface UpgradeNudgeBannerProps {
  plan: Plan;
  clusterCount: number;
  clusterLimit: number;
}

export function UpgradeNudgeBanner({ plan, clusterCount, clusterLimit }: UpgradeNudgeBannerProps) {
  const message = clusterLimitMessage(plan);

  return (
    <div className="border-b bg-primary/5 border-primary/10">
      <div className="flex items-center justify-between px-5 py-2.5 gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <LayoutGrid className="w-4 h-4 shrink-0" />
          <span>
            {clusterCount}/{clusterLimit === Infinity ? "∞" : clusterLimit} clusters used
            {message ? ` — ${message}` : ""}
          </span>
        </div>
        <Link href="/settings?tab=billing">
          <Button size="sm" className="h-7 text-xs gap-1.5">
            <Zap className="w-3 h-3" /> Upgrade plan
          </Button>
        </Link>
      </div>
    </div>
  );
}
