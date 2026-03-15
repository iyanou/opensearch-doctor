import type { FindingInput, IsmPoliciesData } from "../types";

export function analyzeIsmPolicies(data: IsmPoliciesData): FindingInput[] {
  const findings: FindingInput[] = [];

  // No ISM policies at all
  if (data.policiesCount === 0) {
    findings.push({
      category: "ISM_POLICIES",
      severity: "WARNING",
      title: "No Index State Management policies configured",
      detail:
        "ISM policies automate index lifecycle operations such as rollover, force merge, and deletion. Without them, indices grow indefinitely and require manual maintenance.",
      recommendation:
        "Create ISM policies for your data indices to automate rollover, warm-tier migration, and deletion. This is especially important for log/time-series indices.",
      docUrl: "https://opensearch.org/docs/latest/im-plugin/ism/index/",
    });
    return findings;
  }

  // Indices without a policy
  if (data.indicesWithoutPolicy > 20) {
    findings.push({
      category: "ISM_POLICIES",
      severity: "WARNING",
      title: `${data.indicesWithoutPolicy} indices have no ISM policy`,
      detail:
        "A significant number of indices are not managed by an ISM policy and will not be automatically rolled over or deleted.",
      recommendation:
        "Apply ISM policies to unmanaged indices using index templates with the policy_id setting, or use the ISM bulk API to assign policies.",
      docUrl: "https://opensearch.org/docs/latest/im-plugin/ism/policies/",
      metadata: { indicesWithoutPolicy: data.indicesWithoutPolicy },
    });
  }

  // Indices with ISM errors
  if (data.indicesWithErrors > 0) {
    findings.push({
      category: "ISM_POLICIES",
      severity: data.indicesWithErrors > 5 ? "CRITICAL" : "WARNING",
      title: `${data.indicesWithErrors} index${data.indicesWithErrors > 1 ? "es" : ""} has ISM policy errors`,
      detail:
        "Indices in an ISM error state are stuck and their lifecycle actions are not being executed. This can lead to unbounded index growth.",
      recommendation:
        "Review the ISM error state for affected indices via GET /<index>/_plugins/_ism/explain. Retry the failed action or manually advance the policy state.",
      docUrl: "https://opensearch.org/docs/latest/im-plugin/ism/api/",
      metadata: { indicesWithErrors: data.indicesWithErrors },
    });
  }

  if (findings.length === 0) {
    findings.push({
      category: "ISM_POLICIES",
      severity: "OK",
      title: "ISM policies are healthy",
      detail: `${data.policiesCount} ISM policies active with no errors.`,
      recommendation: "No action required.",
    });
  }

  return findings;
}
