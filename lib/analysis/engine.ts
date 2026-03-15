import type { AgentPayload, AnalysisResult, FindingInput, MetricInput } from "./types";
import { analyzeClusterHealth } from "./checks/cluster-health";
import { analyzeNodes } from "./checks/nodes";
import { analyzeShards } from "./checks/shards";
import { analyzeIndices } from "./checks/indices";
import { analyzePerformance } from "./checks/performance";
import { analyzeSnapshots } from "./checks/snapshots";
import { analyzeIsmPolicies } from "./checks/ism-policies";
import { analyzeSecurity } from "./checks/security";
import { analyzePlugins } from "./checks/plugins";
import { analyzeIngestPipelines } from "./checks/ingest-pipelines";
import { analyzeTemplates } from "./checks/templates";

export async function runAnalysis(
  clusterId: string,
  data: AgentPayload
): Promise<AnalysisResult> {
  const findings: FindingInput[] = [];
  const metrics: MetricInput[] = [];
  const now = new Date();

  if (data.clusterHealth) {
    findings.push(...analyzeClusterHealth(data.clusterHealth));
  }

  if (data.nodes) {
    const result = analyzeNodes(data.nodes);
    findings.push(...result.findings);
    for (const node of data.nodes.nodes) {
      metrics.push(
        { clusterId, recordedAt: now, metricKey: "heap_percent", metricValue: node.heapUsedPercent, nodeId: node.id },
        { clusterId, recordedAt: now, metricKey: "cpu_percent", metricValue: node.cpuPercent, nodeId: node.id },
        { clusterId, recordedAt: now, metricKey: "disk_percent", metricValue: node.diskUsedPercent, nodeId: node.id }
      );
    }
  }

  if (data.shards) {
    findings.push(...analyzeShards(data.shards));
    metrics.push({
      clusterId, recordedAt: now,
      metricKey: "unassigned_shards",
      metricValue: data.shards.unassignedCount,
    });
  }

  if (data.indices) {
    findings.push(...analyzeIndices(data.indices));
    metrics.push({
      clusterId, recordedAt: now,
      metricKey: "red_indices",
      metricValue: data.indices.indices.filter((i) => i.health === "red").length,
    });
  }

  if (data.performance) {
    findings.push(...analyzePerformance(data.performance));
    metrics.push(
      { clusterId, recordedAt: now, metricKey: "search_latency_ms", metricValue: data.performance.searchLatencyMs },
      { clusterId, recordedAt: now, metricKey: "bulk_rejections", metricValue: data.performance.bulkRejections },
      { clusterId, recordedAt: now, metricKey: "query_rejections", metricValue: data.performance.queryRejections },
      { clusterId, recordedAt: now, metricKey: "search_rate", metricValue: data.performance.searchRatePerSec },
      { clusterId, recordedAt: now, metricKey: "indexing_rate", metricValue: data.performance.indexingRatePerSec }
    );
  }

  if (data.snapshots) {
    findings.push(...analyzeSnapshots(data.snapshots));
  }

  if (data.ismPolicies) {
    findings.push(...analyzeIsmPolicies(data.ismPolicies));
  }

  if (data.security) {
    findings.push(...analyzeSecurity(data.security));
  }

  if (data.plugins) {
    findings.push(...analyzePlugins(data.plugins));
  }

  if (data.ingestPipelines) {
    findings.push(...analyzeIngestPipelines(data.ingestPipelines));
  }

  if (data.templates) {
    findings.push(...analyzeTemplates(data.templates));
  }

  // Compute health score: start at 100, deduct per severity
  const critical = findings.filter((f) => f.severity === "CRITICAL").length;
  const warnings = findings.filter((f) => f.severity === "WARNING").length;
  const healthScore = Math.max(0, 100 - critical * 15 - warnings * 5);

  metrics.push({ clusterId, recordedAt: now, metricKey: "health_score", metricValue: healthScore });

  return { findings, metrics, healthScore };
}
