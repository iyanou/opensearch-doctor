import type { ClusterHealthData } from "../types";
import type { FindingInput } from "../types";

export function analyzeClusterHealth(data: ClusterHealthData): FindingInput[] {
  const findings: FindingInput[] = [];

  if (data.status === "red") {
    findings.push({
      category: "CLUSTER_HEALTH",
      severity: "CRITICAL",
      title: "Cluster status is RED",
      detail: "The cluster is in red status, meaning one or more primary shards are not allocated. Some data may be unavailable.",
      recommendation: "Run GET /_cluster/allocation/explain to identify why shards are unassigned. Check node disk space and logs.",
      docUrl: "https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-health/",
    });
  } else if (data.status === "yellow") {
    findings.push({
      category: "CLUSTER_HEALTH",
      severity: "WARNING",
      title: "Cluster status is YELLOW",
      detail: "The cluster is in yellow status, meaning one or more replica shards are not allocated. Data is available but not fully redundant.",
      recommendation: "Check for unassigned replica shards with GET /_cat/shards?v&h=index,shard,prirep,state,unassigned.reason. Consider adding nodes or adjusting replica count.",
      docUrl: "https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-health/",
    });
  }

  if (data.pendingTasks > 50) {
    findings.push({
      category: "CLUSTER_HEALTH",
      severity: "CRITICAL",
      title: `${data.pendingTasks} pending cluster tasks`,
      detail: `There are ${data.pendingTasks} pending tasks in the cluster queue. This is unusually high and indicates the master node may be overwhelmed.`,
      recommendation: "Check master node logs and resource usage. Run GET /_cluster/pending_tasks for details.",
      docUrl: "https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-pending-tasks/",
      metadata: { pendingTasks: data.pendingTasks },
    });
  } else if (data.pendingTasks > 10) {
    findings.push({
      category: "CLUSTER_HEALTH",
      severity: "WARNING",
      title: `${data.pendingTasks} pending cluster tasks`,
      detail: `There are ${data.pendingTasks} pending tasks queued. This may indicate cluster instability or heavy metadata operations.`,
      recommendation: "Monitor with GET /_cluster/pending_tasks. Avoid heavy index creation/deletion operations.",
      metadata: { pendingTasks: data.pendingTasks },
    });
  }

  if (data.numberOfNodes === 1) {
    findings.push({
      category: "CLUSTER_HEALTH",
      severity: "WARNING",
      title: "Single-node cluster (no high availability)",
      detail: "Only one node detected. If this node fails, the cluster will be unavailable and data may be lost.",
      recommendation: "For production use, add at least 2 additional nodes to enable replication and master election.",
    });
  }

  return findings;
}
