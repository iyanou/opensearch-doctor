import { ArticleLayout } from "@/components/blog/article-layout";
import { getPost } from "@/lib/blog";

const post = getPost("monitor-opensearch-cluster")!;

export const metadata = {
  title: `${post.title} — OpenSearch Doctor Blog`,
  description: post.description,
};

export default function Article() {
  return (
    <ArticleLayout {...post}>

      <p>
        If you&apos;re running OpenSearch on your own infrastructure — on EC2, bare metal, on-premise, or a VPS — you already know the tooling gap. AWS OpenSearch Service gives you CloudWatch dashboards. Elastic Cloud gives you built-in monitoring. But self-managed OpenSearch gives you the <code>_cat</code> APIs, a JSON response, and a blank stare.
      </p>
      <p>
        This guide covers what you should actually monitor, what tools are available in 2026, and how to build a monitoring setup that tells you about problems before your users do.
      </p>

      <h2>What You Actually Need to Monitor</h2>
      <p>
        Before picking a tool, you need to know what matters. Self-managed OpenSearch clusters fail in predictable ways. These are the metrics that give you early warning:
      </p>

      <h3>Cluster health — your first indicator</h3>
      <p>
        <code>GET /_cluster/health</code> returns a single status: green, yellow, or red. Green means all shards are assigned and healthy. Yellow means all primaries are assigned but some replicas aren&apos;t. Red means at least one primary shard is unassigned — data may be unavailable.
      </p>
      <p>
        This is the first thing you should check and the first thing you should alert on. A cluster that goes red is an emergency. A cluster that stays yellow for more than a few minutes needs investigation.
      </p>

      <h3>JVM heap usage — your stability indicator</h3>
      <p>
        Check <code>nodes.*.jvm.mem.heap_used_percent</code> from <code>GET /_nodes/stats/jvm</code>. Below 75%: healthy. 75–85%: watch it. Above 85%: act now. Above 90%: circuit breakers will start rejecting requests.
      </p>

      <h3>Disk usage — your time bomb</h3>
      <p>
        OpenSearch has disk watermarks built in. When disk usage crosses 85%, it stops allocating new shards to that node. At 90%, it starts moving existing shards off the node. At 95%, it puts every index on that node into read-only mode — all writes fail.
      </p>
      <p>
        Check <code>nodes.*.fs.total.available_in_bytes</code> and <code>total_in_bytes</code> from <code>GET /_nodes/stats/fs</code>. Alert at 80% disk usage — you want time to act before OpenSearch acts for you.
      </p>

      <h3>Unassigned shards — your data availability indicator</h3>
      <p>
        <code>unassigned_shards</code> from <code>GET /_cluster/health</code> tells you how many shards have no home. Zero is good. Anything above zero warrants investigation. More than 0 primary unassigned shards means data is currently unavailable.
      </p>

      <h3>Indexing and search throughput — your performance baseline</h3>
      <p>
        From <code>GET /_nodes/stats/indices</code>, track:
      </p>
      <ul>
        <li><code>indices.indexing.index_total</code> — total documents indexed (use rate of change)</li>
        <li><code>indices.search.query_total</code> — total search queries</li>
        <li><code>indices.search.query_time_in_millis / query_total</code> — average search latency</li>
        <li><code>thread_pool.write.rejected</code> — indexing requests being dropped (should be 0)</li>
        <li><code>thread_pool.search.rejected</code> — search requests being dropped (should be 0)</li>
      </ul>
      <p>
        Thread pool rejections are a critical signal. A non-zero rejection count means OpenSearch is actively discarding work because it&apos;s overloaded.
      </p>

      <h3>Snapshot recency — your backup status</h3>
      <p>
        Check <code>GET /_snapshot/_all/_all</code> and verify that at least one snapshot in each repository has state <code>SUCCESS</code> within the last 24 hours. No recent successful snapshot is a silent risk that only becomes visible when you need it.
      </p>

      <h2>Your Options for Monitoring</h2>
      <p>
        There are four realistic approaches for self-managed OpenSearch. Here&apos;s an honest assessment of each.
      </p>

      <h3>Option 1: DIY with Prometheus + Grafana</h3>
      <p>
        The most flexible option. The <strong>prometheus-exporter</strong> plugin (bundled with modern OpenSearch versions) exposes metrics at <code>GET /_prometheus/metrics</code>. Prometheus scrapes it. Grafana visualises it. You build dashboards.
      </p>
      <p>
        <strong>Pros:</strong> Full control, unlimited metrics, no external dependency, cost scales with your existing Prometheus infrastructure.
      </p>
      <p>
        <strong>Cons:</strong> Significant setup time. You need to build dashboards from scratch or import community ones (which are never quite right). You still need to write alerting rules. You&apos;re monitoring metrics — raw numbers — not findings. &quot;Heap is at 87%&quot; tells you something is wrong, but not what to do about it.
      </p>
      <p>
        <strong>Best for:</strong> Teams with an existing Prometheus stack who want to add OpenSearch to their existing monitoring setup.
      </p>

      <h3>Option 2: OpenSearch Dashboards with Stack Monitoring</h3>
      <p>
        OpenSearch Dashboards (the open-source Kibana fork) includes a monitoring section that pulls data from the <code>.monitoring-*</code> indices. It shows node metrics, index stats, and shard information in a pre-built UI.
      </p>
      <p>
        <strong>Pros:</strong> Already included if you&apos;re running OpenSearch Dashboards. No additional infrastructure.
      </p>
      <p>
        <strong>Cons:</strong> Monitoring data must be stored in the same cluster you&apos;re monitoring (a risk: if the cluster goes down, you lose monitoring too). The UI is basic. Alerting requires additional configuration. No actionable findings — just raw metrics.
      </p>
      <p>
        <strong>Best for:</strong> Teams who already use OpenSearch Dashboards and want basic visibility with minimal setup.
      </p>

      <h3>Option 3: Generic APM / Observability Platforms</h3>
      <p>
        Tools like Datadog, New Relic, or Dynatrace have OpenSearch integrations. They collect metrics, display dashboards, and can fire alerts.
      </p>
      <p>
        <strong>Pros:</strong> Polished dashboards. Integrates with your existing APM stack if you&apos;re already paying for one.
      </p>
      <p>
        <strong>Cons:</strong> Expensive. Datadog with infrastructure + APM can run $30–100+/month per host. The OpenSearch integration is generic — it collects standard metrics but doesn&apos;t provide OpenSearch-specific diagnostics (ISM policy failures, shard allocation reasons, security misconfigurations). You&apos;re paying for a general-purpose tool and using 5% of its OpenSearch-specific capabilities.
      </p>
      <p>
        <strong>Best for:</strong> Large engineering teams with existing APM contracts who want OpenSearch baked into their existing observability platform and have budget to match.
      </p>

      <h3>Option 4: Purpose-Built OpenSearch Diagnostics</h3>
      <p>
        Tools built specifically for OpenSearch — like <strong>OpenSearch Doctor</strong> — take a different approach. Instead of collecting raw metrics and letting you figure out what they mean, they run structured diagnostic checks and surface actionable findings.
      </p>
      <p>
        The difference: &quot;Heap usage: 87%&quot; vs &quot;Node es-data-01 JVM heap is at 87% — GC pressure is likely causing latency spikes. Consider adding a data node or increasing heap allocation up to 32 GB.&quot;
      </p>
      <p>
        <strong>Pros:</strong> Actionable findings, not raw metrics. OpenSearch-specific checks (ISM, security config, snapshot health, shard allocation reasons). Faster time-to-value — no dashboard building. Alerting included.
      </p>
      <p>
        <strong>Cons:</strong> Less raw data than Prometheus. Not suitable if you need to correlate OpenSearch metrics with application traces in the same tool.
      </p>
      <p>
        <strong>Best for:</strong> Teams running OpenSearch as a primary workload who want diagnostic intelligence, not just metric collection.
      </p>

      <h2>Building a Minimal Monitoring Setup (DIY)</h2>
      <p>
        If you want to roll your own, here&apos;s the minimum viable setup using bash and Prometheus.
      </p>
      <p>
        <strong>Step 1: Enable the Prometheus exporter plugin</strong>
      </p>
      <pre><code>{`# Check if it's already installed
GET /_cat/plugins?v&s=component

# If not, install it (requires node restart)
bin/opensearch-plugin install prometheus-exporter`}</code></pre>

      <p>
        <strong>Step 2: Scrape metrics in Prometheus</strong>
      </p>
      <pre><code>{`# prometheus.yml
scrape_configs:
  - job_name: opensearch
    static_configs:
      - targets: ['localhost:9200']
    metrics_path: /_prometheus/metrics
    basic_auth:
      username: admin
      password: your-password`}</code></pre>

      <p>
        <strong>Step 3: Minimal alerting rules</strong>
      </p>
      <pre><code>{`# alerts.yml
groups:
  - name: opensearch
    rules:
      - alert: OpenSearchClusterRed
        expr: opensearch_cluster_status{color="red"} == 1
        for: 1m
        labels:
          severity: critical

      - alert: OpenSearchHeapHigh
        expr: opensearch_jvm_mem_heap_used_percent > 85
        for: 5m
        labels:
          severity: warning

      - alert: OpenSearchUnassignedShards
        expr: opensearch_cluster_shards_unassigned > 0
        for: 5m
        labels:
          severity: warning

      - alert: OpenSearchDiskHigh
        expr: (1 - opensearch_fs_total_available_in_bytes / opensearch_fs_total_total_in_bytes) * 100 > 80
        for: 10m
        labels:
          severity: warning`}</code></pre>

      <h2>The Gap Raw Metrics Don&apos;t Fill</h2>
      <p>
        Even with Prometheus and Grafana running perfectly, there are things raw metrics can&apos;t tell you:
      </p>
      <ul>
        <li><strong>Why</strong> a shard is unassigned (node left vs disk watermark vs max retry exceeded — each has a different fix)</li>
        <li>Whether your ISM policies are silently failing</li>
        <li>Whether anonymous access is enabled on your cluster</li>
        <li>Whether your snapshot repository is actually working</li>
        <li>Whether your index templates have conflicting priorities</li>
        <li>Which specific indices are read-only and why</li>
      </ul>
      <p>
        These require calling specific OpenSearch APIs and interpreting the results — which is exactly what a diagnostic tool does, and what raw metric collection doesn&apos;t.
      </p>
      <p>
        The best monitoring setup for most self-managed OpenSearch teams is a combination: Prometheus for time-series metrics and graphs, and a diagnostic tool for actionable findings and OpenSearch-specific checks. The two are complementary rather than competing.
      </p>

    </ArticleLayout>
  );
}
