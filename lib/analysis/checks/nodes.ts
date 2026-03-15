import type { NodesData, FindingInput } from "../types";

export function analyzeNodes(data: NodesData): { findings: FindingInput[] } {
  const findings: FindingInput[] = [];

  for (const node of data.nodes) {
    // JVM Heap
    if (node.heapUsedPercent >= 85) {
      findings.push({
        category: "NODES",
        severity: "CRITICAL",
        title: `Node "${node.name}" JVM heap at ${node.heapUsedPercent}%`,
        detail: `Node ${node.name} is using ${node.heapUsedPercent}% of its JVM heap. Above 85% risks OutOfMemoryError and node failure.`,
        recommendation: `Reduce heap pressure: increase JVM heap size (max 50% of RAM, max 31GB), reduce fielddata usage, or add more nodes. Avoid mapping explosions.`,
        docUrl: "https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/",
        metadata: { nodeId: node.id, nodeName: node.name, heapPercent: node.heapUsedPercent },
      });
    } else if (node.heapUsedPercent >= 75) {
      findings.push({
        category: "NODES",
        severity: "WARNING",
        title: `Node "${node.name}" JVM heap at ${node.heapUsedPercent}%`,
        detail: `Node ${node.name} is using ${node.heapUsedPercent}% of JVM heap. Approaching dangerous levels.`,
        recommendation: "Monitor closely. Consider increasing heap or reducing index load on this node.",
        metadata: { nodeId: node.id, nodeName: node.name, heapPercent: node.heapUsedPercent },
      });
    }

    // Disk usage
    if (node.diskUsedPercent >= 85) {
      findings.push({
        category: "NODES",
        severity: "CRITICAL",
        title: `Node "${node.name}" disk at ${node.diskUsedPercent}%`,
        detail: `Node ${node.name} disk usage is at ${node.diskUsedPercent}%. OpenSearch will set indices to read-only at the flood_stage watermark (default 95%).`,
        recommendation: "Delete old indices, add disk space, or add a new data node immediately. Check ILM/ISM delete policies.",
        docUrl: "https://opensearch.org/docs/latest/install-and-configure/configuring-opensearch/cluster-settings/",
        metadata: { nodeId: node.id, nodeName: node.name, diskPercent: node.diskUsedPercent },
      });
    } else if (node.diskUsedPercent >= 75) {
      findings.push({
        category: "NODES",
        severity: "WARNING",
        title: `Node "${node.name}" disk at ${node.diskUsedPercent}%`,
        detail: `Node ${node.name} disk usage is at ${node.diskUsedPercent}%. Plan capacity expansion.`,
        recommendation: "Review index retention policies and consider adding storage or nodes.",
        metadata: { nodeId: node.id, nodeName: node.name, diskPercent: node.diskUsedPercent },
      });
    }

    // CPU
    if (node.cpuPercent >= 90) {
      findings.push({
        category: "NODES",
        severity: "WARNING",
        title: `Node "${node.name}" CPU at ${node.cpuPercent}%`,
        detail: `Node ${node.name} CPU is at ${node.cpuPercent}%, which may degrade search and indexing performance.`,
        recommendation: "Check for heavy queries with GET /_tasks. Consider reducing bulk indexing rate or adding nodes.",
        metadata: { nodeId: node.id, nodeName: node.name, cpuPercent: node.cpuPercent },
      });
    }

    // Recent restart
    if (node.uptimeMs < 60 * 60 * 1000) {
      const uptimeMins = Math.floor(node.uptimeMs / 60000);
      findings.push({
        category: "NODES",
        severity: "INFO",
        title: `Node "${node.name}" recently restarted (${uptimeMins}m ago)`,
        detail: `Node ${node.name} has been up for only ${uptimeMins} minutes. This may indicate a crash or deliberate restart.`,
        recommendation: "Check node logs to confirm the restart was intentional.",
        metadata: { nodeId: node.id, nodeName: node.name, uptimeMs: node.uptimeMs },
      });
    }
  }

  // Check for single master node
  const masterNodes = data.nodes.filter((n) => n.roles.includes("master") || n.roles.includes("cluster_manager"));
  if (masterNodes.length === 1) {
    findings.push({
      category: "NODES",
      severity: "WARNING",
      title: "Single master-eligible node (no quorum HA)",
      detail: "Only one master-eligible node detected. If it fails, the cluster will become unavailable.",
      recommendation: "Add at least 2 more master-eligible nodes (recommended: 3 total for quorum).",
      docUrl: "https://opensearch.org/docs/latest/tuning-your-cluster/",
    });
  }

  return { findings };
}
