import type { FindingInput, PluginsData } from "../types";

// Known plugins that are commonly mismatched in version
const CORE_PLUGINS = [
  "opensearch-security",
  "opensearch-job-scheduler",
  "opensearch-anomaly-detection",
  "opensearch-index-management",
  "opensearch-performance-analyzer",
  "opensearch-sql",
  "opensearch-knn",
  "opensearch-cross-cluster-replication",
  "opensearch-alerting",
  "opensearch-notifications",
  "opensearch-notifications-core",
];

export function analyzePlugins(data: PluginsData): FindingInput[] {
  const findings: FindingInput[] = [];
  const { plugins, osVersion } = data;

  if (!plugins || plugins.length === 0) {
    findings.push({
      category: "PLUGINS",
      severity: "INFO",
      title: "No plugins detected",
      detail: "No plugins were found on this cluster. This may indicate a minimal installation.",
      recommendation:
        "If you expect plugins to be installed, verify the plugin list via GET /_cat/plugins.",
    });
    return findings;
  }

  // Check for version mismatches — plugins should match OS version
  const mismatchedPlugins = plugins.filter(
    (p) => p.version && osVersion && !p.version.startsWith(osVersion.split(".").slice(0, 2).join("."))
  );

  if (mismatchedPlugins.length > 0) {
    findings.push({
      category: "PLUGINS",
      severity: "WARNING",
      title: `${mismatchedPlugins.length} plugin${mismatchedPlugins.length > 1 ? "s have" : " has"} version mismatch`,
      detail: `Plugins should match the OpenSearch version (${osVersion}). Mismatched: ${mismatchedPlugins.map((p) => `${p.name} (${p.version})`).join(", ")}.`,
      recommendation:
        "Update plugins to match your OpenSearch version. Version mismatches can cause instability or feature unavailability.",
      docUrl: "https://opensearch.org/docs/latest/install-and-configure/plugins/",
      metadata: { mismatchedPlugins: mismatchedPlugins.map((p) => p.name) },
    });
  }

  // Check that security plugin is present (critical for secure clusters)
  const hasSecurityPlugin = plugins.some((p) => p.name === "opensearch-security");
  if (!hasSecurityPlugin) {
    findings.push({
      category: "PLUGINS",
      severity: "WARNING",
      title: "Security plugin not installed",
      detail:
        "The opensearch-security plugin was not found. Without it, authentication and authorization are unavailable.",
      recommendation:
        "Install the security plugin if this is a production cluster. See the OpenSearch installation guide.",
      docUrl: "https://opensearch.org/docs/latest/security/",
    });
  }

  if (findings.length === 0) {
    findings.push({
      category: "PLUGINS",
      severity: "OK",
      title: `${plugins.length} plugins installed and versions appear consistent`,
      detail: `All detected plugins match OpenSearch ${osVersion}.`,
      recommendation: "No action required.",
    });
  }

  return findings;
}
