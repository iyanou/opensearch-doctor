import type { FindingInput, IndicesData } from "../types";

export function analyzeIndices(data: IndicesData, singleNode = false): FindingInput[] {
  const findings: FindingInput[] = [];
  const { indices } = data;

  // Red indices
  const redIndices = indices.filter((i) => i.health === "red");
  if (redIndices.length > 0) {
    findings.push({
      category: "INDICES",
      severity: "CRITICAL",
      title: `${redIndices.length} index${redIndices.length > 1 ? "es" : ""} in RED health`,
      detail: `The following indices are RED (primary shards unavailable): ${redIndices.map((i) => i.name).join(", ")}.`,
      recommendation:
        "Investigate unassigned primary shards for these indices. Check cluster allocation explain API and review disk space, node availability, and allocation settings.",
      docUrl: "https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-allocation/",
      metadata: { indices: redIndices.map((i) => i.name) },
    });
  }

  // Yellow indices — suppress on single-node (replicas can't be assigned, it's expected)
  const yellowIndices = indices.filter((i) => i.health === "yellow");
  if (yellowIndices.length > 5 && !singleNode) {
    findings.push({
      category: "INDICES",
      severity: "WARNING",
      title: `${yellowIndices.length} indices in YELLOW health`,
      detail: "A large number of indices have unassigned replica shards.",
      recommendation:
        "Check if replica assignment is intentionally disabled (e.g. single-node cluster) or if there are allocation issues. Use GET /_cluster/allocation/explain for details.",
      metadata: { count: yellowIndices.length },
    });
  }

  // Read-only indices
  const readOnlyIndices = indices.filter((i) => i.isReadOnly);
  if (readOnlyIndices.length > 0) {
    findings.push({
      category: "INDICES",
      severity: "CRITICAL",
      title: `${readOnlyIndices.length} index${readOnlyIndices.length > 1 ? "es are" : " is"} read-only`,
      detail: `Read-only indices block all write operations: ${readOnlyIndices.map((i) => i.name).join(", ")}.`,
      recommendation:
        "Indices are typically set read-only due to disk watermark breaches. Free up disk space, then clear the block: PUT /<index>/_settings {\"index.blocks.read_only_allow_delete\": null}.",
      docUrl: "https://opensearch.org/docs/latest/api-reference/index-apis/put-settings/",
      metadata: { indices: readOnlyIndices.map((i) => i.name) },
    });
  }

  // Closed indices
  const closedIndices = indices.filter((i) => i.status === "close");
  if (closedIndices.length > 0) {
    findings.push({
      category: "INDICES",
      severity: "INFO",
      title: `${closedIndices.length} closed index${closedIndices.length > 1 ? "es" : ""}`,
      detail: `Closed indices: ${closedIndices.map((i) => i.name).join(", ")}. These cannot be searched.`,
      recommendation:
        "Review if closed indices are intentionally archived. If no longer needed, consider deleting them to free resources.",
      metadata: { indices: closedIndices.map((i) => i.name) },
    });
  }

  // High field count (mapping explosion risk)
  const highFieldIndices = indices.filter((i) => i.mappingFieldCount > 1000);
  if (highFieldIndices.length > 0) {
    findings.push({
      category: "INDICES",
      severity: "WARNING",
      title: `${highFieldIndices.length} index${highFieldIndices.length > 1 ? "es have" : " has"} >1000 mapping fields`,
      detail: `Indices with very high field counts (mapping explosion): ${highFieldIndices.map((i) => `${i.name} (${i.mappingFieldCount})`).join(", ")}.`,
      recommendation:
        "Mapping explosions degrade performance and increase heap usage. Review dynamic mapping settings. Consider setting index.mapping.total_fields.limit or using explicit mappings.",
      docUrl: "https://opensearch.org/docs/latest/field-types/",
      metadata: { indices: highFieldIndices.map((i) => ({ name: i.name, fieldCount: i.mappingFieldCount })) },
    });
  }

  // No replicas on indices with data
  const noReplicaIndices = indices.filter(
    (i) => i.replicas === 0 && i.docsCount > 0 && !i.name.startsWith(".")
  );
  if (noReplicaIndices.length > 0 && noReplicaIndices.length > indices.length * 0.5) {
    if (singleNode) {
      // On single-node, no replicas is actually correct — downgrade to INFO
      findings.push({
        category: "INDICES",
        severity: "INFO",
        title: "Data indices have no replicas (fine for single-node)",
        detail: `${noReplicaIndices.length} indices with data have 0 replicas. On a single-node cluster, replicas cannot be assigned anyway, so this has no impact.`,
        recommendation:
          "When you add more nodes, set replicas to 1 or more for redundancy: PUT /<index>/_settings {\"index.number_of_replicas\": 1}.",
        metadata: { count: noReplicaIndices.length },
      });
    } else {
      findings.push({
        category: "INDICES",
        severity: "WARNING",
        title: "Most data indices have no replicas",
        detail: `${noReplicaIndices.length} indices with data have 0 replicas, offering no redundancy.`,
        recommendation:
          "For production clusters, set at least 1 replica per index: PUT /<index>/_settings {\"index.number_of_replicas\": 1}.",
        metadata: { count: noReplicaIndices.length },
      });
    }
  }

  if (findings.length === 0 && indices.filter((i) => i.health === "green").length === indices.length) {
    findings.push({
      category: "INDICES",
      severity: "OK",
      title: "All indices are healthy",
      detail: `All ${indices.length} indices are green and open.`,
      recommendation: "No action required.",
    });
  }

  return findings;
}
