import Link from "next/link";
import { Download, Settings, ListChecks, HelpCircle, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Documentation — OpenSearch Doctor",
  description: "OpenSearch Doctor agent installation, configuration, checks reference, and FAQ.",
};

const SECTIONS = [
  {
    href: "/docs/installation",
    icon: Download,
    title: "Installation",
    description: "Download and install the agent on Linux, macOS, or Windows. Includes the interactive --init wizard and service setup.",
    time: "5 min",
  },
  {
    href: "/docs/configuration",
    icon: Settings,
    title: "Configuration reference",
    description: "Every YAML field explained — cluster connection, TLS options, run interval, heartbeat, log file, and category filters.",
    time: "3 min",
  },
  {
    href: "/docs/checks",
    icon: ListChecks,
    title: "What it checks",
    description: "All 11 diagnostic categories: cluster health, node resources, shards, indices, performance, snapshots, ISM, security, plugins, ingest pipelines, and index templates.",
    time: "4 min",
  },
  {
    href: "/docs/faq",
    icon: HelpCircle,
    title: "FAQ",
    description: "Agent not connecting, no data showing, TLS issues, minimum permissions, self-hosting, and more.",
    time: "3 min",
  },
];

export default function DocsIndexPage() {
  return (
    <div>
      <div className="mb-10 not-prose">
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">Documentation</h1>
        <p className="text-muted-foreground text-base">
          Everything you need to install the agent, connect your cluster, and get diagnostics running.
        </p>
      </div>

      <div className="not-prose grid sm:grid-cols-2 gap-4">
        {SECTIONS.map(({ href, icon: Icon, title, description, time }) => (
          <Link
            key={href}
            href={href}
            className="group block rounded-xl border border-border/60 bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{time} read</span>
            </div>
            <h2 className="font-bold text-sm mb-1.5">{title}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">{description}</p>
            <span className="flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
              Read <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        ))}
      </div>

      <div className="not-prose mt-10 rounded-xl border border-border/60 bg-muted/40 p-6">
        <h3 className="font-semibold text-sm mb-2">Quick start — 3 steps</h3>
        <ol className="space-y-2 text-sm text-muted-foreground list-none">
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">1</span>
            <span>Sign up at <Link href="/login" className="text-primary hover:underline">opensearchdoctor.com</Link> and go to <strong className="text-foreground">Settings → Agent Keys</strong> to create an API key.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">2</span>
            <span><Link href="/docs/installation" className="text-primary hover:underline">Download the agent</Link> for your platform and run <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">./agent --init</code>.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold mt-0.5">3</span>
            <span>The wizard tests your connections, writes <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">config.yaml</code>, and optionally installs a systemd service. Done.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
