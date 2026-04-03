import Link from "next/link";

export const metadata = {
  title: "Configuration — OpenSearch Doctor Docs",
  description: "Full reference for the OpenSearch Doctor agent config.yaml file.",
};

export default function ConfigurationPage() {
  return (
    <div>
      <h1>Configuration reference</h1>
      <p className="text-muted-foreground">
        The agent is configured via a YAML file (default: <code>config.yaml</code> in the same directory as the binary).
        Running <code>--init</code> generates this file automatically. Every field is documented below.
      </p>

      <h2>Full example</h2>
      <pre><code>{`cluster:
  name: "My Production Cluster"
  endpoint: "https://localhost:9200"
  environment: "production"
  username: "osd-agent"
  password: "your-password"
  # api_key: "base64-encoded-opensearch-api-key"
  tls_skip_verify: false
  # ca_cert_path: "/etc/ssl/certs/my-ca.pem"

saas:
  api_url: "https://opensearchdoctor.com"
  api_key: "osd_your_key_here"

agent:
  interval_minutes: 360
  heartbeat_seconds: 300
  log_file: "agent.log"
  # enabled_categories:
  #   - cluster_health
  #   - nodes`}</code></pre>

      <h2>cluster</h2>
      <p>Connection settings for your OpenSearch cluster.</p>

      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr>
            <td><code>cluster.name</code></td><td>string</td><td>—</td>
            <td><strong>Required.</strong> Display name shown in the dashboard. Use something meaningful like <code>production</code> or <code>staging-eu</code>.</td>
          </tr>
          <tr>
            <td><code>cluster.endpoint</code></td><td>string</td><td>—</td>
            <td><strong>Required.</strong> Full URL including port, e.g. <code>https://localhost:9200</code>.</td>
          </tr>
          <tr>
            <td><code>cluster.environment</code></td><td>string</td><td><code>production</code></td>
            <td>Environment tag. One of: <code>production</code>, <code>staging</code>, <code>development</code>, <code>custom</code>.</td>
          </tr>
          <tr>
            <td><code>cluster.username</code></td><td>string</td><td>—</td>
            <td>OpenSearch username. Use this OR <code>api_key</code>, not both.</td>
          </tr>
          <tr>
            <td><code>cluster.password</code></td><td>string</td><td>—</td>
            <td>OpenSearch password. Required when using username auth.</td>
          </tr>
          <tr>
            <td><code>cluster.api_key</code></td><td>string</td><td>—</td>
            <td>Base64-encoded OpenSearch API key. Use this OR username/password, not both.</td>
          </tr>
          <tr>
            <td><code>cluster.tls_skip_verify</code></td><td>bool</td><td><code>false</code></td>
            <td>Set to <code>true</code> to skip TLS certificate verification. Required for self-signed certificates without a custom CA. Not recommended for production if avoidable.</td>
          </tr>
          <tr>
            <td><code>cluster.ca_cert_path</code></td><td>string</td><td>—</td>
            <td>Path to a custom CA certificate in PEM format. Use when your OpenSearch cert is signed by a private/internal CA and you want proper verification instead of skipping it.</td>
          </tr>
        </tbody>
      </table>

      <h2>saas</h2>
      <p>Connection settings for the OpenSearch Doctor platform.</p>

      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr>
            <td><code>saas.api_url</code></td><td>string</td><td><code>https://opensearchdoctor.com</code></td>
            <td>Platform API URL. Only change this if you are self-hosting the backend.</td>
          </tr>
          <tr>
            <td><code>saas.api_key</code></td><td>string</td><td>—</td>
            <td><strong>Required.</strong> Your agent API key from Settings → Agent Keys. Starts with <code>osd_</code>.</td>
          </tr>
        </tbody>
      </table>

      <h2>agent</h2>
      <p>Controls how often the agent runs and where it logs.</p>

      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr>
            <td><code>agent.interval_minutes</code></td><td>int</td><td><code>360</code></td>
            <td>How often to run a full diagnostic, in minutes. Default is 6 hours. Set to <code>30</code> for more frequent checks (uses more API quota). Minimum recommended: 15.</td>
          </tr>
          <tr>
            <td><code>agent.heartbeat_seconds</code></td><td>int</td><td><code>300</code></td>
            <td>How often the agent sends a heartbeat, in seconds. The dashboard marks the agent offline if no heartbeat is received for 30 minutes.</td>
          </tr>
          <tr>
            <td><code>agent.log_file</code></td><td>string</td><td><code>agent.log</code></td>
            <td>Path to the log file. Relative paths are resolved from the directory where the agent binary is located.</td>
          </tr>
          <tr>
            <td><code>agent.enabled_categories</code></td><td>[]string</td><td>all</td>
            <td>
              Limit which check categories run. Leave empty (or omit) to run all 11 categories.
              Valid values: <code>cluster_health</code>, <code>nodes</code>, <code>shards</code>, <code>indices</code>,{" "}
              <code>performance</code>, <code>snapshots</code>, <code>ism_policies</code>, <code>security</code>,{" "}
              <code>plugins</code>, <code>ingest_pipelines</code>, <code>templates</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Environment variable override</h2>
      <p>
        You can override the platform URL without editing the config file — useful for containers:
      </p>
      <pre><code>OPENSEARCH_DOCTOR_URL=https://your-instance.example.com ./agent --config config.yaml</code></pre>

      <h2>File permissions</h2>
      <p>
        The <code>--init</code> wizard writes <code>config.yaml</code> with <code>600</code> permissions (owner read/write only).
        If you create the file manually, set the same:
      </p>
      <pre><code>chmod 600 config.yaml</code></pre>

      <div className="not-prose mt-8 flex gap-4">
        <Link href="/docs/installation" className="text-sm text-muted-foreground hover:text-primary font-medium">
          ← Installation
        </Link>
        <Link href="/docs/checks" className="text-sm text-primary hover:underline font-medium">
          Next: What it checks →
        </Link>
      </div>
    </div>
  );
}
