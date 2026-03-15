import type { FindingInput, IngestPipelinesData } from "../types";

export function analyzeIngestPipelines(data: IngestPipelinesData): FindingInput[] {
  const findings: FindingInput[] = [];

  if (data.pipelinesCount === 0) {
    findings.push({
      category: "INGEST_PIPELINES",
      severity: "INFO",
      title: "No ingest pipelines configured",
      detail: "No ingest pipelines are registered on this cluster.",
      recommendation:
        "This is normal if you are not using ingest pipelines for document enrichment. If expected, verify via GET /_ingest/pipeline.",
    });
    return findings;
  }

  if (data.orphanedPipelines > 0) {
    findings.push({
      category: "INGEST_PIPELINES",
      severity: "WARNING",
      title: `${data.orphanedPipelines} orphaned ingest pipeline${data.orphanedPipelines > 1 ? "s" : ""}`,
      detail:
        "Ingest pipelines exist that are not referenced by any index. These consume metadata memory and add confusion.",
      recommendation:
        "Review and delete unused pipelines via DELETE /_ingest/pipeline/<pipeline_id>. Use GET /_ingest/pipeline to list all pipelines.",
      docUrl: "https://opensearch.org/docs/latest/api-reference/ingest-apis/delete-ingest/",
      metadata: { orphanedPipelines: data.orphanedPipelines },
    });
  }

  if (findings.length === 0) {
    findings.push({
      category: "INGEST_PIPELINES",
      severity: "OK",
      title: `${data.pipelinesCount} ingest pipeline${data.pipelinesCount > 1 ? "s" : ""} configured`,
      detail: "All ingest pipelines appear to be in use.",
      recommendation: "No action required.",
    });
  }

  return findings;
}
