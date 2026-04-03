import type { ClusterHealthData } from "../types";
import type { FindingInput } from "../types";

export function analyzeClusterHealth(data: ClusterHealthData, singleNode = false): FindingInput[] {
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
    if (singleNode) {
      // Yellow on single-node = replicas can't be assigned — expected, not a problem
      findings.push({
        category: "CLUSTER_HEALTH",
        severity: "INFO",
        title: "Cluster status is YELLOW (expected on single-node)",
        detail: "The cluster is yellow because replica shards cannot be assigned — there is only one node to host them. This is normal for a single-node setup.",
        recommendation: "Set number_of_replicas: 0 on your indices to avoid yellow status: PUT /<index>/_settings {\"index.number_of_replicas\": 0}. Replicas only provide value when you have multiple nodes.",
        docUrl: "https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-health/",
      });
    } else {
      findings.push({
        category: "CLUSTER_HEALTH",
        severity: "WARNING",
        title: "Cluster status is YELLOW",
        detail: "The cluster is in yellow status, meaning one or more replica shards are not allocated. Data is available but not fully redundant.",
        recommendation: "Check for unassigned replica shards with GET /_cat/shards?v&h=index,shard,prirep,state,unassigned.reason. Consider adding nodes or adjusting replica count.",
        docUrl: "https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-health/",
      });
    }
  }

  // Pending tasks
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

  // Stuck pending tasks (3d)
  if (data.pendingTasks > 0 && data.pendingTasksMaxWaitMs) {
    const waitSec = Math.round(data.pendingTasksMaxWaitMs / 1000);
    if (data.pendingTasksMaxWaitMs > 60_000) {
      findings.push({
        category: "CLUSTER_HEALTH",
        severity: "CRITICAL",
        title: `Pending cluster task stuck for ${waitSec}s`,
        detail: `The oldest pending task has been waiting for ${waitSec} seconds. This may indicate a stalled master operation or a deadlock.`,
        recommendation: "Run GET /_cluster/pending_tasks for details. Check master node logs. Consider rolling restart if the cluster is unresponsive.",
        docUrl: "https://opensearch.org/docs/latest/api-reference/cluster-api/cluster-pending-tasks/",
        metadata: { pendingTasksMaxWaitMs: data.pendingTasksMaxWaitMs },
      });
    } else if (data.pendingTasksMaxWaitMs > 30_000) {
      findings.push({
        category: "CLUSTER_HEALTH",
        severity: "WARNING",
        title: `Pending cluster task waiting ${waitSec}s`,
        detail: `The oldest pending task has been waiting ${waitSec} seconds. Slow task processing may indicate master node pressure.`,
        recommendation: "Monitor with GET /_cluster/pending_tasks. Reduce concurrent index operations if possible.",
        metadata: { pendingTasksMaxWaitMs: data.pendingTasksMaxWaitMs },
      });
    }
  }

  // Single-node HA finding
  if (data.numberOfNodes === 1) {
    findings.push({
      category: "CLUSTER_HEALTH",
      severity: "CRITICAL",
      title: "Single-node cluster — no high availability",
      detail: "Only one node is running. If this node fails, the entire cluster becomes unavailable and data may be lost. A single-node cluster is not suitable for production workloads.",
      recommendation: "For production use, add at least 2 additional nodes to enable replication and master election. For development, this is acceptable.",
      docUrl: "https://opensearch.org/docs/latest/tuning-your-cluster/",
    });
  }

  return findings;
}
