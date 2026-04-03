"use client";

import dynamic from "next/dynamic";

// Loaded client-side only so base-ui never generates SSR IDs that
// mismatch the client hydration IDs (React hydration warning fix).
export const SidebarNoSSR = dynamic(
  () =>
    import("@/components/dashboard/sidebar-wrapper").then((m) => ({
      default: m.SidebarClient,
    })),
  { ssr: false }
);
