"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, Lock } from "lucide-react";

interface UpgradeGateProps {
  feature: string;
  children: React.ReactNode;
  locked: boolean;
}

export function UpgradeGate({ feature, children, locked }: UpgradeGateProps) {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="pointer-events-none opacity-30 select-none blur-[1px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm rounded-xl">
        <div className="text-center px-6 py-5 space-y-3 max-w-xs">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">{feature} requires Pro</p>
            <p className="text-xs text-muted-foreground mt-1">Upgrade your plan to unlock this feature.</p>
          </div>
          <Button size="sm" onClick={() => window.location.href = "/settings?tab=billing"} className="gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Upgrade to Pro
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UpgradeButton({ feature }: { feature: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      router.push(data.url);
    } else {
      setLoading(false);
    }
  }

  return (
    <Button onClick={startCheckout} disabled={loading} className="gap-1.5">
      <Zap className="w-4 h-4" />
      {loading ? "Redirecting…" : `Upgrade for ${feature}`}
    </Button>
  );
}
