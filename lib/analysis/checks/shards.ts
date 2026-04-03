import type { ShardsData, FindingInput } from "../types";

// Unassigned reasons that are expected on a single-node cluster
// (replicas simply can't be placed when there's only one node)
const REPLICA_REASONS = new Set(["INDEX_CREATED", "REPLICA_ADDED", "REINITIALIZED", "EXISTING_INDEX_RESTORED"]);

function isReplicaOnlyUnassigned(reasons: Record<string, number>): boolean {
  return Object.keys(reasons).every((r) => REPLICA_REASONS.has(r));
}

export function analyzeShards(data: ShardsData, singleNode = false): FindingInput[] {
  const findings: FindingInput[] = [];

  if (data.unassignedCount > 0) {
    const reasons = Object.entries(data.unassignedReasons)
      .map(([r, c]) => `${r}: ${c}`)
      .join(", ");

    // On a single-node cluster with yellow status, unassigned shards are replicas — expected
    if (singleNode && isReplicaOnlyUnassigned(data.unassignedReasons)) {
      findings.push({
        category: "SHARDS",
        severity: "INFO",
        title: `${data.unassignedCount} replica shard${data.unassignedCount > 1 ? "s" : ""} unassigned (expected on single-node)`,
        detail: `${data.unassignedCount} replica shards cannot be assigned because there is only one node. This is expected behaviour — replicas require a second node to be placed. Reasons: ${reasons || "none"}.`,
        recommendation: "Set number_of_replicas: 0 on your indices to clear unassigned replicas and return the cluster to green: PUT /<index>/_settings {\"index.number_of_replicas\": 0}.",
        docUrl: "https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-allocation/",
        metadata: { unassignedCount: data.unassignedCount, reasons: data.unassignedReasons },
      });
    } else {
      findings.push({
        category: "SHARDS",
        severity: "CRITICAL",
        title: `${data.unassignedCount} unassigned shard${data.unassignedCount > 1 ? "s" : ""}`,
        detail: `${data.unassignedCount} shards are not assigned to any node. Reasons: ${reasons || "unknown"}. Data may be unavailable.`,
        recommendation: "Run GET /_cluster/allocation/explain to diagnose the root cause. Common causes: insufficient disk space, node failure, or shard limit reached.",
        docUrl: "https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-allocation/",
        metadata: { unassignedCount: data.unassignedCount, reasons: data.unassignedReasons },
      });
    }
  }

  // Per-node shard count
  for (const [nodeId, count] of Object.entries(data.shardCountPerNode)) {
    if (count > 1000) {
      findings.push({
        category: "SHARDS",
        severity: "WARNING",
        title: `Node ${nodeId} has ${count} shards (too many)`,
        detail: `Node ${nodeId} hosts ${count} shards. High shard counts increase JVM heap pressure and can degrade performance.`,
        recommendation: "Reduce shard count by merging small indices, applying ISM rollover policies, or using fewer primary shards on new indices.",
        docUrl: "https://opensearch.org/docs/latest/tuning-your-cluster/",
        metadata: { nodeId, shardCount: count },
      });
    }
  }

  // Cluster-wide shard density (3f)
  if (data.totalShardCount !== undefined) {
    const nodeCount = Object.keys(data.shardCountPerNode).length;
    if (nodeCount > 0) {
      const density = data.totalShardCount / nodeCount;
      if (density > 1500) {
        findings.push({
          category: "SHARDS",
          severity: "CRITICAL",
          title: `Critical shard density: ${data.totalShardCount} shards across ${nodeCount} node${nodeCount > 1 ? "s" : ""}`,
          detail: `Average of ${Math.round(density)} shards per node (recommended max: 1000). Excessive shard counts cause high JVM heap overhead, slower recovery, and degraded cluster stability.`,
          recommendation: "Reduce shard count: delete old indices, use ISM rollover to limit shard creation, or use the Shrink API to merge over-sharded indices.",
          docUrl: "https://opensearch.org/docs/latest/tuning-your-cluster/",
          metadata: { totalShards: data.totalShardCount, nodeCount, density: Math.round(density) },
        });
      } else if (density > 1000) {
        findings.push({
          category: "SHARDS",
          severity: "WARNING",
          title: `High shard density: ${data.totalShardCount} shards across ${nodeCount} node${nodeCount > 1 ? "s" : ""}`,
          detail: `Average of ${Math.round(density)} shards per node exceeds the recommended limit of 1000. This increases heap pressure and slows down operations.`,
          recommendation: "Reduce primary shard count on new indices. Apply ISM rollover policies to prevent unbounded shard growth.",
          docUrl: "https://opensearch.org/docs/latest/tuning-your-cluster/",
          metadata: { totalShards: data.totalShardCount, nodeCount, density: Math.round(density) },
        });
      }
    }
  }

  // Average shard size
  const avgSizeMB = data.avgShardSizeBytes / (1024 * 1024);
  if (avgSizeMB < 1000 && avgSizeMB > 0) {
    findings.push({
      category: "SHARDS",
      severity: "WARNING",
      title: `Average shard size is ${avgSizeMB.toFixed(0)}MB (too small)`,
      detail: `Average shard size of ${avgSizeMB.toFixed(0)}MB suggests over-sharding. Aim for 10–50GB per shard for optimal performance.`,
      recommendation: "Reduce primary shard count on new indices. Use the Shrink API to merge existing over-sharded indices.",
      docUrl: "https://opensearch.org/docs/latest/api-reference/index-apis/shrink-index/",
      metadata: { avgShardSizeMB: avgSizeMB },
    });
  } else if (avgSizeMB > 50000) {
    findings.push({
      category: "SHARDS",
      severity: "WARNING",
      title: `Average shard size is ${(avgSizeMB / 1024).toFixed(0)}GB (too large)`,
      detail: `Average shard size of ${(avgSizeMB / 1024).toFixed(0)}GB is above the recommended 50GB. Large shards slow down recovery and rebalancing.`,
      recommendation: "Increase primary shard count on new indices or configure ISM rollover by size.",
      metadata: { avgShardSizeMB: avgSizeMB },
    });
  }

  return findings;
}
