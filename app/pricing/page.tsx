import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Activity, ArrowRight, CheckCircle2, Zap, ArrowLeft,
  BarChart2, Bell, Shield, Clock, Infinity,
} from "lucide-react";

const TRIAL_FEATURES = [
  { text: "Unlimited clusters", note: "" },
  { text: "All 11 check categories", note: "" },
  { text: "50+ analysis rules", note: "" },
  { text: "Metric charts & trend analysis", note: "" },
  { text: "Alerts (email, Slack, webhook)", note: "" },
  { text: "30-day data retention", note: "" },
  { text: "PDF reports", note: "" },
];

const PRO_FEATURES = [
  { text: "Unlimited clusters", note: "" },
  { text: "All 11 check categories", note: "" },
  { text: "50+ analysis rules", note: "" },
  { text: "Metric charts & trend analysis", note: "" },
  { text: "Alerts (email, Slack, webhook)", note: "" },
  { text: "90-day data retention", note: "vs 30 days on trial" },
  { text: "PDF reports", note: "" },
  { text: "REST API access", note: "" },
];

const FAQS = [
  {
    q: "Do I need a credit card for the free trial?",
    a: "No. Sign in with Google and get 14 days of full Pro access — no credit card, no commitment.",
  },
  {
    q: "What happens when the trial ends?",
    a: "Your account is paused. Your data and clusters are kept safe for 30 days. Upgrade to Pro at any time to restore full access.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from the billing settings in one click. You keep Pro access until the end of the billing period.",
  },
  {
    q: "What does the agent send to the platform?",
    a: "Only diagnostic metrics — health scores, node stats, shard counts, index info. Your OpenSearch credentials and raw cluster data never leave your network.",
  },
  {
    q: "Which platforms does the agent support?",
    a: "Linux (amd64, arm64), macOS (amd64, arm64), and Windows (amd64). It's a single binary with no runtime dependencies.",
  },
  {
    q: "Is there a per-cluster fee?",
    a: "No. Pro is a flat $29/month — connect as many clusters as you want.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-base tracking-tight">OpenSearch Doctor</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/#how-it-works" className="hover:text-foreground transition-colors">How it works</Link>
            <Link href="/pricing" className="text-foreground font-medium">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
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

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-20">

        {/* Heading */}
        <div className="text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-balance">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto text-balance">
            Try everything free for 14 days. No credit card required.
            Upgrade when you&apos;re ready.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto items-start">

          {/* Free Trial */}
          <div className="rounded-2xl border border-border/60 bg-card p-8 flex flex-col gap-7">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Free Trial</span>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-sm text-muted-foreground mb-1.5">for 14 days</span>
              </div>
              <p className="text-sm text-muted-foreground">No credit card required</p>
            </div>

            <ul className="space-y-3 flex-1">
              {TRIAL_FEATURES.map(({ text, note }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    {text}
                    {note && <span className="text-xs text-muted-foreground ml-1.5">({note})</span>}
                  </span>
                </li>
              ))}
            </ul>

            <Link href="/login">
              <Button variant="outline" className="w-full gap-1.5">
                Start free trial <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border border-primary bg-primary text-primary-foreground p-8 flex flex-col gap-7 shadow-2xl shadow-primary/20">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-primary-foreground text-primary text-[11px] font-bold px-3 py-1 rounded-full shadow-sm tracking-wide uppercase">
                Most popular
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/60">Pro</span>
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-4xl font-extrabold">$29</span>
                <span className="text-sm text-primary-foreground/70 mb-1.5">/ month</span>
              </div>
              <p className="text-sm text-primary-foreground/70">Cancel anytime · Billed monthly</p>
            </div>

            <ul className="space-y-3 flex-1">
              {PRO_FEATURES.map(({ text, note }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary-foreground/70 shrink-0 mt-0.5" />
                  <span className="text-primary-foreground/90">
                    {text}
                    {note && <span className="text-xs text-primary-foreground/50 ml-1.5">({note})</span>}
                  </span>
                </li>
              ))}
            </ul>

            <Link href="/login">
              <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-1.5">
                Start free trial <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <p className="text-xs text-primary-foreground/50 text-center -mt-4">
              Free 14-day trial, then $29/mo
            </p>
          </div>
        </div>

        {/* Comparison table */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-8">Full comparison</h2>
          <div className="rounded-2xl border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40">
                  <th className="text-left px-5 py-3.5 font-semibold w-1/2">Feature</th>
                  <th className="text-center px-4 py-3.5 font-semibold">
                    <span className="flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Free Trial
                    </span>
                  </th>
                  <th className="text-center px-4 py-3.5 font-semibold text-primary">
                    <span className="flex items-center justify-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" /> Pro
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {[
                  { feature: "Clusters", trial: <><Infinity className="w-3.5 h-3.5 inline" /> Unlimited</>, pro: <><Infinity className="w-3.5 h-3.5 inline" /> Unlimited</> },
                  { feature: "Diagnostic check categories", trial: "11 / 11", pro: "11 / 11" },
                  { feature: "Analysis rules", trial: "50+", pro: "50+" },
                  { feature: "Metric charts", trial: true, pro: true },
                  { feature: "Alerts (email, Slack, webhook)", trial: true, pro: true },
                  { feature: "PDF reports", trial: true, pro: true },
                  { feature: "Data retention", trial: "30 days", pro: "90 days" },
                  { feature: "REST API access", trial: false, pro: true },
                  { feature: "Duration", trial: "14 days", pro: "Ongoing" },
                  { feature: "Price", trial: "Free", pro: "$29 / month" },
                ].map(({ feature, trial, pro }) => (
                  <tr key={feature} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 text-muted-foreground">{feature}</td>
                    <td className="px-4 py-3 text-center">{renderCell(trial)}</td>
                    <td className="px-4 py-3 text-center font-medium">{renderCell(pro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Value props */}
        <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {[
            { icon: Shield, title: "Credentials stay on-prem", body: "The agent runs on your server and connects locally. Raw credentials never leave your network." },
            { icon: BarChart2, title: "Metrics over time", body: "Track heap, CPU, disk, shards, and health score over 24h, 7d, or 30d with interactive charts." },
            { icon: Bell, title: "Proactive alerts", body: "Get notified before outages happen — cluster RED, heap spike, missing snapshot, agent offline." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border/60 bg-card p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-primary w-4 h-4" />
              </div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-xl font-bold text-center mb-8">Frequently asked questions</h2>
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
          <p className="text-muted-foreground">Free 14-day trial. No credit card. Up and running in 5 minutes.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 gap-2 shadow-lg shadow-primary/20">
                Start free trial <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" className="h-12 px-8 gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">OpenSearch Doctor</span>
          </Link>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="text-foreground font-medium">Pricing</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
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
  if (value === true) {
    return <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />;
  }
  if (value === false) {
    return <span className="text-muted-foreground/40 text-base leading-none">—</span>;
  }
  return <span className="text-sm">{value}</span>;
}
