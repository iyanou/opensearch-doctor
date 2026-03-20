import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Shield, Bell, BarChart2, Download, CheckCircle2,
  ArrowRight, Zap, Server, Lock, TrendingUp, FileText,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-base tracking-tight">OpenSearch Doctor</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
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

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 py-1 px-3 text-xs font-medium border border-primary/20 bg-primary/5 text-primary"
          >
            <Zap className="w-3 h-3" />
            14-day free trial · No credit card required
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-balance leading-[1.05]">
            OpenSearch health,{" "}
            <span className="text-primary">diagnosed in minutes</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
            A lightweight agent runs on your server, connects locally to your cluster,
            and sends diagnostic data to our platform — which runs 50+ checks and tells you
            exactly what&apos;s wrong and how to fix it.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base gap-2 shadow-lg shadow-primary/25">
                Start free trial <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base gap-2">
                Sign in <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto mt-20 pt-10 border-t border-border/60">
            {[
              { value: "11", label: "check categories" },
              { value: "50+", label: "analysis rules" },
              { value: "5 min", label: "to first insight" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-extrabold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/5 overflow-hidden">
          {/* Fake browser chrome */}
          <div className="bg-muted/60 border-b border-border/60 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
            </div>
            <div className="flex-1 max-w-xs mx-auto bg-background/80 rounded px-3 py-1 text-xs text-muted-foreground text-center">
              app.opensearchdoctor.com/dashboard
            </div>
          </div>
          {/* Dashboard mockup */}
          <div className="bg-background p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Health Score", value: "82", color: "text-yellow-600", sub: "Degraded" },
                { label: "Critical Issues", value: "2", color: "text-red-600", sub: "Needs attention" },
                { label: "Agents Online", value: "3 / 3", color: "text-emerald-600", sub: "All connected" },
              ].map(({ label, value, color, sub }) => (
                <div key={label} className="rounded-xl border border-border/60 bg-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Latest findings</p>
              {[
                { sev: "CRITICAL", msg: "2 unassigned shards on production-cluster", cat: "Shards" },
                { sev: "WARNING", msg: "JVM heap usage at 81% on node-1", cat: "Nodes" },
                { sev: "INFO", msg: "No ISM policy on 4 indices", cat: "ISM" },
              ].map(({ sev, msg, cat }) => (
                <div key={msg} className="flex items-center gap-2.5 py-1.5 border-b border-border/40 last:border-0">
                  <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    sev === "CRITICAL" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    sev === "WARNING" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}>{sev}</span>
                  <p className="text-sm flex-1 text-foreground/80 truncate">{msg}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section id="how-it-works" className="bg-muted/30 border-y border-border/60 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Up and running in 5 minutes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-10 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            {[
              {
                step: "01",
                icon: Download,
                title: "Install the agent",
                body: "Download the single Go binary for your platform. No runtime, no Docker. Runs on Linux, macOS, and Windows.",
              },
              {
                step: "02",
                icon: Server,
                title: "Connect to your cluster",
                body: "Point the agent at your OpenSearch endpoint. It connects locally — your credentials never leave your network.",
              },
              {
                step: "03",
                icon: TrendingUp,
                title: "Get instant diagnostics",
                body: "The agent sends collected data to our API. Within seconds you see a health score, findings, and step-by-step fixes.",
              },
            ].map(({ step, icon: Icon, title, body }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs font-bold text-primary/70 uppercase tracking-widest">Step {step}</p>
                <h3 className="font-semibold text-base">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Everything you need to keep your cluster healthy
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Zap,
              title: "50+ diagnostic rules",
              body: "Cluster health, nodes, shards, indices, performance, snapshots, ISM policies, security, plugins, templates — all checked automatically.",
              color: "text-violet-600 bg-violet-100 dark:bg-violet-900/20",
            },
            {
              icon: BarChart2,
              title: "Metric time series",
              body: "Track JVM heap, CPU, disk usage, search latency, unassigned shards, and health score over 24h, 7d, or 30d.",
              color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
            },
            {
              icon: Bell,
              title: "Proactive alerts",
              body: "Get notified by email, Slack, or webhook when your cluster goes red, heap spikes, or snapshots stop running.",
              color: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
            },
            {
              icon: Shield,
              title: "Security analysis",
              body: "Detect TLS misconfigurations, anonymous access, missing audit logging, and auth backend issues before they become breaches.",
              color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20",
            },
            {
              icon: CheckCircle2,
              title: "Actionable recommendations",
              body: "Every finding comes with a specific fix — not just 'something is wrong', but the exact command or config change you need.",
              color: "text-green-600 bg-green-100 dark:bg-green-900/20",
            },
            {
              icon: Lock,
              title: "Credentials stay on-prem",
              body: "The agent runs on your server and connects locally. Raw credentials and cluster data never touch our network.",
              color: "text-slate-600 bg-slate-100 dark:bg-slate-900/20",
            },
          ].map(({ icon: Icon, title, body, color }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────── */}
      <section id="pricing" className="bg-muted/30 border-y border-border/60 py-24" aria-label="Pricing">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="text-muted-foreground mt-3">Try everything free for 14 days. No credit card required.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 items-start">

            {/* Free Trial */}
            <div className="rounded-2xl border border-border/60 bg-card p-7 flex flex-col gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Free Trial</p>
                <div className="flex items-end gap-1.5">
                  <p className="text-4xl font-extrabold">Free</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">14 days · No credit card</p>
              </div>
              <ul className="space-y-2.5 flex-1">
                {[
                  "Unlimited clusters",
                  "All 11 check categories",
                  "50+ analysis rules",
                  "Metric charts",
                  "Alerts (email, Slack, webhook)",
                  "30-day data retention",
                  "PDF reports",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/login">
                <Button variant="outline" size="sm" className="w-full gap-1.5">
                  Start free trial <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border border-primary bg-primary text-primary-foreground p-7 flex flex-col gap-6 shadow-2xl shadow-primary/25">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-primary-foreground text-primary text-[11px] font-bold px-3 py-1 rounded-full shadow-sm tracking-wide uppercase">
                  Most popular
                </span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/60 mb-3">Pro</p>
                <div className="flex items-end gap-1.5">
                  <p className="text-4xl font-extrabold">$29</p>
                  <p className="text-sm text-primary-foreground/70 mb-1.5">/ month</p>
                </div>
                <p className="text-sm text-primary-foreground/70 mt-1">Cancel anytime</p>
              </div>
              <ul className="space-y-2.5 flex-1">
                {[
                  "Unlimited clusters",
                  "All 11 check categories",
                  "90-day data retention",
                  "Alerts (email + Slack + webhook)",
                  "PDF reports",
                  "REST API access",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-primary-foreground/70" />
                    <span className="text-primary-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/login">
                <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-1.5" size="sm">
                  Start free trial <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Security callout ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="rounded-2xl bg-muted/40 border border-border/60 p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
            <Lock className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold mb-2">Your credentials never leave your network</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The agent runs on your own infrastructure and connects locally to OpenSearch.
              Only diagnostic metrics are sent to our platform — never credentials, never raw data.
              You stay in full control.
            </p>
          </div>
          <Link href="/login" className="shrink-0">
            <Button size="lg" className="gap-2">
              Start free trial <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className="gradient-cta py-20">
        <div className="max-w-2xl mx-auto px-6 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Know what&apos;s wrong with your cluster in 5 minutes
          </h2>
          <p className="text-white/70 mb-8 text-lg">No credit card required. Free 14-day trial.</p>
          <Link href="/login">
            <Button
              size="lg"
              className="h-12 px-8 bg-white text-primary hover:bg-white/90 shadow-lg gap-2 font-semibold"
            >
              Start your free trial <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">OpenSearch Doctor</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} OpenSearch Doctor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
