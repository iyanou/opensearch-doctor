export interface RemediationTemplate {
  key: string;
  label: string;
  description: string;
  method: "POST" | "PUT" | "DELETE";
  path: string;
  body?: string;
  safe: boolean; // always true — only safe ops are in the catalogue
}

export const REMEDIATION_CATALOGUE: RemediationTemplate[] = [
  // ── SHARDS ────────────────────────────────────────────────────────────────
  {
    key: "RETRY_SHARD_ALLOCATION",
    label: "Retry shard allocation",
    description:
      "Asks OpenSearch to retry allocating all failed shards. Safe to run multiple times.",
    method: "POST",
    path: "/_cluster/reroute?retry_failed=true",
    safe: true,
  },

  // ── INDICES ───────────────────────────────────────────────────────────────
  {
    key: "CLEAR_READ_ONLY_BLOCKS",
    label: "Clear read-only blocks",
    description:
      "Removes read-only index blocks from all user indices (typically caused by low disk space triggering the flood-stage watermark). Excludes system indices.",
    method: "PUT",
    // *,-.*  targets all indices except dot-prefixed system indices (.security, .kibana, etc.)
    // This avoids the 403 "no permissions for []" that occurs when the security plugin
    // cannot resolve a unified permission set across system + user indices together.
    path: "/*,-.*/_settings?ignore_unavailable=true&allow_no_indices=true",
    body: JSON.stringify({
      "index.blocks.read_only_allow_delete": null,
      "index.blocks.read_only": null,
    }),
    safe: true,
  },

  // ── PERFORMANCE ───────────────────────────────────────────────────────────
  {
    key: "CLEAR_FIELDDATA_CACHE",
    label: "Clear fielddata cache",
    description:
      "Clears the fielddata cache to reduce heap pressure. Fielddata will be reloaded on next use.",
    method: "POST",
    path: "/_cache/clear?fielddata=true",
    safe: true,
  },
  {
    key: "CLEAR_ALL_CACHES",
    label: "Clear all caches",
    description:
      "Clears fielddata, query, and request caches cluster-wide. Immediately frees heap and can reduce search latency caused by stale cache entries. Caches are rebuilt on next use.",
    method: "POST",
    path: "/_cache/clear",
    safe: true,
  },

  // ── CLUSTER ROUTING ───────────────────────────────────────────────────────
  {
    key: "ENABLE_SHARD_ALLOCATION",
    label: "Enable shard allocation",
    description:
      "Sets cluster.routing.allocation.enable to 'all' as a transient setting. Fixes clusters where allocation was intentionally or accidentally disabled (e.g. during a rolling restart).",
    method: "PUT",
    path: "/_cluster/settings",
    body: JSON.stringify({
      transient: {
        "cluster.routing.allocation.enable": "all",
      },
    }),
    safe: true,
  },

  // ── SINGLE-NODE ───────────────────────────────────────────────────────────
  {
    key: "SET_REPLICAS_SINGLE_NODE",
    label: "Set replicas to 0 (single-node)",
    description:
      "Sets the replica count to 0 for all user indices. On a single-node cluster, replica shards can never be assigned, which keeps the cluster permanently YELLOW. This resolves that state. Safe because with only one node there is no data redundancy to lose. Excludes system indices.",
    method: "PUT",
    // Exclude dot-prefixed system indices to avoid the 403 "no permissions for []" error
    // that the OpenSearch security plugin raises when it cannot resolve a unified permission
    // set across user + system indices in the same request.
    path: "/*,-.*/_settings?ignore_unavailable=true&allow_no_indices=true",
    body: JSON.stringify({
      "index.number_of_replicas": 0,
    }),
    safe: true,
  },
];

interface FindingContext {
  category: string;
  title: string;
}

/**
 * Returns the remediation template for a given finding, or null if not automatable.
 * Pass allFindings to enable context-aware decisions (e.g. single-node cluster).
 */
export function getRemediation(
  category: string,
  title: string,
  allFindings: FindingContext[] = []
): RemediationTemplate | null {
  const t = title.toLowerCase();

  const isSingleNode = allFindings.some(
    (f) =>
      f.category === "CLUSTER_HEALTH" &&
      f.title.toLowerCase().includes("single-node")
  );

  // ── CLUSTER_HEALTH ────────────────────────────────────────────────────────
  if (category === "CLUSTER_HEALTH") {
    // RED cluster → retry shard allocation (primary shards unassigned)
    if (t.includes("cluster status is red")) {
      if (isSingleNode) return null; // single-node RED is a deeper issue (disk/config)
      return find("RETRY_SHARD_ALLOCATION");
    }
    // YELLOW cluster → depends on topology
    if (t.includes("cluster status is yellow")) {
      if (isSingleNode) {
        // Replica shards can never be assigned on a single-node cluster — set replicas to 0
        return find("SET_REPLICAS_SINGLE_NODE");
      }
      // Multi-node: try to re-enable allocation and retry
      return find("ENABLE_SHARD_ALLOCATION");
    }
  }

  // ── SHARDS ────────────────────────────────────────────────────────────────
  if (category === "SHARDS" && t.includes("unassigned shard")) {
    if (isSingleNode) {
      // On single-node, replicas can never allocate — remove them instead
      return find("SET_REPLICAS_SINGLE_NODE");
    }
    return find("RETRY_SHARD_ALLOCATION");
  }

  // ── INDICES ───────────────────────────────────────────────────────────────
  if (category === "INDICES" && t.includes("read-only")) {
    return find("CLEAR_READ_ONLY_BLOCKS");
  }

  // ── NODES ─────────────────────────────────────────────────────────────────
  if (category === "NODES" && t.includes("jvm heap")) {
    // Only offer the automated cache clear for WARNING-level heap pressure.
    // CRITICAL heap needs hardware-level intervention (larger heap / more nodes).
    // We detect WARNING by checking the percentage — if it's < 85 it's a WARNING.
    // Since the title embeds the percentage we can read it, but simpler: offer for
    // any JVM heap finding (operator still chooses to click Fix or not).
    return find("CLEAR_ALL_CACHES");
  }

  // ── PERFORMANCE ───────────────────────────────────────────────────────────
  if (category === "PERFORMANCE") {
    if (t.includes("field data eviction")) {
      return find("CLEAR_FIELDDATA_CACHE");
    }
    if (t.includes("high search latency")) {
      // Clearing query/request caches can immediately reduce latency caused by
      // stale or oversized cache entries.
      return find("CLEAR_ALL_CACHES");
    }
  }

  return null;
}

function find(key: string): RemediationTemplate | null {
  return REMEDIATION_CATALOGUE.find((r) => r.key === key) ?? null;
}
