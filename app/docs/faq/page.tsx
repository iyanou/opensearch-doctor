import Link from "next/link";

export const metadata = {
  title: "FAQ — OpenSearch Doctor Docs",
  description: "Frequently asked questions about the OpenSearch Doctor agent.",
};

const FAQS = [
  {
    id: "not-connecting",
    q: "The agent ran --init successfully but no cluster appears in the dashboard.",
    a: `The wizard only writes config.yaml. To start sending data, you must actually run the agent:

    ./agent --config config.yaml

The cluster appears within a few seconds of the first heartbeat. Check agent.log if it doesn't appear.`,
  },
  {
    id: "tls-error",
    q: "I get a TLS/certificate error when the agent connects to OpenSearch.",
    a: `This means OpenSearch is using a self-signed or internal CA certificate. Fix options:

1. Quickest: set tls_skip_verify: true in config.yaml (not recommended for production).
2. Better: set ca_cert_path to your CA certificate file (PEM format):
   ca_cert_path: "/etc/ssl/certs/my-ca.pem"

The --init wizard asks about this in step 3 (SSL/TLS verification).`,
  },
  {
    id: "permissions",
    q: "What is the minimum OpenSearch permission the agent needs?",
    a: `Create a dedicated read-only role:

PUT _plugins/_security/api/roles/osd_agent
{
  "cluster_permissions": [
    "cluster:monitor/*",
    "cluster:admin/snapshot/get",
    "cluster:admin/repository/get",
    "indices:admin/template/get",
    "indices:monitor/*"
  ],
  "index_permissions": [{
    "index_patterns": ["*"],
    "allowed_actions": ["indices:monitor/*", "indices:admin/settings/get"]
  }]
}

For security diagnostics to work, also add:
"cluster:admin/opendistro/security/ssl/certs/info"

Then map a user to that role and use that user in config.yaml.`,
  },
  {
    id: "no-findings",
    q: "Diagnostics ran but there are no findings — is my cluster perfectly healthy?",
    a: `Possibly yes. A green cluster with no resource pressure, no unassigned shards, recent snapshots, and TLS enabled should produce zero findings.

If you expect findings that aren't there, run the agent in test mode to see exactly what was collected:

./agent --config config.yaml --test

This prints a local summary without sending to the platform.`,
  },
  {
    id: "agent-offline",
    q: "The dashboard shows the agent as offline.",
    a: `The agent is marked offline if no heartbeat is received for 30 minutes.

Check:
1. Is the agent process still running? (systemctl status opensearch-doctor-agent or pgrep agent)
2. Can the server reach opensearchdoctor.com on port 443? (curl -I https://opensearchdoctor.com)
3. Check agent.log for connection errors.
4. If using a firewall, allow outbound HTTPS to opensearchdoctor.com.`,
  },
  {
    id: "multiple-clusters",
    q: "Can I monitor multiple clusters?",
    a: `Yes. Run a separate agent instance for each cluster, each with its own config.yaml and api_key.

The number of clusters you can connect depends on your plan:
- Free: 1 cluster
- Starter: 3 clusters
- Pro: 10 clusters
- Scale: unlimited

Each cluster needs its own agent key (Settings → Agent Keys in the dashboard).`,
  },
  {
    id: "data-collected",
    q: "Does the agent read my documents or search queries?",
    a: `No. The agent never calls _search, _get, or any endpoint that returns document content.

It only reads:
- Cluster-level metrics (health, node stats, shard counts)
- Index-level metadata (names, shard counts, sizes, settings)
- Plugin list, ISM policy names, ingest pipeline names, template names

No document data, no field values, no query content ever leaves your network.
You can verify this by reading the source: internal/collector/collect.go lists every API call made.`,
  },
  {
    id: "self-host",
    q: "Can I self-host the backend instead of using opensearchdoctor.com?",
    a: `Yes. The agent's target URL is configurable:

saas:
  api_url: "https://your-instance.example.com"

Or via environment variable:
OPENSEARCH_DOCTOR_URL=https://your-instance.example.com ./agent --config config.yaml

The backend source code is not currently public, but the agent is open source and the API contract is documented.`,
  },
  {
    id: "data-retention",
    q: "How long is diagnostic data kept?",
    a: `Data retention depends on your plan:
- Free: 7 days
- Starter: 30 days
- Pro: 90 days
- Scale: 180 days

Data older than your retention window is automatically deleted by a nightly job. If you cancel your subscription, your data is retained for 30 days before being purged.`,
  },
  {
    id: "build-source",
    q: "Can I build the agent from source?",
    a: `Yes. The agent is open source (Apache 2.0):

git clone https://github.com/opensearch-doctor/agent
cd agent
go build -o agent ./cmd/agent

Requires Go 1.22+. Run go vet ./... and go test ./... to verify.`,
  },
];

export default function FaqPage() {
  return (
    <div>
      <h1>FAQ</h1>
      <p className="text-muted-foreground">
        Common questions about installation, permissions, data collection, and troubleshooting.
        Can&apos;t find your answer?{" "}
        <Link href="/contact">Contact us</Link> — we respond within one business day.
      </p>

      <div className="not-prose space-y-4 mt-8">
        {FAQS.map(({ id, q, a }) => (
          <details key={id} id={id} className="group rounded-xl border border-border/60 bg-card">
            <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-semibold text-sm list-none gap-4 hover:text-primary transition-colors">
              <span>{q}</span>
              <span className="shrink-0 text-muted-foreground group-open:rotate-90 transition-transform text-lg leading-none">›</span>
            </summary>
            <div className="px-6 pb-5">
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans bg-transparent p-0 m-0 border-0">
                {a.trim()}
              </pre>
            </div>
          </details>
        ))}
      </div>

      <div className="not-prose mt-10 rounded-xl border border-border/60 bg-muted/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">Still stuck?</p>
          <p className="text-sm text-muted-foreground mt-0.5">We read every message and reply within one business day.</p>
        </div>
        <Link
          href="/contact"
          className="shrink-0 inline-flex items-center gap-2 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          Contact support →
        </Link>
      </div>

      <div className="not-prose mt-6 flex gap-4">
        <Link href="/docs/checks" className="text-sm text-muted-foreground hover:text-primary font-medium">
          ← What it checks
        </Link>
      </div>
    </div>
  );
}
