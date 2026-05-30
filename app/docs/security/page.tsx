export default function SecuritySetupPage() {
  return (
    <div>
      <h1>Security setup</h1>

      <p>
        OpenSearch Doctor&apos;s agent only needs <strong>read access to cluster metadata APIs</strong>.
        It never reads your indexed documents. This page shows you how to create a minimal-permission
        OpenSearch user for the agent — so you can verify exactly what it can and cannot access.
      </p>

      <div className="not-prose my-6 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-5">
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
          ✅ What the agent accesses
        </p>
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          Cluster health, node stats, shard metadata, index names and sizes, snapshot status,
          cluster settings, circuit breaker state. These are all diagnostic metadata APIs.
        </p>
      </div>

      <div className="not-prose my-6 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-5">
        <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
          ❌ What the agent never accesses
        </p>
        <p className="text-sm text-red-700 dark:text-red-400">
          Your indexed documents. The agent does not use any data read APIs
          (<code>_search</code>, <code>_doc</code>, <code>_mget</code>, etc.).
          It cannot read the content of your indices.
        </p>
      </div>

      <h2>APIs used by the agent</h2>

      <p>The agent calls only these OpenSearch endpoints:</p>

      <table>
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>GET /_cluster/health</code></td><td>Cluster status (green/yellow/red)</td></tr>
          <tr><td><code>GET /_cluster/stats</code></td><td>Cluster-wide counters</td></tr>
          <tr><td><code>GET /_cluster/settings</code></td><td>Cluster configuration</td></tr>
          <tr><td><code>GET /_nodes/stats</code></td><td>JVM heap, CPU, disk per node</td></tr>
          <tr><td><code>GET /_nodes/info</code></td><td>Node roles and versions</td></tr>
          <tr><td><code>GET /_nodes/stats/breaker</code></td><td>Circuit breaker state</td></tr>
          <tr><td><code>GET /_cat/shards</code></td><td>Shard assignment and state</td></tr>
          <tr><td><code>GET /_cat/indices</code></td><td>Index names, doc counts, sizes</td></tr>
          <tr><td><code>GET /_cat/allocation</code></td><td>Disk usage per node</td></tr>
          <tr><td><code>GET /_cat/nodes</code></td><td>Node list and roles</td></tr>
          <tr><td><code>GET /_snapshot</code></td><td>Snapshot repository status</td></tr>
          <tr><td><code>GET /_tasks</code></td><td>Running background tasks</td></tr>
        </tbody>
      </table>

      <p>
        None of these endpoints return document content. They return cluster and index metadata only.
      </p>

      <h2>Create a minimal-permission role for the agent</h2>

      <p>
        We recommend creating a dedicated OpenSearch user with only the permissions the agent needs.
        This way you can verify — and enforce — that the agent cannot read your data.
      </p>

      <h3>Step 1 — Create the role</h3>

      <p>Run this against your OpenSearch cluster:</p>

      <pre><code>{`PUT /_plugins/_security/api/roles/opensearch_doctor_agent
{
  "cluster_permissions": [
    "cluster:monitor/health",
    "cluster:monitor/stats",
    "cluster:monitor/nodes/info",
    "cluster:monitor/nodes/stats",
    "cluster:monitor/nodes/usage",
    "cluster:monitor/state",
    "cluster:monitor/settings/get",
    "cluster:monitor/task/get",
    "cluster:monitor/tasks/lists"
  ],
  "index_permissions": [
    {
      "index_patterns": ["*"],
      "allowed_actions": [
        "indices:monitor/stats",
        "indices:monitor/recovery",
        "indices:monitor/settings/get",
        "indices:monitor/shards/search_shards"
      ]
    }
  ]
}`}</code></pre>

      <p>
        This role grants <code>cluster:monitor/*</code> and <code>indices:monitor/*</code> only.
        It explicitly does <strong>not</strong> include <code>indices:data/read/*</code>,
        which is required to read document content. An agent using this role
        cannot execute <code>_search</code> or read any indexed document.
      </p>

      <h3>Step 2 — Create the user</h3>

      <pre><code>{`PUT /_plugins/_security/api/internalusers/opensearch_doctor_agent
{
  "password": "your-strong-password-here",
  "backend_roles": [],
  "attributes": {}
}`}</code></pre>

      <h3>Step 3 — Map the user to the role</h3>

      <pre><code>{`PUT /_plugins/_security/api/rolesmapping/opensearch_doctor_agent
{
  "users": ["opensearch_doctor_agent"]
}`}</code></pre>

      <h3>Step 4 — Configure the agent</h3>

      <p>
        In your agent configuration file (<code>agent.yaml</code>), set the credentials
        for the restricted user:
      </p>

      <pre><code>{`opensearch:
  endpoint: "https://localhost:9200"
  username: "opensearch_doctor_agent"
  password: "your-strong-password-here"
  tls_skip_verify: false`}</code></pre>

      <h2>Verify the restriction works</h2>

      <p>
        You can confirm the agent user cannot read your data by running a search request
        with its credentials — you should receive a <code>403 Forbidden</code>:
      </p>

      <pre><code>{`curl -u opensearch_doctor_agent:your-password \\
  "https://localhost:9200/your-index/_search" \\
  -k

# Expected response:
# {"error":{"type":"security_exception","reason":"no permissions for [indices:data/read/search]"},"status":403}`}</code></pre>

      <p>
        If you see a <code>403</code>, the restriction is working correctly. The agent
        cannot read your indexed data.
      </p>

      <h2>Using the admin user (simpler setup)</h2>

      <p>
        If you prefer a simpler setup and trust the platform, you can use your admin credentials directly.
        The agent only calls the metadata APIs listed above regardless of what permissions it has —
        but the minimal-permission approach gives you cryptographic proof of that.
      </p>

      <p>
        The choice is yours. Both setups work identically from a diagnostics perspective.
      </p>

      <h2>No OpenSearch Security plugin?</h2>

      <p>
        If you&apos;re running a minimal OpenSearch setup without the Security plugin (common in dev/staging),
        there are no credentials to configure. Leave the <code>username</code> and <code>password</code>
        fields empty in <code>agent.yaml</code>.
      </p>

      <div className="not-prose mt-8 rounded-xl border border-border/60 bg-muted/40 p-5">
        <p className="text-sm font-semibold mb-1">Questions about security?</p>
        <p className="text-sm text-muted-foreground">
          Email us at{" "}
          <a href="mailto:support@opensearchdoctor.com" className="text-primary hover:underline">
            support@opensearchdoctor.com
          </a>
          . We&apos;re happy to review your specific setup.
        </p>
      </div>
    </div>
  );
}
