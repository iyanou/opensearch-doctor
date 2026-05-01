import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  Activity, Shield, Bell, BarChart2, Download, CheckCircle2,
  ArrowRight, Zap, Server, Lock, TrendingUp, FileText,
  ChevronRight, X, Clock, Users, GitBranch,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Zap,
    title: "50+ automated checks",
    body: "Catch unassigned shards, heap pressure, missing snapshots, insecure configs, and more — before they cause an outage. Every check comes with a specific fix recommendation.",
    color: "text-violet-600 bg-violet-100 dark:bg-violet-900/20",
  },
  {
    icon: BarChart2,
    title: "Metric trends over time",
    body: "Know if a node is trending toward heap exhaustion before it hits. Track 24h, 7d, or 30d trends for JVM heap, CPU, disk, search latency, and health score.",
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
  },
  {
    icon: Bell,
    title: "Proactive alerts",
    body: "Get paged the moment your cluster goes RED, heap spikes above 85%, or your agent goes offline — not when a user files a ticket.",
    color: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
  },
  {
    icon: Shield,
    title: "Security audit",
    body: "Detect TLS misconfigurations, anonymous access, missing audit logging, and auth backend issues automatically. Know your exposure before an attacker does.",
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20",
  },
  {
    icon: CheckCircle2,
    title: "Actionable fixes",
    body: "No vague warnings. Every finding includes the exact command, config change, or setting to fix it — with a direct link to the OpenSearch docs.",
    color: "text-green-600 bg-green-100 dark:bg-green-900/20",
  },
  {
    icon: Lock,
    title: "Zero credential exposure",
    body: "Deploy in your VPC, behind a firewall, or on an air-gapped network. The agent connects outbound only. Your cluster endpoint never needs to be exposed.",
    color: "text-slate-600 bg-slate-100 dark:bg-slate-900/20",
  },
];

const PRICING_TIERS = [
  {
    name: "Starter",
    price: "$39",
    sub: "/ month",
    features: ["Up to 3 clusters", "All 11 check categories", "Email alerts", "30-day retention", "PDF reports"],
    cta: "Get started free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$99",
    sub: "/ month",
    features: ["Up to 10 clusters", "All checks & rules", "Email + Slack + webhook alerts", "90-day retention", "PDF reports", "REST API access"],
    cta: "Get started free",
    highlight: true,
  },
  {
    name: "Scale",
    price: "$199",
    sub: "/ month",
    features: ["Unlimited clusters", "All checks & rules", "All alert channels", "180-day retention", "REST API", "Priority support"],
    cta: "Get started free",
    highlight: false,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-base tracking-tight">OpenSearch Doctor</span>
          </a>

          {/* Nav links — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features"    className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing"     className="hover:text-foreground transition-colors">Pricing</a>
            <Link href="/blog"     className="hover:text-foreground transition-colors">Blog</Link>
            <Link href="/docs"     className="hover:text-foreground transition-colors">Docs</Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign in
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="gap-1.5 shadow-sm">
                Get started <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <Badge
            variant="secondary"
            className="mb-6 gap-1.5 py-1 px-3 text-xs font-medium border border-primary/20 bg-primary/5 text-primary"
          >
            <Zap className="w-3 h-3" />
            14-day free trial · No credit card needed
          </Badge>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-balance leading-[1.05]">
            Your OpenSearch cluster<br className="hidden sm:block" />
            <span className="text-primary"> is hiding problems.</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
            A lightweight open-source agent runs on your server, connects locally to your cluster,
            and sends diagnostic data to our platform — which runs 50+ automated checks
            and tells you exactly what&apos;s wrong and how to fix it.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base gap-2 shadow-lg shadow-primary/25 w-full sm:w-auto">
                Start free — no credit card <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base gap-2 w-full sm:w-auto">
                View pricing <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Trust pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-6">
            {[
              { icon: Shield, label: "Credentials never leave your network" },
              { icon: Server, label: "No inbound port changes required" },
              { icon: Lock,   label: "Works behind VPNs & firewalls" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 border border-border/60 rounded-full px-3 py-1.5 whitespace-nowrap"
              >
                <Icon className="w-3 h-3 text-emerald-500 shrink-0" />
                {label}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 max-w-lg mx-auto mt-16 pt-10 border-t border-border/60">
            {[
              { value: "11",    label: "diagnostic categories" },
              { value: "50+",   label: "automated checks" },
              { value: "5 min", label: "setup time" },
              { value: "0",     label: "credentials sent to us" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center min-w-[80px]">
                <p className="text-3xl font-extrabold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/5 overflow-hidden">
          {/* Browser chrome */}
          <div className="bg-muted/60 border-b border-border/60 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
            </div>
            <div className="flex-1 max-w-xs mx-auto bg-background/80 rounded px-3 py-1 text-xs text-muted-foreground text-center truncate">
              opensearchdoctor.com/dashboard
            </div>
          </div>
          {/* Dashboard mockup — horizontally scrollable on mobile */}
          <div className="overflow-x-auto">
            <div className="min-w-[480px] bg-background p-5 space-y-4">
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Health Score",    value: "82",  color: "text-yellow-600", sub: "Degraded" },
                  { label: "Critical Issues", value: "2",   color: "text-red-600",    sub: "Needs attention" },
                  { label: "Agents Online",   value: "3/3", color: "text-emerald-600",sub: "All connected" },
                ].map(({ label, value, color, sub }) => (
                  <div key={label} className="rounded-xl border border-border/60 bg-card p-3.5">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
              {/* Mini charts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-card p-3.5">
                  <p className="text-xs text-muted-foreground mb-2">JVM Heap % — last 24h</p>
                  <svg viewBox="0 0 120 36" className="w-full h-9 text-yellow-500" aria-hidden>
                    <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      points="0,30 20,26 40,23 60,20 80,15 100,11 120,7" />
                  </svg>
                  <p className="text-xs text-yellow-600 font-medium mt-1">▲ 81% — elevated</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card p-3.5">
                  <p className="text-xs text-muted-foreground mb-2">Health Score — last 7d</p>
                  <svg viewBox="0 0 120 36" className="w-full h-9 text-emerald-500" aria-hidden>
                    <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      points="0,10 20,8 40,12 60,10 80,14 100,18 120,20" />
                  </svg>
                  <p className="text-xs text-emerald-600 font-medium mt-1">82 / 100 — stable</p>
                </div>
              </div>
              {/* Findings */}
              <div className="rounded-xl border border-border/60 bg-card p-3.5 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Latest findings</p>
                {[
                  { sev: "CRITICAL", msg: "2 unassigned shards on production-cluster", cat: "Shards" },
                  { sev: "WARNING",  msg: "JVM heap usage at 81% on node-1",           cat: "Nodes"  },
                  { sev: "INFO",     msg: "No ISM policy on 4 indices",                  cat: "ISM"   },
                ].map(({ sev, msg, cat }) => (
                  <div key={msg} className="flex items-center gap-2.5 py-1.5 border-b border-border/40 last:border-0">
                    <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      sev === "CRITICAL" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                      sev === "WARNING"  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>{sev}</span>
                    <p className="text-sm flex-1 text-foreground/80 truncate">{msg}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who is this for ──────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Who is this for</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Built for teams running their own OpenSearch
          </h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: Server,
              title: "Self-hosted on EC2 or bare metal",
              body: "You deployed OpenSearch yourself and want health visibility without paying for a full APM platform or enterprise support contract.",
            },
            {
              icon: GitBranch,
              title: "Migrated from Elasticsearch",
              body: "You left Elastic Cloud or self-hosted ES behind. Your cluster is running — but your monitoring didn't come with it.",
            },
            {
              icon: Clock,
              title: "No time for manual diagnostics",
              body: "You know the _cat APIs exist. You don't have time to write and maintain dashboards around them. You just want to know when something is wrong.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-muted/30 border-y border-border/60 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Up and running in 5 minutes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-10 relative">
            <div className="hidden sm:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            {[
              {
                step: "01", icon: Download,
                title: "Install the agent",
                body: "Download the single Go binary for your OS. No runtime, no Docker, no dependencies. Linux, macOS, and Windows supported.",
              },
              {
                step: "02", icon: Server,
                title: "Connect to your cluster",
                body: "Point the agent at your OpenSearch endpoint. It connects locally over loopback or your internal network — no inbound port exposure, works behind VPNs.",
              },
              {
                step: "03", icon: TrendingUp,
                title: "Get instant diagnostics",
                body: "The agent sends collected metrics to our API. Within seconds you see a health score, prioritised findings, and step-by-step fixes.",
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


      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="bg-muted/30 border-y border-border/60 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to keep your cluster healthy
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, body, color }) => (
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
        </div>
      </section>

      {/* ── Social proof placeholder ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          — used by OpenSearch operators running clusters on EC2, Kubernetes, and bare metal —
        </p>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-muted/30 border-y border-border/60 py-24" aria-label="Pricing">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="text-muted-foreground mt-3">
              Every account starts with a <strong className="text-foreground">14-day free trial — full Scale-level access</strong>. No credit card required. Pick your plan after.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start max-w-4xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-6 flex flex-col gap-5 ${
                  tier.highlight
                    ? "border border-primary bg-primary text-primary-foreground shadow-2xl shadow-primary/25"
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
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${tier.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {tier.name}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-extrabold">{tier.price}</span>
                    <span className={`text-sm mb-1 ${tier.highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {tier.sub}
                    </span>
                  </div>
                </div>
                <ul className="space-y-2 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${tier.highlight ? "text-primary-foreground/70" : "text-emerald-500"}`} />
                      <span className={tier.highlight ? "text-primary-foreground/90" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <Button
                    variant={tier.highlight ? "secondary" : "outline"}
                    size="sm"
                    className={`w-full gap-1.5 ${tier.highlight ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90" : ""}`}
                  >
                    {tier.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Annual billing available — 2 months free.{" "}
            <Link href="/pricing" className="text-primary underline underline-offset-2 hover:no-underline">
              See full comparison →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Security callout ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        <div className="rounded-2xl bg-muted/40 border border-border/60 p-8 sm:p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
            <Lock className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold mb-2">Monitor private clusters — no firewall changes needed</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The agent runs directly on your server alongside OpenSearch. It only needs
              outbound internet access to reach our platform — your cluster port never has
              to be exposed. Works with private networks, VPNs, and air-gapped environments.
              Credentials stay local; only diagnostic metrics are ever transmitted.
            </p>
          </div>
          <Link href="/login" className="shrink-0">
            <Button size="lg" className="gap-2">
              Start free trial <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="gradient-cta py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-balance">
            Your cluster is running. Is it healthy?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            14-day free trial. No credit card. Up and running in 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login">
              <Button
                size="lg"
                className="h-12 px-8 bg-white text-primary hover:bg-white/90 shadow-lg gap-2 font-semibold w-full sm:w-auto"
              >
                Start free trial <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                className="h-12 px-8 bg-blue-500 hover:bg-blue-600 text-white shadow-lg gap-2 font-semibold w-full sm:w-auto"
              >
                View pricing <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">OpenSearch Doctor</span>
          </a>

          <div className="grid grid-cols-3 sm:flex sm:items-center sm:gap-6 gap-x-6 gap-y-2 text-xs text-muted-foreground text-center">
            <a href="#features"  className="hover:text-foreground transition-colors">Features</a>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/docs"    className="hover:text-foreground transition-colors">Docs</Link>
            <Link href="/blog"    className="hover:text-foreground transition-colors">Blog</Link>
            <Link href="/privacy"       className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms"         className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/terms#refund"  className="hover:text-foreground transition-colors">Refunds</Link>
            <Link href="/contact"       className="hover:text-foreground transition-colors">Contact</Link>
            <a href="https://status.opensearchdoctor.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Status</a>
            <Link href="/login"   className="hover:text-foreground transition-colors">Sign in</Link>
          </div>

          <div className="text-center sm:text-right">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} OpenSearch Doctor
            </p>
            <p className="text-xs text-muted-foreground/50 mt-0.5">
              Built for OpenSearch. Not for Elasticsearch.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
