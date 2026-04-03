import { ArticleLayout } from "@/components/blog/article-layout";
import { getPost } from "@/lib/blog";
import Link from "next/link";

const post = getPost("8-opensearch-problems")!;

export const metadata = {
  title: `${post.title} — OpenSearch Doctor Blog`,
  description: post.description,
};

export default function Article() {
  return (
    <ArticleLayout {...post}>

      <p>
        Most OpenSearch cluster failures don&apos;t come out of nowhere. There&apos;s no sudden catastrophic event — just a slow accumulation of problems that nobody noticed until something broke. The heap creeps up. Shards go unassigned and stay that way. Snapshots stop working and nobody checks. Then one day a node falls over and the cluster can&apos;t recover on its own.
      </p>
      <p>
        Here are the 8 issues that silently degrade clusters and eventually cause outages — and how to spot them before they hurt you.
      </p>

      <h2>1. JVM Heap Pressure Above 85%</h2>
      <p>
        OpenSearch runs on the JVM, and the JVM manages memory with a garbage collector. When heap usage climbs above roughly 75%, the GC starts working harder to free memory. Above 85%, it can trigger <strong>stop-the-world GC pauses</strong> — moments where the JVM freezes all threads to collect garbage. To your users, this looks like a slow or unresponsive cluster.
      </p>
      <p>
        Above 90%, OpenSearch activates circuit breakers that start rejecting requests outright. Above 95%, you risk an <code>OutOfMemoryError</code> that crashes the JVM entirely.
      </p>
      <p>
        The problem is that heap usage climbs gradually. A cluster running at 70% today might be at 88% in three weeks if you&apos;ve added indices or changed query patterns. By the time queries start failing, the pressure has been building for weeks.
      </p>
      <p>
        <strong>What to do:</strong> Monitor heap % per node. Set an alert at 80%. Above 85%, either add nodes, increase heap allocation (up to 32 GB — do not go beyond this due to compressed OOPs), or reduce fielddata usage.
      </p>
      <pre><code>{`GET /_nodes/stats/jvm
# Look at: nodes.*.jvm.mem.heap_used_percent`}</code></pre>

      <h2>2. Unassigned Shards — Left Alone Too Long</h2>
      <p>
        When a node leaves the cluster or a shard fails to allocate, its shards become <strong>unassigned</strong>. OpenSearch will try to reassign them automatically in many cases — but not all.
      </p>
      <p>
        If a node was removed intentionally (decommissioned, scaled down, rebooted for too long), its primary shards won&apos;t reassign until you either bring the node back or explicitly tell OpenSearch to allocate the shard elsewhere. In the meantime, those shards are unavailable. If a primary shard is unassigned, reads and writes to that shard will fail.
      </p>
      <p>
        The real danger: teams often see the yellow status, note that the cluster is still responding, and move on. Those unassigned shards stay unassigned for days. If a second node fails during that window, you now have primary shards with no replicas — potential data loss.
      </p>
      <p>
        <strong>What to do:</strong> Never ignore unassigned shards for more than a few minutes. Run <code>GET /_cluster/allocation/explain</code> to understand why a shard is unassigned, then fix the root cause. Don&apos;t just force-allocate without understanding why it happened.
      </p>

      <h2>3. No Recent Snapshot</h2>
      <p>
        This one is embarrassingly common. The snapshot repository was set up, a few test snapshots ran, and then something changed — a node IP, a storage credential, an S3 bucket policy — and snapshots started failing silently. Nobody noticed because the cluster was healthy. Then a corruption event or accidental index deletion happened, and there was no usable backup.
      </p>
      <p>
        Snapshots in OpenSearch are incremental, cheap to run once you have the first one, and they&apos;re the only reliable recovery option for data loss events. Running them isn&apos;t enough — you need to verify they&apos;re <em>completing successfully</em>.
      </p>
      <p>
        <strong>What to do:</strong> Configure a daily snapshot policy via ISM or a cron job. Check <code>GET /_snapshot/_all/_all?ignore_unavailable=true</code> regularly and alert if no <code>SUCCESS</code> state snapshot exists within the last 24 hours.
      </p>

      <h2>4. Cluster RED With No Alerting</h2>
      <p>
        A cluster goes RED when one or more <em>primary</em> shards are unassigned. This means those shards are not serving reads or writes. Data may be unavailable. Indexing to affected indices will fail.
      </p>
      <p>
        The thing about RED status: it can happen within minutes of a node failure, and if you don&apos;t have an alert, you might not know for hours — until a user reports that search results stopped updating, or an engineering team notices that writes are returning errors.
      </p>
      <p>
        Many teams rely on <em>passive</em> monitoring: they&apos;ll notice something is wrong when the application breaks. That&apos;s too late. You want to know the cluster is RED before any user does.
      </p>
      <p>
        <strong>What to do:</strong> Set up an active health check on <code>GET /_cluster/health?wait_for_status=yellow&timeout=5s</code> and alert immediately on RED. At minimum, poll this endpoint every 60 seconds.
      </p>

      <h2>5. Anonymous Access Enabled</h2>
      <p>
        OpenSearch ships with the security plugin enabled by default in modern versions, but this wasn&apos;t always the case — and plenty of clusters were set up during or before the transition. Some teams deliberately disable security for internal clusters, reasoning that the cluster is only accessible from within the VPC.
      </p>
      <p>
        The problem: &quot;only accessible from within the VPC&quot; is not as strong a guarantee as it sounds. VPCs get misconfigured. Security groups get loosened. Applications running inside the same network get compromised. Once an attacker has access to your OpenSearch endpoint without authentication, they can read all your data, delete indices, and potentially pivot further into your infrastructure via the REST API.
      </p>
      <p>
        Anonymous access is also a compliance issue. Any regulation that requires audit logging (GDPR, SOC 2, HIPAA) requires that you know who accessed what. Anonymous access makes that impossible.
      </p>
      <p>
        <strong>What to do:</strong> Check <code>GET /_plugins/_security/api/securityconfig</code>. Ensure <code>anonymous_auth_enabled</code> is <code>false</code>. Enable TLS on both HTTP and transport layers.
      </p>

      <h2>6. ISM Policy Failures — Silent and Cumulative</h2>
      <p>
        Index State Management (ISM) is how most OpenSearch operators automate index lifecycle — rolling over time-series indices, moving cold data to cheaper storage, deleting old indices. When ISM works, it&apos;s invisible. When it breaks, indices accumulate indefinitely and storage fills up.
      </p>
      <p>
        ISM failures are rarely dramatic. An index gets stuck in a state. The policy stops executing. No error is surfaced in the cluster health status — the cluster stays green while your disk usage climbs by 20 GB per day. Weeks later you hit the disk watermark, the cluster flips indices to read-only, and all indexing stops.
      </p>
      <p>
        Common causes: rollover alias not configured on the index, a condition that can never be met (e.g. <code>min_doc_count: 1000000</code> on an index that only ever gets 500 docs), or a state machine that requires a transition that was never defined.
      </p>
      <p>
        <strong>What to do:</strong> Check <code>GET /_plugins/_ism/explain/*</code> regularly. Look for indices where <code>info.cause</code> is non-empty — that&apos;s an ISM error. Fix the root cause (usually the alias or the condition), then retry the policy: <code>POST /_plugins/_ism/retry/&lt;index&gt;</code>.
      </p>

      <h2>7. Single-Node Cluster — No Redundancy</h2>
      <p>
        A cluster running on a single node has no fault tolerance. If that node goes down for any reason — host restart, hardware failure, OOM, or a bad deployment — your cluster is completely unavailable. Every primary shard becomes unassigned. Every index becomes inaccessible.
      </p>
      <p>
        This is obviously unacceptable for production, but single-node clusters often start as &quot;temporary&quot; setups that outlive their original purpose. A staging environment that becomes load-bearing. A proof-of-concept that got promoted to production. A cost-cutting measure that nobody revisited.
      </p>
      <p>
        Even two nodes is significantly better than one — you can lose a node without losing the cluster. Three nodes is the minimum for a resilient cluster with a proper quorum for master elections.
      </p>
      <p>
        <strong>What to do:</strong> Check <code>number_of_nodes</code> in <code>GET /_cluster/health</code>. For any data that matters, run at least 3 nodes. Set <code>discovery.zen.minimum_master_nodes</code> to <code>(N/2)+1</code> where N is the number of master-eligible nodes.
      </p>

      <h2>8. Too Many Small Shards (Over-Sharding)</h2>
      <p>
        A common pattern when getting started with OpenSearch: create indices with 5 primary shards by default, add a daily rollover, and end up with hundreds of indices each with 5 shards — thousands of shards total for a dataset that could fit comfortably in 10.
      </p>
      <p>
        Each shard is a Lucene instance. Each Lucene instance has overhead: file handles, heap memory for segment metadata, thread pool participation. At scale, thousands of tiny shards consume more heap than the data itself. The rule of thumb: shards should be 10–50 GB each. Below 1 GB per shard, the overhead cost exceeds the value of the shard.
      </p>
      <p>
        Over-sharding also makes recovery slower. When a node fails, OpenSearch must recover every shard that was on that node. A thousand 100 MB shards take longer to recover than ten 10 GB shards, even though the total data is the same.
      </p>
      <p>
        <strong>What to do:</strong> Audit your shards with <code>GET /_cat/shards?v&s=store:desc</code>. Identify indices with many tiny shards and consolidate with <Link href="/blog/opensearch-ism-policies">ISM rollover policies</Link> that trigger on size rather than time, or use the Shrink API on historical indices.
      </p>

      <h2>How to Catch All of This Automatically</h2>
      <p>
        Manually checking all 8 of these issues across every cluster you manage isn&apos;t realistic. Most teams check reactively — after something breaks. By then, the damage is done.
      </p>
      <p>
        OpenSearch Doctor runs these checks automatically every 6 hours and alerts you the moment a threshold is crossed. Heap above 85%: you get notified. Unassigned shards: alerted within minutes. No recent snapshot: flagged. ISM errors: surfaced. All 8 issues above are covered by the agent&apos;s diagnostic checks.
      </p>
      <p>
        The agent runs on your own server, connects to your cluster locally, and never reads your documents or credentials. It&apos;s free for 1 cluster with no credit card required.
      </p>

    </ArticleLayout>
  );
}
