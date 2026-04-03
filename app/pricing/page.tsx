import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  Activity, ArrowRight, CheckCircle2, Zap, ArrowLeft,
  BarChart2, Bell, Shield, Infinity as InfinityIcon, X, Clock,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    name: "Starter",
    price: { monthly: "$39", annual: "$390" },
    sub: "/ month",
    description: "For small teams monitoring up to 3 OpenSearch clusters.",
    highlight: false,
    features: [
      { text: "Up to 3 clusters",              included: true  },
      { text: "All 11 check categories",       included: true  },
      { text: "50+ analysis rules",            included: true  },
      { text: "30-day data retention",         included: true  },
      { text: "Metric charts",                 included: true  },
      { text: "Email alerts",                  included: true  },
      { text: "PDF reports",                   included: true  },
      { text: "Slack & webhook alerts",        included: false },
      { text: "REST API access",               included: false },
    ],
    ctaLabel: "Start free trial",
  },
  {
    name: "Pro",
    price: { monthly: "$99", annual: "$990" },
    sub: "/ month",
    description: "For growing teams who need full observability across many clusters.",
    highlight: true,
    features: [
      { text: "Up to 10 clusters",             included: true  },
      { text: "All 11 check categories",       included: true  },
      { text: "50+ analysis rules",            included: true  },
      { text: "90-day data retention",         included: true  },
      { text: "Metric charts",                 included: true  },
      { text: "Email + Slack + webhook alerts", included: true },
      { text: "PDF reports",                   included: true  },
      { text: "REST API access",               included: true  },
    ],
    ctaLabel: "Start free trial",
  },
  {
    name: "Scale",
    price: { monthly: "$199", annual: "$1,990" },
    sub: "/ month",
    description: "For platform teams managing large fleets of OpenSearch clusters.",
    highlight: false,
    features: [
      { text: "Unlimited clusters",            included: true  },
      { text: "All 11 check categories",       included: true  },
      { text: "50+ analysis rules",            included: true  },
      { text: "180-day data retention",        included: true  },
      { text: "Metric charts",                 included: true  },
      { text: "Email + Slack + webhook alerts", included: true },
      { text: "PDF reports",                   included: true  },
      { text: "REST API access",               included: true  },
    ],
    ctaLabel: "Start free trial",
  },
];

const COMPARISON_ROWS = [
  { feature: "Clusters",                    starter: "3",      pro: "10",     scale: <><InfinityIcon className="w-3.5 h-3.5 inline" /> Unlimited</> },
  { feature: "Check categories",            starter: "11/11",  pro: "11/11",  scale: "11/11" },
  { feature: "Analysis rules",              starter: "50+",    pro: "50+",    scale: "50+" },
  { feature: "Data retention",              starter: "30 days", pro: "90 days", scale: "180 days" },
  { feature: "Metric charts",               starter: true,     pro: true,     scale: true  },
  { feature: "Email alerts",                starter: true,     pro: true,     scale: true  },
  { feature: "Slack & webhook alerts",      starter: false,    pro: true,     scale: true  },
  { feature: "PDF reports",                 starter: true,     pro: true,     scale: true  },
  { feature: "REST API access",             starter: false,    pro: true,     scale: true  },
  { feature: "Priority support",            starter: false,    pro: false,    scale: true  },
  { feature: "Monthly price",               starter: "$39",    pro: "$99",    scale: "$199" },
  { feature: "Annual price (2 months free)", starter: "$390",  pro: "$990",   scale: "$1,990" },
];

const FAQS = [
  {
    q: "Do I need a credit card for the trial?",
    a: "No. Sign in with Google, connect your cluster, and your 14-day trial starts automatically — no credit card required.",
  },
  {
    q: "When does the 14-day trial start?",
    a: "The trial clock starts when your agent first connects to your cluster — not when you sign up. So you have full time to install and configure the agent.",
  },
  {
    q: "What happens when the trial ends?",
    a: "Your dashboard is locked until you upgrade. Your data is preserved for 30 days so nothing is lost if you decide to subscribe after the trial.",
  },
  {
    q: "Can I upgrade or downgrade at any time?",
    a: "Yes. Upgrade instantly from your billing settings. Downgrade takes effect at the end of your billing period. Data outside your new retention window is cleaned up by the next daily cron.",
  },
  {
    q: "What does the agent send to the platform?",
    a: "Only diagnostic metrics — health scores, node stats, shard counts, index info. Your OpenSearch credentials and raw cluster data never leave your network. The agent source code is public so you can verify this.",
  },
  {
    q: "Which platforms does the agent support?",
    a: "Linux (amd64, arm64), macOS (amd64, arm64), and Windows (amd64). It's a single binary with no runtime dependencies.",
  },
  {
    q: "Is there a per-cluster fee on Pro or Scale?",
    a: "No. Pro is $99/month for up to 10 clusters and Scale is $199/month for unlimited clusters — flat pricing regardless of how many clusters you add.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "Your data is kept safe. The daily retention cron will trim historical data to match your new plan's retention window over the following days. No data is deleted immediately on downgrade.",
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-base tracking-tight">OpenSearch Doctor</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/#features"     className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
            <Link href="/pricing"       className="text-foreground font-medium">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign in</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="gap-1.5 shadow-sm">
                Start free trial <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-24">

        {/* Heading */}
        <div className="text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-balance">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto text-balance">
            14-day free trial, no credit card required. Connect your cluster, see real findings.
            Upgrade when you&apos;re convinced.
          </p>
        </div>

        {/* Trial banner */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm mb-1">14-day free trial — full Pro access</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign up, connect your cluster, and get the full experience. Trial starts when your agent connects. No credit card needed.
            </p>
          </div>
          <Link href="/login" className="shrink-0">
            <Button className="gap-1.5 whitespace-nowrap">
              <Zap className="w-3.5 h-3.5" /> Start free trial
            </Button>
          </Link>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-7 flex flex-col gap-6 ${
                tier.highlight
                  ? "border border-primary bg-primary text-primary-foreground shadow-2xl shadow-primary/20"
                  : "border border-border/60 bg-card"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-foreground text-primary text-[11px] font-bold px-3 py-1 rounded-full shadow-sm tracking-wide uppercase">
                    Most popular
                  </span>
                </div>
              )}

              {/* Price */}
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${tier.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {tier.name}
                </p>
                <div className="flex items-end gap-1.5 mb-1">
                  <span className="text-4xl font-extrabold">{tier.price.monthly}</span>
                  <span className={`text-sm mb-1.5 ${tier.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {tier.sub}
                  </span>
                </div>
                <p className={`text-xs ${tier.highlight ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                  {tier.price.annual}/year (2 months free)
                </p>
                <p className={`text-xs mt-2 ${tier.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {tier.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1">
                {tier.features.map(({ text, included }) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm">
                    {included
                      ? <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${tier.highlight ? "text-primary-foreground/70" : "text-emerald-500"}`} />
                      : <X className={`w-4 h-4 shrink-0 mt-0.5 ${tier.highlight ? "text-primary-foreground/30" : "text-muted-foreground/30"}`} />
                    }
                    <span className={`${!included ? "opacity-50" : ""} ${tier.highlight ? "text-primary-foreground/90" : ""}`}>
                      {text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/login">
                <Button
                  className={`w-full gap-1.5 ${tier.highlight ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90" : ""}`}
                  variant={tier.highlight ? "secondary" : "outline"}
                >
                  {tier.ctaLabel} <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Full comparison table */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-8">Full comparison</h2>
          <div className="overflow-x-auto rounded-2xl border border-border/60">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="text-left px-5 py-4 font-semibold w-[40%]">Feature</th>
                  <th className="text-center px-4 py-4 font-semibold">Starter</th>
                  <th className="text-center px-4 py-4 font-semibold text-primary">Pro</th>
                  <th className="text-center px-4 py-4 font-semibold">Scale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {COMPARISON_ROWS.map(({ feature, starter, pro, scale }) => (
                  <tr key={feature} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 text-muted-foreground">{feature}</td>
                    <td className="px-4 py-3 text-center">{renderCell(starter)}</td>
                    <td className="px-4 py-3 text-center font-medium text-primary">{renderCell(pro)}</td>
                    <td className="px-4 py-3 text-center">{renderCell(scale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3 sm:hidden">← scroll to see all columns →</p>
        </div>

        {/* Value props */}
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: Shield,    title: "Credentials stay on-prem",  body: "The agent runs on your server and connects locally. Raw credentials never leave your network. Agent source code is public for full transparency." },
            { icon: BarChart2, title: "Metrics over time",          body: "Track heap, CPU, disk, shards, and health score over 24h, 7d, or 30d with interactive charts on all paid plans." },
            { icon: Bell,      title: "Proactive alerts",           body: "Get notified before outages happen — cluster RED, heap spike, missing snapshot, agent offline — via email, Slack, or webhook." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border/60 bg-card p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div id="faq" className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
          {FAQS.map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-border/60 bg-card px-5 py-4 space-y-1.5">
              <p className="font-semibold text-sm">{q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="text-center space-y-4 py-4">
          <h2 className="text-2xl font-bold">Ready to diagnose your cluster?</h2>
          <p className="text-muted-foreground">14-day free trial. No credit card. Up and running in 5 minutes.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto">
                Start free trial <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" className="h-12 px-8 gap-2 w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4" /> Back to home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">OpenSearch Doctor</span>
          </Link>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing"   className="text-foreground font-medium">Pricing</Link>
            <Link href="/privacy"   className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms"     className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact"   className="hover:text-foreground transition-colors">Contact</Link>
            <Link href="/login"     className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} OpenSearch Doctor
          </p>
        </div>
      </footer>
    </div>
  );
}

function renderCell(value: React.ReactNode | boolean | string) {
  if (value === true)  return <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />;
  return <span className="text-sm">{value}</span>;
}
