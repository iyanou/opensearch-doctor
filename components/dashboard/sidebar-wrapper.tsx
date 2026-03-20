"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Menu } from "lucide-react";
import Image from "next/image";

interface SidebarClientProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  plan?: "FREE_TRIAL" | "FREE" | "PRO" | null;
  trialDaysLeft?: number;
  firingAlertsCount?: number;
}

export function SidebarClient({ user, plan, trialDaysLeft, firingAlertsCount = 0 }: SidebarClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <Image src="/favicon.svg" alt="OpenSearch Doctor" width={28} height={28} className="shrink-0" />
          <span className="font-bold text-sm tracking-tight">OpenSearch Doctor</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors relative"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
          {firingAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <Sidebar
        user={user}
        plan={plan}
        trialDaysLeft={trialDaysLeft}
        firingAlertsCount={firingAlertsCount}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
