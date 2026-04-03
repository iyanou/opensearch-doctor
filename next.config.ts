import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  // Prevent browsers from sniffing MIME types
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Deny all framing (consistent with frame-ancestors 'none' in CSP below)
  { key: "X-Frame-Options", value: "DENY" },

  // Disable browser DNS prefetch (minor info-leak prevention)
  { key: "X-DNS-Prefetch-Control", value: "off" },

  // Only send origin on cross-origin requests, nothing on downgrade
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Restrict browser feature access
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },

  // Force HTTPS for 2 years (production only — dev uses HTTP)
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),

  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",

      // Next.js needs 'unsafe-inline' for hydration; 'unsafe-eval' only in dev
      isProd
        ? "script-src 'self' 'unsafe-inline' https://accounts.google.com"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",

      // Tailwind + shadcn inject inline styles
      "style-src 'self' 'unsafe-inline'",

      // Self + Google profile pictures (OAuth avatars)
      "img-src 'self' data: blob: https://*.googleusercontent.com https://lh3.googleusercontent.com",

      // Fonts are self-hosted via next/font (Geist) — no external font CDN needed
      "font-src 'self'",

      // API calls stay on same origin; Google for OAuth token exchange
      "connect-src 'self' https://accounts.google.com",

      // Google OAuth uses a redirect flow — allow their frame for sign-in button
      "frame-src https://accounts.google.com",

      // Nobody can embed our app in an iframe
      "frame-ancestors 'none'",

      // All form submissions must go to same origin
      "form-action 'self' https://accounts.google.com",

      // Only load workers from same origin
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Keep @react-pdf/renderer server-side only — it's a Node.js library
  // and must not be bundled for the browser.
  serverExternalPackages: ["@react-pdf/renderer"],

  // Allow next/image to proxy Google profile pictures (OAuth avatars).
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
