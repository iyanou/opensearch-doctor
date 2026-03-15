import type { FindingInput, SnapshotsData } from "../types";

const MS_PER_DAY = 86_400_000;

export function analyzeSnapshots(data: SnapshotsData): FindingInput[] {
  const findings: FindingInput[] = [];

  // No snapshot repositories configured
  if (data.repositoriesCount === 0) {
    findings.push({
      category: "SNAPSHOTS",
      severity: "CRITICAL",
      title: "No snapshot repositories configured",
      detail:
        "There are no snapshot repositories registered. Without a repository, no backups can be taken and data cannot be recovered in case of failure.",
      recommendation:
        "Register a snapshot repository (S3, GCS, Azure, or shared filesystem): PUT /_snapshot/<repo_name>. Then set up a recurring snapshot policy (ISM or cron).",
      docUrl: "https://opensearch.org/docs/latest/opensearch/snapshots/snapshot-restore/",
    });
    return findings;
  }

  // No recent successful snapshot
  if (!data.lastSuccessfulSnapshotAt) {
    findings.push({
      category: "SNAPSHOTS",
      severity: "CRITICAL",
      title: "No successful snapshots found",
      detail:
        "A snapshot repository is configured but no successful snapshots have been recorded. Your data has no verified backup.",
      recommendation:
        "Trigger a snapshot immediately: PUT /_snapshot/<repo>/<snapshot_name>. Then set up an automated snapshot schedule using Index State Management (ISM) or a cron job.",
      docUrl: "https://opensearch.org/docs/latest/opensearch/snapshots/snapshot-restore/",
    });
  } else {
    const lastSnapshotAge = Date.now() - new Date(data.lastSuccessfulSnapshotAt).getTime();
    const daysSince = lastSnapshotAge / MS_PER_DAY;

    if (daysSince > 7) {
      findings.push({
        category: "SNAPSHOTS",
        severity: "CRITICAL",
        title: `Last successful snapshot is ${Math.floor(daysSince)} days old`,
        detail:
          "No successful snapshot has been taken in over a week. Your backup is stale and recovery point objective (RPO) may be violated.",
        recommendation:
          "Run a snapshot immediately and investigate why automated snapshots stopped. Check ISM policy status and snapshot repository health.",
        metadata: { daysSinceLastSnapshot: Math.floor(daysSince) },
      });
    } else if (daysSince > 1) {
      findings.push({
        category: "SNAPSHOTS",
        severity: "WARNING",
        title: `Last successful snapshot is ${Math.floor(daysSince)} day${Math.floor(daysSince) > 1 ? "s" : ""} old`,
        detail:
          "The most recent successful snapshot is more than 24 hours old. For production clusters, daily snapshots are recommended.",
        recommendation:
          "Ensure snapshot automation is running. Verify ISM snapshot policies are active and not failing.",
        metadata: { daysSinceLastSnapshot: Math.floor(daysSince) },
      });
    }
  }

  // Recent snapshot failures
  if (data.failedSnapshotsLast7Days > 0) {
    findings.push({
      category: "SNAPSHOTS",
      severity: data.failedSnapshotsLast7Days > 3 ? "CRITICAL" : "WARNING",
      title: `${data.failedSnapshotsLast7Days} snapshot failure${data.failedSnapshotsLast7Days > 1 ? "s" : ""} in the last 7 days`,
      detail:
        "Snapshot failures indicate an issue with your backup process. Repeated failures increase data loss risk.",
      recommendation:
        "Review snapshot failure reasons: GET /_snapshot/<repo>/_all. Check repository connectivity, credentials, and storage capacity.",
      metadata: { failedSnapshotsLast7Days: data.failedSnapshotsLast7Days },
    });
  }

  if (findings.length === 0) {
    findings.push({
      category: "SNAPSHOTS",
      severity: "OK",
      title: "Snapshots are healthy",
      detail: "Recent successful snapshots found, no failures in the last 7 days.",
      recommendation: "No action required. Continue monitoring backup freshness.",
    });
  }

  return findings;
}
