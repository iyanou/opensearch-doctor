import { ArticleLayout } from "@/components/blog/article-layout";
import { getPost } from "@/lib/blog";

const post = getPost("pulse-vs-opensearch-doctor")!;

export const metadata = {
  title: `${post.title} — OpenSearch Doctor Blog`,
  description: post.description,
};

export default function Article() {
  return (
    <ArticleLayout {...post}>

      <p>
        If you&apos;re looking for a monitoring or observability tool for your OpenSearch cluster, you&apos;ve likely come across both Pulse (by Bonsai) and OpenSearch Doctor. They sound like they solve the same problem. They don&apos;t — or rather, they solve it from different angles for different audiences.
      </p>
      <p>
        This post is an honest comparison. We&apos;re the team behind OpenSearch Doctor, so take that for what it&apos;s worth — but we&apos;ll try to give you a fair picture of what each product actually does, what it costs, and who should use which.
      </p>

      <h2>What Pulse Is</h2>
      <p>
        Pulse is Bonsai&apos;s monitoring product for Elasticsearch and OpenSearch clusters. It&apos;s designed primarily for teams who want a polished UI to view cluster metrics: node stats, index sizes, query latency, shard distribution, and so on. It connects to your cluster and presents the data in clean dashboards.
      </p>
      <p>
        Pulse is a good product. The UI is well-designed, setup is reasonably straightforward, and it covers the core metric categories you&apos;d want to see. If you want a Grafana-style dashboard without building one yourself, Pulse delivers that.
      </p>

      <h2>What OpenSearch Doctor Is</h2>
      <p>
        OpenSearch Doctor is a diagnostic tool, not a metrics dashboard. The distinction matters.
      </p>
      <p>
        A metrics dashboard shows you numbers: heap is at 87%, disk is at 73%, search latency averaged 450ms over the last hour. You then have to interpret those numbers and decide what they mean. Is 87% heap alarming or normal for this cluster? Is 450ms latency a problem or expected given the query load? The dashboard doesn&apos;t tell you.
      </p>
      <p>
        OpenSearch Doctor runs structured diagnostic checks and surfaces <strong>findings</strong>: specific problems detected in your cluster, explained in plain language, with recommended remediation steps. Not &quot;heap is 87%&quot; but &quot;Node es-data-01 heap is at 87% — GC pressure is likely causing latency spikes. The old generation GC is running every 8 seconds. Consider force-merging historical indices or adding a data node.&quot;
      </p>
      <p>
        It&apos;s the difference between a thermometer and a doctor.
      </p>

      <h2>Side-by-Side Comparison</h2>

      <h3>Architecture</h3>
      <p>
        <strong>Pulse:</strong> SaaS with cloud-side data collection. Pulse&apos;s infrastructure connects to your cluster endpoint from outside. Your cluster must be reachable over the internet (or via a network tunnel), and you provide credentials that Pulse stores and uses to scrape metrics.
      </p>
      <p>
        <strong>OpenSearch Doctor:</strong> Agent-based. A lightweight Go binary runs on your server, connects to OpenSearch locally (or via <code>localhost</code>), and pushes diagnostic results to the cloud dashboard. Your cluster never needs to be internet-accessible. The agent reads metrics and config data — it never reads document content. Source code is open for review.
      </p>

      <h3>What It Checks</h3>
      <p>
        <strong>Pulse:</strong> Core infrastructure metrics — heap, CPU, disk, JVM GC, search and indexing throughput, node availability. Broadly: the metrics you&apos;d get from <code>GET /_nodes/stats</code>.
      </p>
      <p>
        <strong>OpenSearch Doctor:</strong> Infrastructure metrics plus OpenSearch-specific diagnostics: ISM policy failures, snapshot health and recency, security configuration (anonymous access, TLS status), shard allocation root cause analysis, index template conflicts, read-only index detection, over-sharding, fielddata abuse, cluster settings anomalies, and more. Checks that require calling and interpreting multiple OpenSearch APIs, not just reading a single stats endpoint.
      </p>

      <h3>Alerting</h3>
      <p>
        <strong>Pulse:</strong> Alert rules based on metric thresholds. Email notifications. Some plans include Slack and PagerDuty.
      </p>
      <p>
        <strong>OpenSearch Doctor:</strong> Finding-based alerts — you get notified when a specific problem is detected, not when a raw metric crosses a threshold. Email, Slack, and webhook support. Alert rules can be scoped per cluster or per finding type.
      </p>

      <h3>Pricing</h3>
      <p>
        <strong>Pulse:</strong> Starts at around $15–30/month per cluster depending on the plan, scaling up based on cluster size and features. No permanent free tier for production use.
      </p>
      <p>
        <strong>OpenSearch Doctor:</strong> Free for 1 cluster (no credit card required), $39/month for up to 3 clusters (Starter), $99/month for up to 10 clusters (Pro), $199/month for unlimited clusters (Scale). Each tier includes alerting.
      </p>

      <h3>Cluster Accessibility Requirement</h3>
      <p>
        <strong>Pulse:</strong> Your cluster must be reachable from Pulse&apos;s scraper infrastructure. This typically means the cluster is internet-accessible or you maintain a VPN/tunnel.
      </p>
      <p>
        <strong>OpenSearch Doctor:</strong> The agent runs where your cluster runs. Clusters can be fully private — on-premise, air-gapped VPC, localhost-only. No inbound network access required.
      </p>

      <h2>Who Should Use Pulse</h2>
      <ul>
        <li>Teams who want a polished metrics dashboard and are comfortable exposing their cluster endpoint to an external service</li>
        <li>Teams where the cluster is already internet-accessible (hosted on a cloud provider with a public endpoint)</li>
        <li>Teams who need time-series graphs and want to slice metrics over time windows</li>
        <li>Teams who are already Bonsai customers and want monitoring integrated into that ecosystem</li>
      </ul>

      <h2>Who Should Use OpenSearch Doctor</h2>
      <ul>
        <li>Teams running OpenSearch in a private VPC, on-premise, or on bare metal where the cluster is not internet-accessible</li>
        <li>Teams who want actionable findings, not just raw numbers — &quot;here&apos;s what&apos;s wrong and how to fix it&quot; rather than &quot;here&apos;s the heap graph&quot;</li>
        <li>Teams dealing with OpenSearch-specific issues: ISM policies, shard allocation problems, snapshot failures, security configuration — problems that require interpreting API responses, not just scraping stats</li>
        <li>Teams who want to review the monitoring code before running it on their infrastructure</li>
        <li>Teams managing multiple clusters at different price points</li>
      </ul>

      <h2>Can You Use Both?</h2>
      <p>
        Yes, and for some teams it makes sense. Pulse gives you time-series metric graphs that OpenSearch Doctor doesn&apos;t focus on. OpenSearch Doctor gives you diagnostic findings and OpenSearch-specific checks that Pulse doesn&apos;t cover. If you want both — a metrics dashboard and a diagnostic layer — they&apos;re genuinely complementary rather than redundant.
      </p>
      <p>
        That said, for most self-managed OpenSearch teams, the biggest gap isn&apos;t metric graphs (you can get those free with Prometheus + Grafana) — it&apos;s the diagnostic layer that tells you <em>why</em> something is wrong and what to do about it. If you&apos;re choosing one, that&apos;s the more common unmet need.
      </p>

      <h2>The Honest Summary</h2>
      <p>
        If you want pretty metric dashboards and your cluster is already internet-accessible: Pulse is a solid choice.
      </p>
      <p>
        If you want to know <em>what&apos;s actually wrong</em> with your cluster and what to do about it — especially for ISM, snapshots, security config, and shard allocation issues that raw metrics can&apos;t surface — OpenSearch Doctor is built specifically for that.
      </p>
      <p>
        If you&apos;re not sure which you need: start with OpenSearch Doctor&apos;s free tier (1 cluster, no credit card). Run it for a week against your cluster. The diagnostic findings alone will tell you whether you have the kind of problems it&apos;s designed to catch.
      </p>

    </ArticleLayout>
  );
}
