// F2 — each check is wrapped in try/catch so one broken check never aborts the full analysis
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
import { analyzeCircuitBreakers } from "./checks/circuit-breakers";

export async function runAnalysis(
  clusterId: string,
  data: AgentPayload
): Promise<AnalysisResult> {
  const findings: FindingInput[] = [];
  const metrics: MetricInput[] = [];
  const now = new Date();
  const singleNode = data.singleNode === true;

  function safeRun(name: string, fn: () => FindingInput[]): void {
    try {
      findings.push(...fn());
    } catch (err) {
      console.error(`[analysis] Check "${name}" failed:`, err);
    }
  }

  if (data.clusterHealth) {
    safeRun("clusterHealth", () => analyzeClusterHealth(data.clusterHealth!, singleNode));
  }

  if (data.nodes) {
    safeRun("nodes", () => {
      const result = analyzeNodes(data.nodes!, singleNode);
      try {
        for (const node of data.nodes!.nodes) {
          metrics.push(
            { clusterId, recordedAt: now, metricKey: "heap_percent",  metricValue: node.heapUsedPercent, nodeId: node.id },
            { clusterId, recordedAt: now, metricKey: "cpu_percent",   metricValue: node.cpuPercent,      nodeId: node.id },
            { clusterId, recordedAt: now, metricKey: "disk_percent",  metricValue: node.diskUsedPercent, nodeId: node.id }
          );
        }
      } catch (err) {
        console.error("[analysis] node metrics failed:", err);
      }
      return result.findings;
    });
  }

  if (data.shards) {
    safeRun("shards", () => {
      const f = analyzeShards(data.shards!, singleNode);
      metrics.push({ clusterId, recordedAt: now, metricKey: "unassigned_shards", metricValue: data.shards!.unassignedCount });
      return f;
    });
  }

  if (data.indices) {
    safeRun("indices", () => {
      const f = analyzeIndices(data.indices!, singleNode);
      metrics.push({ clusterId, recordedAt: now, metricKey: "red_indices", metricValue: data.indices!.indices.filter((i) => i.health === "red").length });
      return f;
    });
  }

  if (data.performance) {
    safeRun("performance", () => {
      const f = analyzePerformance(data.performance!);
      metrics.push(
        { clusterId, recordedAt: now, metricKey: "search_latency_ms", metricValue: data.performance!.searchLatencyMs },
        { clusterId, recordedAt: now, metricKey: "bulk_rejections",   metricValue: data.performance!.bulkRejections },
        { clusterId, recordedAt: now, metricKey: "query_rejections",  metricValue: data.performance!.queryRejections },
        { clusterId, recordedAt: now, metricKey: "search_rate",       metricValue: data.performance!.searchRatePerSec },
        { clusterId, recordedAt: now, metricKey: "indexing_rate",     metricValue: data.performance!.indexingRatePerSec }
      );
      return f;
    });
  }

  if (data.snapshots)       safeRun("snapshots",       () => analyzeSnapshots(data.snapshots!));
  if (data.ismPolicies)     safeRun("ismPolicies",     () => analyzeIsmPolicies(data.ismPolicies!));
  if (data.security)        safeRun("security",        () => analyzeSecurity(data.security!));
  if (data.plugins)         safeRun("plugins",         () => analyzePlugins(data.plugins!));
  if (data.ingestPipelines) safeRun("ingestPipelines", () => analyzeIngestPipelines(data.ingestPipelines!));
  if (data.templates)       safeRun("templates",       () => analyzeTemplates(data.templates!));
  if (data.circuitBreakers) safeRun("circuitBreakers", () => analyzeCircuitBreakers(data.circuitBreakers!));

  const critical = findings.filter((f) => f.severity === "CRITICAL").length;
  const warnings = findings.filter((f) => f.severity === "WARNING").length;
  const healthScore = Math.max(0, 100 - critical * 15 - warnings * 5);

  metrics.push({ clusterId, recordedAt: now, metricKey: "health_score", metricValue: healthScore });

  return { findings, metrics, healthScore };
}
