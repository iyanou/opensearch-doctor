import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://opensearchdoctor.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "OpenSearch Doctor — Cluster Health Monitoring",
    template: "%s | OpenSearch Doctor",
  },
  description:
    "Automated OpenSearch cluster diagnostics. A lightweight open-source agent runs on your server, checks 50+ things automatically, and tells you exactly what's wrong and how to fix it. Free forever — 1 cluster, no credit card.",
  keywords: [
    "OpenSearch monitoring",
    "OpenSearch diagnostics",
    "OpenSearch cluster health",
    "self-managed OpenSearch",
    "OpenSearch alerts",
    "OpenSearch performance",
    "OpenSearch unassigned shards",
  ],
  authors: [{ name: "OpenSearch Doctor" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "OpenSearch Doctor",
    title: "OpenSearch Doctor — Cluster Health Monitoring",
    description:
      "Automated OpenSearch diagnostics. 50+ automated checks. Open-source agent. Runs in your infra. Free forever.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OpenSearch Doctor — Cluster Health Monitoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenSearch Doctor — Cluster Health Monitoring",
    description:
      "Automated OpenSearch diagnostics. 50+ checks. Open-source agent. Free forever.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OpenSearch Doctor",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux, macOS, Windows",
    description:
      "Automated OpenSearch cluster diagnostics with 50+ health checks. Lightweight open-source agent. Free forever for 1 cluster.",
    url: APP_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free forever — 1 cluster, no credit card",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        {/* H4 — Plausible Analytics (privacy-friendly, no cookies, no banner needed) */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
