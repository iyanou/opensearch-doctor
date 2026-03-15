import type { ShardsData, FindingInput } from "../types";

export function analyzeShards(data: ShardsData): FindingInput[] {
  const findings: FindingInput[] = [];

  if (data.unassignedCount > 0) {
    const reasons = Object.entries(data.unassignedReasons)
      .map(([r, c]) => `${r}: ${c}`)
      .join(", ");

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

  // Shard count per node
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
