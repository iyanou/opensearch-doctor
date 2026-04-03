import type { FindingInput, PerformanceData } from "../types";

export function analyzePerformance(data: PerformanceData): FindingInput[] {
  const findings: FindingInput[] = [];

  // Thread pool rejections (indexing)
  if (data.bulkRejections > 0) {
    findings.push({
      category: "PERFORMANCE",
      severity: data.bulkRejections > 100 ? "CRITICAL" : "WARNING",
      title: `Write thread pool: ${data.bulkRejections} total rejection${data.bulkRejections > 1 ? "s" : ""} since node start`,
      detail:
        `Bulk indexing requests have been rejected ${data.bulkRejections} time${data.bulkRejections > 1 ? "s" : ""} since node start because the write thread pool queue was full. This is a cumulative counter — cross-reference across sessions to identify when rejections spiked. Indicates the cluster cannot keep up with ingest throughput at peak times.`,
      recommendation:
        "Reduce bulk request frequency or size. Increase thread_pool.write.queue_size if hardware permits. Review cluster capacity and add nodes if rejections persist.",
      docUrl: "https://opensearch.org/docs/latest/tuning-your-cluster/",
      metadata: { bulkRejections: data.bulkRejections },
    });
  }

  // Thread pool rejections (search)
  if (data.queryRejections > 0) {
    findings.push({
      category: "PERFORMANCE",
      severity: data.queryRejections > 50 ? "CRITICAL" : "WARNING",
      title: `Search thread pool: ${data.queryRejections} total rejection${data.queryRejections > 1 ? "s" : ""} since node start`,
      detail:
        `Search requests have been rejected ${data.queryRejections} time${data.queryRejections > 1 ? "s" : ""} since node start because the search thread pool queue was full. This is a cumulative counter since node start — check trends across sessions to identify when load peaked.`,
      recommendation:
        "Reduce search concurrency or add more nodes. Review slow queries and optimize. Consider query caching.",
      metadata: { queryRejections: data.queryRejections },
    });
  }

  // High search latency
  if (data.searchLatencyMs > 1000) {
    findings.push({
      category: "PERFORMANCE",
      severity: data.searchLatencyMs > 5000 ? "CRITICAL" : "WARNING",
      title: `High search latency: ${data.searchLatencyMs.toFixed(0)}ms average`,
      detail:
        "Average search latency is above acceptable thresholds. Users may experience slow query responses.",
      recommendation:
        "Review slow search logs (index.search.slowlog). Optimize queries — avoid wildcard prefixes, large aggregations on high-cardinality fields. Consider force-merging read-only indices.",
      docUrl: "https://opensearch.org/docs/latest/monitoring-your-cluster/",
      metadata: { searchLatencyMs: data.searchLatencyMs },
    });
  }

  // Field data evictions (heap pressure from field data cache)
  if (data.fieldDataEvictions > 0) {
    findings.push({
      category: "PERFORMANCE",
      severity: "WARNING",
      title: `Field data evictions occurring: ${data.fieldDataEvictions}`,
      detail:
        "Field data cache is being evicted, which happens when the cache exceeds its limit. This adds latency to aggregations and sorting.",
      recommendation:
        "Increase indices.fielddata.cache.size or avoid high-cardinality field data usage. Use keyword fields with doc_values for aggregations instead of analyzed text fields.",
      metadata: { fieldDataEvictions: data.fieldDataEvictions },
    });
  }

  // Low query cache hit rate
  if (data.queryCacheHitRate < 0.5 && data.searchRatePerSec > 10) {
    findings.push({
      category: "PERFORMANCE",
      severity: "INFO",
      title: `Low query cache hit rate: ${(data.queryCacheHitRate * 100).toFixed(1)}%`,
      detail:
        "The query cache is not being effective. Most queries are not benefiting from caching.",
      recommendation:
        "This is normal for highly varied queries. If queries are repeated, ensure index.queries.cache.enabled is true. Review whether filters can be more static.",
      metadata: { queryCacheHitRate: data.queryCacheHitRate },
    });
  }

  // Excessive segments
  if (data.segmentCountTotal > 10000) {
    findings.push({
      category: "PERFORMANCE",
      severity: "WARNING",
      title: `High segment count: ${data.segmentCountTotal} total segments`,
      detail:
        "Too many segments increases merge overhead, heap usage, and search latency. Each segment consumes file handles and memory.",
      recommendation:
        "Run force merge on read-only indices: POST /<index>/_forcemerge?max_num_segments=1. For write-active indices, tune merge policy settings.",
      docUrl: "https://opensearch.org/docs/latest/api-reference/index-apis/force-merge/",
      metadata: { segmentCount: data.segmentCountTotal },
    });
  }

  if (findings.length === 0) {
    findings.push({
      category: "PERFORMANCE",
      severity: "OK",
      title: "Performance metrics look healthy",
      detail: "No thread pool rejections, acceptable search latency, and no field data evictions.",
      recommendation: "No action required.",
    });
  }

  return findings;
}
