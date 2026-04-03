import Link from "next/link";

export const metadata = {
  title: "What it checks — OpenSearch Doctor Docs",
  description: "All 11 diagnostic categories run by the OpenSearch Doctor agent.",
};

const CHECKS = [
  {
    id: "cluster_health",
    title: "Cluster health",
    api: "GET /_cluster/health",
    collects: [
      "Cluster status (green / yellow / red)",
      "Total node count and data node count",
      "Active and unassigned shard counts",
      "Number of pending cluster tasks",
    ],
    findings: [
      "Cluster status is RED — data may be unavailable",
      "Cluster status is YELLOW — some replicas are unassigned",
      "Unassigned shards detected with root-cause reasons",
      "Pending cluster tasks backlog",
    ],
  },
  {
    id: "nodes",
    title: "Node resources",
    api: "GET /_nodes/stats",
    collects: [
      "JVM heap used % per node",
      "CPU % per node",
      "Disk used % and available bytes per node",
      "OS memory used % per node",
      "Node uptime in milliseconds",
      "Node roles (master, data, ingest, etc.)",
    ],
    findings: [
      "JVM heap above 85% — risk of GC pressure and OOM",
      "Disk above 85% — OpenSearch may flip indices to read-only",
      "High CPU % sustained across nodes",
      "Single-node cluster (no redundancy)",
    ],
  },
  {
    id: "shards",
    title: "Shard distribution",
    api: "GET /_cat/shards",
    collects: [
      "Count and reasons of unassigned shards",
      "Shard count per node",
      "Average shard size in bytes",
    ],
    findings: [
      "Unassigned shards with ALLOCATION_FAILED, NODE_LEFT, or other reasons",
      "Heavily imbalanced shard distribution across nodes",
      "Oversized shards (above 50 GB) that impact recovery time",
    ],
  },
  {
    id: "indices",
    title: "Index health",
    api: "GET /_cat/indices, GET /_all/_settings",
    collects: [
      "Per-index health status, open/closed state",
      "Primary shard and replica count",
      "Document count and store size",
      "Read-only block flags (index.blocks.read_only, read_only_allow_delete)",
    ],
    findings: [
      "Indices in red or yellow health",
      "Indices with read-only block set (usually triggered by low disk space)",
      "Closed indices consuming disk but not serving queries",
    ],
  },
  {
    id: "performance",
    title: "Performance metrics",
    api: "GET /_nodes/stats/indices,thread_pool",
    collects: [
      "Indexing rate and total count",
      "Search query rate and average latency",
      "Thread pool rejection counts (write/search)",
      "Query cache hit rate",
      "Fielddata eviction count",
      "Total segment count and merge time",
    ],
    findings: [
      "Thread pool rejections — indexing or search is being throttled",
      "High search latency indicating slow queries or under-provisioned nodes",
      "Very high segment count (fragmentation) — force merge may help",
      "Fielddata evictions indicating memory pressure",
    ],
  },
  {
    id: "snapshots",
    title: "Snapshot health",
    api: "GET /_snapshot, GET /_snapshot/_all/_all",
    collects: [
      "Number of snapshot repositories configured",
      "Timestamp of last successful snapshot",
      "Number of failed snapshots in the last 7 days",
    ],
    findings: [
      "No snapshot repository configured — no backup in place",
      "No successful snapshot in the past 7 days",
      "Repeated snapshot failures in the past week",
    ],
  },
  {
    id: "ism_policies",
    title: "ISM policies",
    api: "GET /_plugins/_ism/policies, GET /_plugins/_ism/explain/*",
    collects: [
      "Total ISM policy count",
      "Indices without an assigned ISM policy",
      "Indices with ISM execution errors",
    ],
    findings: [
      "Indices with ISM errors — lifecycle management is broken for those indices",
      "Growing indices without any lifecycle policy (risk of unbounded disk growth)",
    ],
  },
  {
    id: "security",
    title: "Security configuration",
    api: "GET /_plugins/_security/api/*",
    collects: [
      "TLS enabled on HTTP and transport layers",
      "Audit logging enabled",
      "Anonymous access enabled",
      "Authentication backend configured",
    ],
    findings: [
      "TLS not enabled on HTTP — cluster traffic is unencrypted",
      "Anonymous access enabled — anyone can query without credentials",
      "Audit logging disabled — no record of who did what",
    ],
  },
  {
    id: "plugins",
    title: "Installed plugins",
    api: "GET /_cat/plugins",
    collects: [
      "All installed plugin names and versions",
      "OpenSearch version number",
    ],
    findings: [
      "Used to cross-reference findings (e.g. ISM checks only apply if the ISM plugin is installed)",
    ],
  },
  {
    id: "ingest_pipelines",
    title: "Ingest pipelines",
    api: "GET /_ingest/pipeline, GET /_all/_settings",
    collects: [
      "Total ingest pipeline count",
      "Pipelines not referenced by any index (orphaned)",
    ],
    findings: [
      "Orphaned pipelines — configured but not used by any index, causing confusion",
    ],
  },
  {
    id: "templates",
    title: "Index templates",
    api: "GET /_index_template, GET /_cat/indices",
    collects: [
      "Total index template count",
      "Templates with overlapping index patterns at the same priority",
      "Templates that don't match any existing index",
    ],
    findings: [
      "Overlapping templates at the same priority — OpenSearch picks one arbitrarily",
      "Unused templates — leftover from old indices, may cause confusion",
    ],
  },
];

export default function ChecksPage() {
  return (
    <div>
      <h1>What it checks</h1>
      <p className="text-muted-foreground">
        The agent runs <strong>11 diagnostic categories</strong> against your OpenSearch cluster using only read-only API calls.
        Each category is independent — a failure in one never blocks the others.
      </p>
      <p className="text-muted-foreground text-sm">
        <strong>What is never read:</strong> document data, search query content, index field values, or your credentials.
        See the <a href="https://github.com/opensearch-doctor/agent#what-it-does-not-collect" target="_blank" rel="noopener noreferrer">agent README</a> for the full guarantee.
      </p>

      <div className="not-prose space-y-6 mt-8">
        {CHECKS.map((c) => (
          <div key={c.id} id={c.id} className="rounded-xl border border-border/60 bg-card p-6">
            <h2 className="text-base font-bold mb-1">{c.title}</h2>
            <code className="text-xs text-muted-foreground">{c.api}</code>
            <div className="grid sm:grid-cols-2 gap-6 mt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">What is collected</p>
                <ul className="space-y-1">
                  {c.collects.map(item => (
                    <li key={item} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary mt-0.5">·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">What it detects</p>
                <ul className="space-y-1">
                  {c.findings.map(item => (
                    <li key={item} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-amber-500 mt-0.5">·</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="not-prose mt-8 flex gap-4">
        <Link href="/docs/configuration" className="text-sm text-muted-foreground hover:text-primary font-medium">
          ← Configuration
        </Link>
        <Link href="/docs/faq" className="text-sm text-primary hover:underline font-medium">
          Next: FAQ →
        </Link>
      </div>
    </div>
  );
}
