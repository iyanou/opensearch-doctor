import type { FindingInput, TemplatesData } from "../types";

export function analyzeTemplates(data: TemplatesData): FindingInput[] {
  const findings: FindingInput[] = [];

  if (data.overlappingPriorities > 0) {
    findings.push({
      category: "TEMPLATES",
      severity: "WARNING",
      title: `${data.overlappingPriorities} index template${data.overlappingPriorities > 1 ? "s have" : " has"} overlapping index patterns`,
      detail:
        "Multiple index templates match the same index patterns with the same priority. This can cause unpredictable template application for new indices.",
      recommendation:
        "Review index templates via GET /_index_template. Assign unique priority values or narrow index patterns to avoid conflicts.",
      docUrl: "https://opensearch.org/docs/latest/im-plugin/index-templates/",
      metadata: { overlappingCount: data.overlappingPriorities },
    });
  }

  if (data.unusedTemplates > 5) {
    findings.push({
      category: "TEMPLATES",
      severity: "INFO",
      title: `${data.unusedTemplates} index templates appear unused`,
      detail:
        "Several index templates are not matched by any existing index. Stale templates add configuration noise.",
      recommendation:
        "Review and remove templates that are no longer needed: DELETE /_index_template/<template_name>.",
      metadata: { unusedTemplates: data.unusedTemplates },
    });
  }

  if (findings.length === 0) {
    findings.push({
      category: "TEMPLATES",
      severity: "OK",
      title: "Index templates look clean",
      detail: `${data.templatesCount} template${data.templatesCount !== 1 ? "s" : ""} with no overlapping patterns.`,
      recommendation: "No action required.",
    });
  }

  return findings;
}
