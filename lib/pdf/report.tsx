/**
 * PDF report document for a diagnostic session.
 * Rendered server-side with @react-pdf/renderer.
 */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register a safe fallback font
Font.registerHyphenationCallback((word) => [word]);

const COLORS = {
  primary: "#111827",
  secondary: "#374151",
  muted: "#9ca3af",
  border: "#e5e7eb",
  bg: "#f9fafb",
  red: "#dc2626",
  yellow: "#d97706",
  blue: "#2563eb",
  green: "#16a34a",
  headerBg: "#111827",
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: COLORS.red,
  WARNING: COLORS.yellow,
  INFO: COLORS.blue,
  OK: COLORS.green,
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 36,
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: COLORS.headerBg,
    marginHorizontal: -40,
    marginTop: -36,
    paddingHorizontal: 40,
    paddingVertical: 20,
    marginBottom: 24,
  },
  headerTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  headerSub: { fontSize: 9, color: "#9ca3af", marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 8, marginBottom: 6 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: { fontSize: 7, color: COLORS.muted, marginBottom: 3, textTransform: "uppercase" },
  statValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  findingRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  severityBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    color: "#ffffff",
    width: 52,
    textAlign: "center",
  },
  findingTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  findingDetail: { fontSize: 8, color: COLORS.secondary },
  findingRec: { fontSize: 8, color: COLORS.blue, marginTop: 2 },
  nodeRow: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  nodeCell: { fontSize: 8, color: COLORS.secondary },
  tableHeader: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 4,
    backgroundColor: COLORS.bg,
    borderRadius: 3,
    marginBottom: 2,
  },
  tableHeaderCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: COLORS.muted },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: COLORS.muted },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  executivePara: { fontSize: 9, color: COLORS.secondary, lineHeight: 1.5, marginBottom: 6 },
});

function scoreColor(score: number | null) {
  if (!score) return COLORS.muted;
  if (score >= 80) return COLORS.green;
  if (score >= 60) return COLORS.yellow;
  return COLORS.red;
}

function scoreLabel(score: number | null) {
  if (!score) return "N/A";
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  return "Critical";
}

export interface ReportData {
  clusterName: string;
  clusterEndpoint: string;
  sessionDate: string;
  agentVersion?: string | null;
  osVersion?: string | null;
  durationMs?: number | null;
  healthScore?: number | null;
  findings: Array<{
    severity: string;
    category: string;
    title: string;
    detail: string;
    recommendation: string;
  }>;
  nodes: Array<{
    name: string;
    roles: string[];
    heapUsedPercent: number;
    cpuPercent: number;
    diskUsedPercent: number;
  }>;
}

export function ReportDocument({ data }: { data: ReportData }) {
  const critCount = data.findings.filter((f) => f.severity === "CRITICAL").length;
  const warnCount = data.findings.filter((f) => f.severity === "WARNING").length;
  const infoCount = data.findings.filter((f) => f.severity === "INFO").length;
  const okCount = data.findings.filter((f) => f.severity === "OK").length;
  const color = scoreColor(data.healthScore ?? null);

  // Executive summary text
  const execSummary = data.healthScore
    ? `This diagnostic session for ${data.clusterName} completed with a health score of ${data.healthScore}/100 (${scoreLabel(data.healthScore ?? null)}). ` +
      (critCount > 0
        ? `${critCount} critical issue${critCount > 1 ? "s" : ""} require immediate attention. `
        : "No critical issues were detected. ") +
      (warnCount > 0
        ? `${warnCount} warning${warnCount > 1 ? "s" : ""} should be reviewed. `
        : "") +
      `The cluster is running on OpenSearch ${data.osVersion ?? "unknown version"}.`
    : "Diagnostic session data is incomplete.";

  return (
    <Document
      title={`OpenSearch Doctor Report — ${data.clusterName}`}
      author="OpenSearch Doctor"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>OpenSearch Doctor — Diagnostic Report</Text>
          <Text style={styles.headerSub}>
            {data.clusterName} · {data.clusterEndpoint} · {data.sessionDate}
          </Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.row}>
            {/* Score */}
            <View style={{ alignItems: "center", justifyContent: "center", width: 70 }}>
              <View style={[styles.scoreCircle, { borderColor: color }]}>
                <Text style={[styles.scoreText, { color }]}>{data.healthScore ?? "—"}</Text>
              </View>
              <Text style={{ fontSize: 7, color: COLORS.muted, marginTop: 3 }}>Health Score</Text>
            </View>
            {/* Summary text */}
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={styles.executivePara}>{execSummary}</Text>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                {data.agentVersion && (
                  <Text style={{ fontSize: 7, color: COLORS.muted }}>Agent: {data.agentVersion}</Text>
                )}
                {data.osVersion && (
                  <Text style={{ fontSize: 7, color: COLORS.muted }}>OpenSearch: {data.osVersion}</Text>
                )}
                {data.durationMs && (
                  <Text style={{ fontSize: 7, color: COLORS.muted }}>
                    Duration: {(data.durationMs / 1000).toFixed(1)}s
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Finding counts */}
        <View style={[styles.section]}>
          <Text style={styles.sectionTitle}>Finding Summary</Text>
          <View style={styles.row}>
            {[
              { label: "Critical", count: critCount, color: COLORS.red },
              { label: "Warnings", count: warnCount, color: COLORS.yellow },
              { label: "Info", count: infoCount, color: COLORS.blue },
              { label: "OK", count: okCount, color: COLORS.green },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Findings list */}
        {data.findings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Findings & Recommendations</Text>
            {data.findings.map((f, i) => (
              <View key={i} style={styles.findingRow} wrap={false}>
                <View style={{ width: 60 }}>
                  <Text
                    style={[
                      styles.severityBadge,
                      { backgroundColor: SEVERITY_COLORS[f.severity] ?? COLORS.muted },
                    ]}
                  >
                    {f.severity}
                  </Text>
                  <Text style={{ fontSize: 7, color: COLORS.muted, marginTop: 3 }}>
                    {f.category.replace(/_/g, " ")}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.findingTitle}>{f.title}</Text>
                  <Text style={styles.findingDetail}>{f.detail}</Text>
                  <Text style={styles.findingRec}>→ {f.recommendation}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Nodes */}
        {data.nodes.length > 0 && (
          <View style={styles.section} break>
            <Text style={styles.sectionTitle}>Nodes ({data.nodes.length})</Text>
            <View style={styles.tableHeader}>
              {["Name", "Roles", "Heap %", "CPU %", "Disk %"].map((h, i) => (
                <Text
                  key={h}
                  style={[styles.tableHeaderCell, { flex: i === 0 ? 2 : i === 1 ? 1.5 : 1 }]}
                >
                  {h}
                </Text>
              ))}
            </View>
            {data.nodes.map((n, i) => (
              <View key={i} style={styles.nodeRow}>
                <Text style={[styles.nodeCell, { flex: 2, fontFamily: "Helvetica-Bold" }]}>{n.name}</Text>
                <Text style={[styles.nodeCell, { flex: 1.5 }]}>{n.roles.join(", ")}</Text>
                <Text style={[styles.nodeCell, { flex: 1, color: n.heapUsedPercent > 85 ? COLORS.red : COLORS.secondary }]}>
                  {n.heapUsedPercent.toFixed(1)}%
                </Text>
                <Text style={[styles.nodeCell, { flex: 1, color: n.cpuPercent > 80 ? COLORS.red : COLORS.secondary }]}>
                  {n.cpuPercent.toFixed(1)}%
                </Text>
                <Text style={[styles.nodeCell, { flex: 1, color: n.diskUsedPercent > 80 ? COLORS.red : COLORS.secondary }]}>
                  {n.diskUsedPercent.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by OpenSearch Doctor · {data.sessionDate}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
