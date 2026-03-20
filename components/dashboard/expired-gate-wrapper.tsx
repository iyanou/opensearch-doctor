"use client";

import { usePathname } from "next/navigation";
import { ExpiredGate } from "./expired-gate";

interface Props {
  isExpired: boolean;
  children: React.ReactNode;
}

// Allows certain routes (like /settings) to pass through even when trial is expired,
// so users can always reach the billing tab to upgrade.
const ALLOWED_WHEN_EXPIRED = ["/settings"];

export function ExpiredGateWrapper({ isExpired, children }: Props) {
  const pathname = usePathname();
  const allowed = ALLOWED_WHEN_EXPIRED.some((p) => pathname.startsWith(p));

  if (isExpired && !allowed) {
    return <ExpiredGate />;
  }

  return <>{children}</>;
}
