import { ArticleLayout } from "@/components/blog/article-layout";
import { getPost } from "@/lib/blog";

const post = getPost("opensearch-jvm-heap")!;

export const metadata = {
  title: `${post.title} — OpenSearch Doctor Blog`,
  description: post.description,
};

export default function Article() {
  return (
    <ArticleLayout {...post}>

      <p>
        JVM heap pressure is quietly responsible for more OpenSearch incidents than any other single factor. It&apos;s not the most dramatic failure mode — the cluster doesn&apos;t crash immediately. Instead, performance degrades gradually, queries get slower, and then one day a node goes out-of-memory and the cluster starts shedding shards. By then, the heap has been climbing for weeks.
      </p>
      <p>
        This guide explains what heap usage actually means in OpenSearch, which thresholds matter, why the 32 GB limit exists, and what levers you have when heap climbs too high.
      </p>

      <h2>What JVM Heap Is (and Isn&apos;t)</h2>
      <p>
        OpenSearch runs on the Java Virtual Machine. The JVM manages memory in a region called the <strong>heap</strong> — this is where all Java objects live: query results being assembled, field data cached for aggregations, segment metadata, filter caches, and so on.
      </p>
      <p>
        The heap is distinct from OS memory. A node might have 64 GB of RAM, but OpenSearch is only allowed to use a fraction of that for its heap (the rest goes to the OS page cache for Lucene segment files, which OpenSearch relies on heavily). Heap is explicitly sized via the <code>-Xms</code> and <code>-Xmx</code> JVM flags, or via the <code>OPENSEARCH_JAVA_OPTS</code> environment variable.
      </p>
      <p>
        The critical point: the heap size is fixed at startup. It doesn&apos;t grow dynamically. When you&apos;re at 90% heap usage, there&apos;s no slack — the JVM is working hard to free memory through garbage collection, and if it can&apos;t free enough, requests start failing.
      </p>

      <h2>The Thresholds That Matter</h2>
      <p>
        Heap usage isn&apos;t binary. It has a progression of consequences:
      </p>

      <h3>Below 75% — Healthy</h3>
      <p>
        The garbage collector runs in the background and keeps up easily. Latency is stable. This is where you want to be.
      </p>

      <h3>75–85% — Watch It</h3>
      <p>
        GC is working harder. You may see occasional pauses of 100–500ms as the collector clears objects. In most clusters, this is manageable but is a signal to investigate what&apos;s consuming heap and address it before it gets worse.
      </p>

      <h3>85–90% — Act Now</h3>
      <p>
        GC pause durations increase significantly. Stop-the-world pauses — where the JVM freezes all application threads to collect garbage — become frequent. To users, this looks like intermittent slow queries. Indexing throughput drops. Thread pools back up.
      </p>

      <h3>Above 90% — Circuit Breakers Activate</h3>
      <p>
        OpenSearch has circuit breakers that protect the cluster from OOM by refusing certain requests when heap is critically high. The parent circuit breaker trips at 95% by default and rejects any requests that would allocate additional heap. You&apos;ll see responses with status 429 and a message like <code>Data too large, data for field exceeds limit</code>.
      </p>

      <h3>Above 95% — OOM Risk</h3>
      <p>
        The JVM may throw an <code>OutOfMemoryError</code>, which typically crashes the OpenSearch process. The node goes down, its shards become unassigned, and if you had no replicas, you now have a red cluster.
      </p>

      <h2>How to Check Heap Usage</h2>
      <pre><code>{`# Heap usage per node — quickest overview
GET /_cat/nodes?v&h=name,heap.current,heap.max,heap.percent

# Detailed stats per node
GET /_nodes/stats/jvm

# Look at: nodes.*.jvm.mem.heap_used_percent
# And:     nodes.*.jvm.gc.collectors.old.collection_time_in_millis`}</code></pre>
      <p>
        The <code>old</code> GC collector time is especially important. If it&apos;s growing rapidly, you&apos;re seeing major GC events — the expensive stop-the-world kind. Track this as a rate over time, not just an absolute value.
      </p>

      <h2>The 32 GB Ceiling (and Why It Exists)</h2>
      <p>
        If you search for OpenSearch heap guidance, you&apos;ll see a consistent recommendation: never set heap above 32 GB. This seems counterintuitive — more heap should mean more breathing room, right?
      </p>
      <p>
        The reason is <strong>compressed ordinary object pointers</strong> (compressed OOPs). On 64-bit JVMs, every object reference is normally an 8-byte pointer. With compressed OOPs, the JVM compresses these to 4-byte pointers, which roughly halves the memory overhead of object references throughout the heap. This is a significant optimization — it means a 30 GB heap with compressed OOPs is effectively more efficient than a 34 GB heap without them.
      </p>
      <p>
        Compressed OOPs are enabled automatically when heap is below approximately 32 GB (the exact threshold depends on the JVM version and OS page size, but 30.5 GB is the safe upper bound). Above that threshold, the JVM switches to uncompressed pointers, and heap efficiency drops dramatically — you often end up with worse performance at 34 GB than you had at 30 GB.
      </p>
      <p>
        <strong>Practical rule:</strong> Set heap to the lesser of: half of available RAM, or 30.5 GB. If you need more capacity, add nodes — don&apos;t increase heap beyond 32 GB.
      </p>
      <pre><code>{`# In jvm.options or OPENSEARCH_JAVA_OPTS
# For a node with 64GB RAM:
-Xms30g
-Xmx30g

# Always set Xms = Xmx to avoid heap resizing at runtime
# Never exceed ~30.5g`}</code></pre>

      <h2>What Actually Consumes Heap</h2>
      <p>
        When heap is high, the question is: what&apos;s in there? The main consumers in a typical OpenSearch cluster:
      </p>

      <h3>Field data cache</h3>
      <p>
        When you sort or aggregate on a <code>text</code> field (rather than a <code>keyword</code> field), OpenSearch loads the full field values into heap as an uninverted index — called fielddata. This can be enormous. A text field with 50 million documents can consume several gigabytes.
      </p>
      <p>
        The fix: use <code>keyword</code> fields for sorting and aggregation, not <code>text</code> fields. If you need both search and aggregation, use a multi-field mapping with a <code>keyword</code> subfield.
      </p>

      <h3>Shard request cache and query cache</h3>
      <p>
        OpenSearch caches the results of frequently run queries. These caches are bounded, but they&apos;re held in heap. Check their sizes:
      </p>
      <pre><code>{`GET /_nodes/stats/indices/query_cache,request_cache
# Look at: nodes.*.indices.query_cache.memory_size_in_bytes
# And:     nodes.*.indices.request_cache.memory_size_in_bytes`}</code></pre>

      <h3>Segment metadata</h3>
      <p>
        Every Lucene segment on a node has metadata held in heap: term dictionaries, stored field indexes, doc value metadata. This is roughly proportional to the number of segments — which is why having too many small segments (or too many indices) can cause heap pressure even when the actual data volume is modest.
      </p>

      <h3>Aggregation buffers</h3>
      <p>
        Deep or high-cardinality aggregations (like a <code>terms</code> aggregation on a field with millions of unique values) can allocate large buffers temporarily during query execution. These don&apos;t show up in the cache stats but do spike heap usage.
      </p>

      <h2>What to Do When Heap Is High</h2>
      <p>
        There&apos;s no single fix — it depends on which consumer is responsible. Work through these in order:
      </p>

      <h3>1. Check for fielddata abuse</h3>
      <pre><code>{`GET /_nodes/stats/indices/fielddata
# nodes.*.indices.fielddata.memory_size_in_bytes

# See which indices are responsible
GET /_cat/fielddata?v&s=size:desc`}</code></pre>
      <p>
        If fielddata is large, identify which fields are driving it and switch them to <code>keyword</code> type, or set <code>fielddata: false</code> on the text field and migrate aggregations to the keyword subfield.
      </p>

      <h3>2. Force-merge old indices</h3>
      <p>
        Historical indices that are no longer being written to accumulate segments over time. Merging them into fewer, larger segments reduces the per-segment metadata overhead in heap.
      </p>
      <pre><code>{`# Force-merge read-only historical indices to 1 segment
# Run on quiet periods — this is CPU and I/O intensive
POST /my-old-index/_forcemerge?max_num_segments=1`}</code></pre>

      <h3>3. Reduce shard count</h3>
      <p>
        Too many shards means too many Lucene instances, which means more per-segment heap overhead. If you have thousands of shards under 1 GB each, you&apos;re paying a disproportionate heap cost. Consolidate small indices or increase the rollover size threshold in your ISM policies.
      </p>

      <h3>4. Increase heap (carefully)</h3>
      <p>
        If you&apos;re well below 30 GB, increasing heap allocation is a valid lever. Increase <code>-Xms</code> and <code>-Xmx</code> together, restart the node (rolling restart so the cluster stays up), and monitor the result.
      </p>

      <h3>5. Add data nodes</h3>
      <p>
        If you&apos;re already near 30 GB heap per node, the only option is horizontal scaling. More nodes = fewer shards per node = less heap pressure per node. This is the correct long-term solution for data volume growth.
      </p>

      <h2>Alerting on Heap</h2>
      <p>
        Don&apos;t wait until heap is critical. Alert early:
      </p>
      <pre><code>{`# Prometheus alerting rule
- alert: OpenSearchHeapHigh
  expr: opensearch_jvm_mem_heap_used_percent > 80
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "OpenSearch heap usage above 80% on {{ $labels.node }}"

- alert: OpenSearchHeapCritical
  expr: opensearch_jvm_mem_heap_used_percent > 90
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "OpenSearch heap critical ({{ $value }}%) on {{ $labels.node }}"

# Also alert on GC duration — a better signal than raw heap %
- alert: OpenSearchGCPressure
  expr: rate(opensearch_jvm_gc_collection_time_seconds_total{gc="old"}[5m]) > 0.3
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "OpenSearch old GC consuming >30% of time on {{ $labels.node }}"`}</code></pre>

      <h2>The GC Log: Your Debugging Companion</h2>
      <p>
        When heap is high, OpenSearch&apos;s GC logs are invaluable. By default, OpenSearch enables GC logging to <code>logs/gc.log</code>. Look for lines containing <code>Pause Full</code> (stop-the-world events) — their frequency and duration tell you how stressed the GC is.
      </p>
      <pre><code>{`# Tail the GC log on the affected node
tail -f /var/log/opensearch/gc.log | grep "Pause Full"

# A healthy cluster: rare or no Pause Full events
# A stressed cluster: Pause Full every few seconds, each lasting 1-10+ seconds`}</code></pre>
      <p>
        Frequent stop-the-world pauses of more than a second mean the GC is failing to keep up. This will manifest as query timeouts and indexing backpressure before it progresses to OOM.
      </p>

    </ArticleLayout>
  );
}
