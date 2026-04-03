import { ArticleLayout } from "@/components/blog/article-layout";
import { getPost } from "@/lib/blog";

const post = getPost("opensearch-unassigned-shards")!;

export const metadata = {
  title: `${post.title} — OpenSearch Doctor Blog`,
  description: post.description,
};

export default function Article() {
  return (
    <ArticleLayout {...post}>

      <p>
        Unassigned shards are one of the most common problems in OpenSearch — and one of the most mishandled. The cluster goes yellow (or red). Someone runs <code>GET /_cat/shards</code>, sees <code>UNASSIGNED</code> next to a bunch of shards, and starts Googling for the magic command to fix it. They find a Stack Overflow answer telling them to run <code>POST /_cluster/reroute</code> with <code>accept_data_loss: true</code>, they run it, and the shards assign. Problem solved.
      </p>
      <p>
        Except it isn&apos;t. Running reroute with <code>accept_data_loss: true</code> on a primary shard that went unassigned because the node holding its data died permanently means you just told OpenSearch to start with an empty primary — permanently discarding whatever data was on that shard. The cluster goes green. The data is gone.
      </p>
      <p>
        This post explains why shards go unassigned, how to correctly diagnose each cause, and how to fix each one without data loss.
      </p>

      <h2>What Are Shards?</h2>
      <p>
        An OpenSearch index is divided into one or more <strong>shards</strong> — each shard is a self-contained Lucene index stored on a node. A shard has two roles: <em>primary</em> (the source of truth for writes) and <em>replica</em> (a copy for redundancy and read throughput).
      </p>
      <p>
        Every primary shard must be assigned to exactly one node. Every replica shard must be assigned to a <em>different</em> node than its primary. When either type can&apos;t be assigned, it&apos;s &quot;unassigned&quot; and the cluster reports as yellow (replica unassigned) or red (primary unassigned).
      </p>

      <h2>The Most Important Command: Allocation Explain</h2>
      <p>
        Before doing anything else, run this:
      </p>
      <pre><code>{`GET /_cluster/allocation/explain
{
  "index": "your-index-name",
  "shard": 0,
  "primary": true
}`}</code></pre>
      <p>
        This returns a detailed explanation of why the shard can&apos;t be assigned. It tells you the exact reason — not a generic error, but a specific, actionable explanation. Always start here.
      </p>
      <p>
        If you omit the body, OpenSearch will explain an arbitrary unassigned shard, which is usually useful enough to start with:
      </p>
      <pre><code>GET /_cluster/allocation/explain</code></pre>

      <h2>Root Cause 1: Node Left the Cluster</h2>
      <p>
        <strong>What happens:</strong> A node restarts, crashes, or is shut down. Any shards that had their primary or only replica on that node become unassigned.
      </p>
      <p>
        <strong>Allocation explain output:</strong> You&apos;ll see something like <code>node_left</code> as the unassigned reason, and the explanation will say the node that held the shard is no longer in the cluster.
      </p>
      <p>
        <strong>What to do:</strong>
      </p>
      <ul>
        <li><strong>If the node is coming back</strong> (rebooting, temporary network issue): wait. OpenSearch has a <code>delayed_timeout</code> setting (default 1 minute) specifically to avoid immediately moving shards when a node bounces. If the node comes back within the timeout, shards reassign instantly without any data movement.</li>
        <li><strong>If the node is permanently gone</strong>: OpenSearch will try to promote a replica to primary. If there&apos;s a healthy replica on another node, this happens automatically. If there&apos;s no replica (you had 0 replicas or all replicas were also on the failed node), you&apos;re in a data loss situation — see the section on accept_data_loss below.</li>
      </ul>
      <pre><code>{`# Check which nodes are currently in the cluster
GET /_cat/nodes?v

# Increase delayed timeout to avoid moving shards during rolling restarts
PUT /_all/_settings
{
  "settings": {
    "index.unassigned.node_left.delayed_timeout": "5m"
  }
}`}</code></pre>

      <h2>Root Cause 2: Disk Watermark Exceeded</h2>
      <p>
        <strong>What happens:</strong> A node&apos;s disk usage crosses the high watermark (default 90%). OpenSearch stops allocating new shards to that node. Existing shards on the node start being moved off it. If there&apos;s nowhere to move them (all nodes are above 85% disk usage), shards become unassigned.
      </p>
      <p>
        <strong>Allocation explain output:</strong> The reason will be <code>DECIDERS</code> with an explanation mentioning the DiskThresholdDecider and showing disk usage percentages.
      </p>
      <p>
        <strong>What to do:</strong>
      </p>
      <ul>
        <li>Free up disk space — delete old indices, force-merge, or run ISM policies to roll over and delete old data.</li>
        <li>Add disk capacity to the affected nodes.</li>
        <li>Temporarily raise the watermarks while you fix the underlying issue (not a long-term solution).</li>
      </ul>
      <pre><code>{`# Check disk usage per node
GET /_cat/allocation?v

# Temporarily raise watermarks (not permanent — fix disk first)
PUT /_cluster/settings
{
  "transient": {
    "cluster.routing.allocation.disk.watermark.low": "90%",
    "cluster.routing.allocation.disk.watermark.high": "95%",
    "cluster.routing.allocation.disk.watermark.flood_stage": "97%"
  }
}`}</code></pre>

      <h2>Root Cause 3: Replica Count Exceeds Node Count</h2>
      <p>
        <strong>What happens:</strong> A shard cannot have its primary and replica on the same node. If you set <code>number_of_replicas: 2</code> on a 2-node cluster, there aren&apos;t enough nodes to host both replicas on different nodes from the primary. One replica will always be unassigned.
      </p>
      <p>
        <strong>Allocation explain output:</strong> The reason will reference <code>SameShardAllocationDecider</code> or note that there are no nodes that can hold the shard without violating allocation rules.
      </p>
      <p>
        <strong>What to do:</strong> Either add more nodes or reduce the replica count.
      </p>
      <pre><code>{`# Reduce replicas to fit your node count
# For a 2-node cluster, max replicas = 1
PUT /your-index/_settings
{
  "number_of_replicas": 1
}`}</code></pre>

      <h2>Root Cause 4: Max Retry Exceeded (ALLOCATION_FAILED)</h2>
      <p>
        <strong>What happens:</strong> OpenSearch tried to allocate a shard, the allocation failed (usually because the shard data on disk was corrupt or the node crashed mid-write), and after 5 attempts it stops trying. The shard stays unassigned indefinitely.
      </p>
      <p>
        <strong>Allocation explain output:</strong> The unassigned reason is <code>ALLOCATION_FAILED</code>. The explanation will show the number of failed allocation attempts and the specific error.
      </p>
      <p>
        <strong>What to do:</strong> If the data is recoverable (other copies exist on healthy nodes), retry the allocation:
      </p>
      <pre><code>{`# Reset failed allocation attempts and let OpenSearch try again
POST /_cluster/reroute?retry_failed=true`}</code></pre>
      <p>
        If retrying still fails and a healthy replica exists on another node, promote the replica:
      </p>
      <pre><code>{`POST /_cluster/reroute
{
  "commands": [
    {
      "allocate_replica": {
        "index": "your-index",
        "shard": 0,
        "node": "node-with-good-data"
      }
    }
  ]
}`}</code></pre>

      <h2>Root Cause 5: Index Created on a Node That No Longer Exists</h2>
      <p>
        <strong>What happens:</strong> You created an index with an allocation filter (<code>index.routing.allocation.require.*</code>) that pins shards to a node that no longer exists, or to a node with a specific attribute that no longer applies.
      </p>
      <p>
        <strong>Allocation explain output:</strong> You&apos;ll see the FilterAllocationDecider blocking allocation on every node, with a note about the required attributes.
      </p>
      <p>
        <strong>What to do:</strong> Remove or update the allocation filter.
      </p>
      <pre><code>{`# Remove the allocation filter
PUT /your-index/_settings
{
  "index.routing.allocation.require._name": null
}`}</code></pre>

      <h2>The accept_data_loss Option — When and When Not to Use It</h2>
      <p>
        <code>accept_data_loss: true</code> is a last resort. It tells OpenSearch: &quot;I know you can&apos;t find a copy of this shard&apos;s data, but assign it anyway — start fresh with an empty shard.&quot;
      </p>
      <p>
        <strong>Use it only when:</strong>
      </p>
      <ul>
        <li>All copies of a primary shard&apos;s data are permanently destroyed (the node is gone and there are no replicas)</li>
        <li>You&apos;ve verified there is genuinely no recoverable copy of the data</li>
        <li>You accept that any documents on that shard are permanently lost</li>
        <li>The data can be re-indexed from a source system (your database, S3, etc.)</li>
      </ul>
      <p>
        <strong>Do not use it when:</strong>
      </p>
      <ul>
        <li>The node is temporarily unavailable (wait for it to come back)</li>
        <li>There might be a replica somewhere (check first)</li>
        <li>You can restore from a snapshot (always prefer this)</li>
      </ul>
      <pre><code>{`# Only run this after exhausting all other options
POST /_cluster/reroute
{
  "commands": [
    {
      "allocate_empty_primary": {
        "index": "your-index",
        "shard": 0,
        "node": "some-node",
        "accept_data_loss": true
      }
    }
  ]
}`}</code></pre>

      <h2>Prevention: How to Avoid Unassigned Shards</h2>
      <ul>
        <li><strong>Always run at least 1 replica</strong> for every production index. Zero replicas means any node failure causes a red cluster.</li>
        <li><strong>Set a <code>delayed_timeout</code></strong> of 5–10 minutes for time-series indices so rolling restarts don&apos;t trigger massive shard movement.</li>
        <li><strong>Alert on disk usage above 75%</strong> so you have time to react before the watermark kicks in.</li>
        <li><strong>Match replica count to node count</strong>: <code>number_of_replicas</code> should be <code>number_of_nodes - 1</code> at most.</li>
        <li><strong>Take regular snapshots</strong> so if you do need to use <code>accept_data_loss</code>, you can restore from backup immediately after.</li>
      </ul>

    </ArticleLayout>
  );
}
