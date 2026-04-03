import type { CircuitBreakersData, FindingInput } from "../types";

export function analyzeCircuitBreakers(data: CircuitBreakersData): FindingInput[] {
  const findings: FindingInput[] = [];

  if (data.fielddataTripped > 0) {
    findings.push({
      category: "NODES",
      severity: "WARNING",
      title: `Fielddata circuit breaker tripped ${data.fielddataTripped} time${data.fielddataTripped > 1 ? "s" : ""} (since node start)`,
      detail: `The fielddata circuit breaker has been tripped ${data.fielddataTripped} times. This means requests were rejected to prevent JVM out-of-memory errors caused by fielddata loading.`,
      recommendation: "Reduce fielddata usage: avoid sorting or aggregating on high-cardinality text fields. Use keyword fields for aggregations, or increase indices.fielddata.cache.size (with caution). Consider doc_values instead of fielddata.",
      docUrl: "https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/circuit-breaker/",
      metadata: { fielddataTripped: data.fielddataTripped },
    });
  }

  if (data.requestTripped > 0) {
    findings.push({
      category: "NODES",
      severity: "WARNING",
      title: `Request circuit breaker tripped ${data.requestTripped} time${data.requestTripped > 1 ? "s" : ""} (since node start)`,
      detail: `The request circuit breaker has been tripped ${data.requestTripped} times. This rejects memory-heavy requests (such as large aggregations) before they can cause heap exhaustion.`,
      recommendation: "Optimize memory-heavy aggregations: reduce bucket counts, use sampler aggregations, or add more nodes to distribute the load. Review queries using large terms or date_histogram aggregations.",
      docUrl: "https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/circuit-breaker/",
      metadata: { requestTripped: data.requestTripped },
    });
  }

  if (data.parentTripped > 0) {
    findings.push({
      category: "NODES",
      severity: "WARNING",
      title: `Parent circuit breaker tripped ${data.parentTripped} time${data.parentTripped > 1 ? "s" : ""} (since node start)`,
      detail: `The parent circuit breaker has been tripped ${data.parentTripped} times. The parent breaker is the last line of defence — it fires when overall heap usage exceeds its limit, indicating serious memory pressure across all consumers.`,
      recommendation: "Investigate all heap consumers: fielddata, request memory, and indexing buffers. Increase JVM heap size (max 50% of RAM, hard limit 31GB), scale out with more nodes, or reduce concurrent query load.",
      docUrl: "https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/circuit-breaker/",
      metadata: { parentTripped: data.parentTripped },
    });
  }

  return findings;
}
