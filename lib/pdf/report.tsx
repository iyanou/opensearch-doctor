/**
 * PDF report document for a diagnostic session.
 * Rendered server-side with @react-pdf/renderer.
 *
 * Layout rules for react-pdf compatibility:
 *  - NO `gap` — use explicit `marginRight` on children instead
 *  - NO `flexWrap` — size items to fit in one row
 *  - NO negative margins — structure the DOM to avoid them
 *  - NO `overflow: hidden` — not supported
 *  - NO `textTransform` — write uppercase strings directly
 *  - Percentage widths only work when parent has a known px width
 */
import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Font,
  Svg, Rect, Path, Circle, Line, Defs, LinearGradient, Stop,
} from "@react-pdf/renderer";

Font.registerHyphenationCallback((word) => [word]);

// ── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  brand:       "#4361EE",
  brandMid:    "#6B82F8",
  brandLight:  "#dde4ff",
  navy:        "#0f172a",
  navyMid:     "#1e293b",
  dark:        "#111827",
  body:        "#374151",
  muted:       "#6b7280",
  subtle:      "#9ca3af",
  border:      "#e5e7eb",
  borderLight: "#f3f4f6",
  bg:          "#f9fafb",
  white:       "#ffffff",
  critical:    "#dc2626",
  critBg:      "#fef2f2",
  critBorder:  "#fecaca",
  warning:     "#d97706",
  warnBg:      "#fffbeb",
  warnBorder:  "#fde68a",
  info:        "#2563eb",
  infoBg:      "#eff6ff",
  infoBorder:  "#bfdbfe",
  ok:          "#16a34a",
  okBg:        "#f0fdf4",
  okBorder:    "#bbf7d0",
};

// A4 = 595pt. Margins = 40pt each side. Content = 515pt.
const PW = 515;

const SEV: Record<string, { fg: string; bg: string; border: string }> = {
  CRITICAL: { fg: C.critical, bg: C.critBg,  border: C.critBorder  },
  WARNING:  { fg: C.warning,  bg: C.warnBg,  border: C.warnBorder  },
  INFO:     { fg: C.info,     bg: C.infoBg,  border: C.infoBorder  },
  OK:       { fg: C.ok,       bg: C.okBg,    border: C.okBorder    },
};

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.body,
    backgroundColor: C.white,
  },

  // ── Header (brand stripe + dark band) ─────────────────────────────────────
  brandStripe: {
    height: 5,
    backgroundColor: C.brand,
  },
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerLeft: { flex: 1 },
  headerTag: {
    fontSize: 7,
    color: C.brandMid,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginBottom: 5,
  },
  headerCluster: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#a5b4fc",
    marginBottom: 3,
  },
  headerEndpoint: {
    fontSize: 7.5,
    color: "#64748b",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerDateLabel: {
    fontSize: 6.5,
    color: "#64748b",
    marginBottom: 3,
  },
  headerDateValue: {
    fontSize: 8,
    color: C.subtle,
    fontFamily: "Helvetica-Bold",
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 52,
  },

  // ── Section title ─────────────────────────────────────────────────────────
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionAccent: {
    width: 3,
    height: 13,
    backgroundColor: C.brand,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitleText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
  },

  // ── Score + summary card ──────────────────────────────────────────────────
  // Widths: scorePanel=108, gap=12, summaryPanel=PW-108-12=395
  heroRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  scorePanel: {
    width: 108,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginRight: 12,
  },
  scoreRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
  },
  scoreStatusLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  scoreSub: {
    fontSize: 6.5,
    color: C.muted,
  },
  summaryPanel: {
    width: 395,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    padding: 14,
  },
  summaryText: {
    fontSize: 8.5,
    color: C.body,
    lineHeight: 1.65,
    marginBottom: 12,
  },
  // 4 meta pills in one row, widths: (395-28-18)/4=87 each, gap 6
  metaRow: {
    flexDirection: "row",
  },
  metaPill: {
    width: 87,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 6,
  },
  metaPillLast: {
    width: 87,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  metaLabel: { fontSize: 6, color: C.muted, marginBottom: 2 },
  metaValue: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.dark },

  // ── Severity stat row (4 cards, width = (PW-24)/4 = 122.75 ≈ 123) ────────
  statsRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  statCard: {
    width: 123,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  statCardLast: {
    width: 123,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statCount: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },

  // ── Priority box ──────────────────────────────────────────────────────────
  priorityBox: {
    backgroundColor: C.critBg,
    borderWidth: 1,
    borderColor: C.critBorder,
    borderLeftWidth: 4,
    borderLeftColor: C.critical,
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
  },
  priorityHeading: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.critical,
    marginBottom: 9,
  },
  priorityItem: {
    flexDirection: "row",
    marginBottom: 6,
  },
  priorityBullet: {
    width: 10,
    fontSize: 7.5,
    color: C.critical,
    paddingTop: 0.5,
  },
  priorityBody: { width: 493 },
  priorityTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#7f1d1d",
    marginBottom: 2,
  },
  priorityRec: {
    fontSize: 7.5,
    color: C.critical,
    lineHeight: 1.4,
  },
  priorityMore: {
    fontSize: 7.5,
    color: C.critical,
    marginTop: 4,
  },

  // ── Findings ──────────────────────────────────────────────────────────────
  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 5,
  },
  groupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 7,
  },
  groupLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  groupCount: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    marginLeft: "auto",
  },
  findingCard: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingRight: 10,
    marginBottom: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  findingBadgeCol: {
    width: 64,
    alignItems: "center",
    paddingTop: 1,
  },
  severityChip: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    marginBottom: 4,
    textAlign: "center",
  },
  categoryChip: {
    fontSize: 6,
    color: C.muted,
    textAlign: "center",
    lineHeight: 1.4,
  },
  findingBody: { flex: 1 },
  findingTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    marginBottom: 3,
  },
  findingDetail: {
    fontSize: 8,
    color: C.body,
    lineHeight: 1.55,
    marginBottom: 5,
  },
  recLine: {
    flexDirection: "row",
  },
  recArrow: {
    fontSize: 8,
    color: C.brand,
    marginRight: 4,
    width: 8,
  },
  recText: {
    flex: 1,
    fontSize: 7.5,
    color: C.brand,
    lineHeight: 1.5,
  },

  // ── Nodes table ───────────────────────────────────────────────────────────
  tableWrap: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.bg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  thName:  { width: 130, fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted },
  thRoles: { width: 80,  fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted, marginLeft: 8 },
  thMetric:{ width: 88,  fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted, marginLeft: 8 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    alignItems: "center",
  },
  tdName:  { width: 130, fontSize: 8, fontFamily: "Helvetica-Bold", color: C.dark },
  tdRoles: { width: 80,  fontSize: 7, color: C.muted, marginLeft: 8 },
  tdMetric:{ width: 88,  flexDirection: "row", alignItems: "center", marginLeft: 8 },
  barTrack: {
    flex: 1,
    height: 5,
    backgroundColor: C.border,
    borderRadius: 3,
    marginRight: 5,
  },
  barFill: {
    height: 5,
    borderRadius: 3,
  },
  barValue: {
    width: 26,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    backgroundColor: C.white,
  },
  footerBrand: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.brand },
  footerCenter: { fontSize: 7, color: C.subtle },
  footerPage: { fontSize: 7, color: C.subtle },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function scoreColor(v: number | null) {
  if (!v) return C.muted;
  if (v >= 80) return C.ok;
  if (v >= 60) return C.warning;
  return C.critical;
}
function scoreLabel(v: number | null) {
  if (!v) return "No Data";
  if (v >= 90) return "Excellent";
  if (v >= 80) return "Healthy";
  if (v >= 60) return "Degraded";
  if (v >= 40) return "At Risk";
  return "Critical";
}
function barColor(pct: number) {
  if (pct >= 85) return C.critical;
  if (pct >= 70) return C.warning;
  return C.ok;
}

// Pixel bar — parent tdMetric is 88pt, marginRight 5 on track, value 26pt
// track = 88 - 5 - 26 = 57pt. fill width is percent of 57.
function NodeBar({ pct }: { pct: number }) {
  const fillW = Math.round((Math.min(pct, 100) / 100) * 57);
  const col = barColor(pct);
  return (
    <View style={s.tdMetric}>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: fillW, backgroundColor: col }]} />
      </View>
      <Text style={[s.barValue, { color: col }]}>{pct.toFixed(0)}%</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={s.sectionTitleRow}>
      <View style={s.sectionAccent} />
      <Text style={s.sectionTitleText}>{title}</Text>
    </View>
  );
}

/** The EKG + magnifying glass icon mark, rendered natively in PDF */
function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#6B82F8" stopOpacity={1} />
          <Stop offset="100%" stopColor="#2D3FC0" stopOpacity={1} />
        </LinearGradient>
      </Defs>
      {/* Background */}
      <Rect width={100} height={100} rx={22} fill="url(#lg)" />
      {/* EKG / pulse line */}
      <Path
        d="M10,56 L22,56 L27,20 L33,86 L39,56 L49,56"
        stroke="white" strokeWidth={7}
        strokeLinecap="round" strokeLinejoin="round"
        fill="none"
      />
      {/* Magnifying glass lens */}
      <Circle cx={65} cy={48} r={14} stroke="white" strokeWidth={7} fill="none" />
      {/* Handle */}
      <Line x1={75} y1={58} x2={86} y2={69} stroke="white" strokeWidth={7} strokeLinecap="round" />
    </Svg>
  );
}

// ── Data interface ────────────────────────────────────────────────────────────
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

// ── Document ─────────────────────────────────────────────────────────────────
export function ReportDocument({ data }: { data: ReportData }) {
  const score   = data.healthScore ?? null;
  const sColor  = scoreColor(score);
  const sLabel  = scoreLabel(score);

  const critical = data.findings.filter((f) => f.severity === "CRITICAL");
  const warnings = data.findings.filter((f) => f.severity === "WARNING");
  const infos    = data.findings.filter((f) => f.severity === "INFO");
  const oks      = data.findings.filter((f) => f.severity === "OK");
  const total    = data.findings.length;

  const summary =
    score != null
      ? `This diagnostic run on ${data.clusterName} completed with a health score of ${score}/100, rated ${sLabel}. ` +
        (critical.length > 0
          ? `${critical.length} critical issue${critical.length > 1 ? "s were" : " was"} found and require immediate attention. `
          : "No critical issues were detected. ") +
        (warnings.length > 0
          ? `${warnings.length} warning${warnings.length > 1 ? "s" : ""} should be reviewed. `
          : "") +
        `${total} finding${total !== 1 ? "s" : ""} were analysed in total.`
      : "Diagnostic data is unavailable for this session.";

  const grouped: Array<{ sev: string; items: typeof data.findings }> = [];
  if (critical.length) grouped.push({ sev: "CRITICAL", items: critical });
  if (warnings.length) grouped.push({ sev: "WARNING",  items: warnings });
  if (infos.length)    grouped.push({ sev: "INFO",     items: infos });
  if (oks.length)      grouped.push({ sev: "OK",       items: oks });

  const stats = [
    { label: "CRITICAL", count: critical.length, col: SEV.CRITICAL },
    { label: "WARNING",  count: warnings.length, col: SEV.WARNING  },
    { label: "INFO",     count: infos.length,    col: SEV.INFO     },
    { label: "OK",       count: oks.length,      col: SEV.OK       },
  ];

  return (
    <Document title={`Diagnostic Report — ${data.clusterName}`} author="OpenSearch Doctor">
      <Page size="A4" style={s.page}>

        {/* Brand stripe */}
        <View style={s.brandStripe} />

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {/* Logo mark + app name row */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <LogoMark size={32} />
              <View style={{ marginLeft: 10 }}>
                <Text style={[s.headerTag, { marginBottom: 0 }]}>OPENSEARCH DOCTOR</Text>
              </View>
            </View>
            <Text style={s.headerTitle}>Diagnostic Report</Text>
            <Text style={s.headerCluster}>{data.clusterName}</Text>
            <Text style={s.headerEndpoint}>{data.clusterEndpoint}</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerDateLabel}>REPORT DATE</Text>
            <Text style={s.headerDateValue}>{data.sessionDate}</Text>
          </View>
        </View>

        <View style={s.body}>

          {/* ── Score + Summary ─────────────────────────────────── */}
          <View style={s.heroRow}>
            {/* Score panel */}
            <View style={s.scorePanel}>
              <View style={[s.scoreRing, { borderColor: sColor }]}>
                <Text style={[s.scoreNumber, { color: sColor }]}>{score ?? "—"}</Text>
              </View>
              <Text style={[s.scoreStatusLabel, { color: sColor }]}>{sLabel}</Text>
              <Text style={s.scoreSub}>out of 100</Text>
            </View>

            {/* Summary panel — explicit width 395pt, no flex */}
            <View style={s.summaryPanel}>
              <Text style={s.summaryText}>{summary}</Text>
              {/* Meta pills — 4 pills × 87pt + 3 gaps × 6pt = 366pt, fits in 395-28=367 */}
              <View style={s.metaRow}>
                <View style={s.metaPill}>
                  <Text style={s.metaLabel}>OPENSEARCH</Text>
                  <Text style={s.metaValue}>{data.osVersion ?? "—"}</Text>
                </View>
                <View style={s.metaPill}>
                  <Text style={s.metaLabel}>AGENT</Text>
                  <Text style={s.metaValue}>{data.agentVersion ?? "—"}</Text>
                </View>
                <View style={s.metaPill}>
                  <Text style={s.metaLabel}>SCAN DURATION</Text>
                  <Text style={s.metaValue}>{data.durationMs ? `${(data.durationMs / 1000).toFixed(1)}s` : "—"}</Text>
                </View>
                <View style={s.metaPillLast}>
                  <Text style={s.metaLabel}>TOTAL FINDINGS</Text>
                  <Text style={s.metaValue}>{total}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Severity counts ──────────────────────────────────── */}
          <View style={s.statsRow}>
            {stats.map((item, i) => (
              <View
                key={item.label}
                style={[
                  i < 3 ? s.statCard : s.statCardLast,
                  { backgroundColor: item.col.bg, borderColor: item.col.border },
                ]}
              >
                <Text style={[s.statCount, { color: item.col.fg }]}>{item.count}</Text>
                <Text style={[s.statLabel, { color: item.col.fg }]}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Priority actions ─────────────────────────────────── */}
          {critical.length > 0 && (
            <View style={s.priorityBox} wrap={false}>
              <Text style={s.priorityHeading}>
                {`! ${critical.length} Critical Issue${critical.length > 1 ? "s" : ""} — Immediate Action Required`}
              </Text>
              {critical.slice(0, 4).map((f, i) => (
                <View key={i} style={s.priorityItem}>
                  <Text style={s.priorityBullet}>•</Text>
                  <View style={s.priorityBody}>
                    <Text style={s.priorityTitle}>{f.title}</Text>
                    <Text style={s.priorityRec}>{`→  ${f.recommendation}`}</Text>
                  </View>
                </View>
              ))}
              {critical.length > 4 && (
                <Text style={s.priorityMore}>+ {critical.length - 4} more critical findings listed below</Text>
              )}
            </View>
          )}

          {/* ── Findings ─────────────────────────────────────────── */}
          {total > 0 && (
            <View style={{ marginBottom: 22 }}>
              <SectionTitle title="Findings & Recommendations" />
              {grouped.map(({ sev, items }) => {
                const col = SEV[sev] ?? { fg: C.muted, bg: C.bg, border: C.border };
                return (
                  <View key={sev} style={{ marginBottom: 10 }}>
                    <View style={[s.groupHeaderRow, { backgroundColor: col.bg, borderWidth: 1, borderColor: col.border }]}>
                      <View style={[s.groupDot, { backgroundColor: col.fg }]} />
                      <Text style={[s.groupLabel, { color: col.fg }]}>{sev}</Text>
                      <Text style={[s.groupCount, { color: col.fg }]}>
                        {items.length} finding{items.length > 1 ? "s" : ""}
                      </Text>
                    </View>
                    {items.map((f, i) => (
                      <View
                        key={i}
                        style={[
                          s.findingCard,
                          {
                            backgroundColor: col.bg,
                            borderColor: col.border,
                            borderLeftColor: col.fg,
                          },
                        ]}
                        wrap={false}
                      >
                        <View style={s.findingBadgeCol}>
                          <Text style={[s.severityChip, { backgroundColor: col.fg }]}>
                            {sev.slice(0, 4)}
                          </Text>
                          <Text style={s.categoryChip}>
                            {f.category.replace(/_/g, "\n")}
                          </Text>
                        </View>
                        <View style={s.findingBody}>
                          <Text style={s.findingTitle}>{f.title}</Text>
                          <Text style={s.findingDetail}>{f.detail}</Text>
                          <View style={s.recLine}>
                            <Text style={s.recArrow}>→</Text>
                            <Text style={s.recText}>{f.recommendation}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Node table ───────────────────────────────────────── */}
          {data.nodes.length > 0 && (
            <View break>
              <SectionTitle title={`Node Overview — ${data.nodes.length} node${data.nodes.length > 1 ? "s" : ""}`} />
              <View style={s.tableWrap}>
                {/* Header */}
                <View style={s.tableHead}>
                  <Text style={s.thName}>NODE</Text>
                  <Text style={s.thRoles}>ROLES</Text>
                  <Text style={s.thMetric}>JVM HEAP</Text>
                  <Text style={s.thMetric}>CPU</Text>
                  <Text style={s.thMetric}>DISK</Text>
                </View>
                {data.nodes.map((n, i) => (
                  <View
                    key={i}
                    style={[s.tableRow, i % 2 === 1 ? { backgroundColor: C.bg } : {}]}
                    wrap={false}
                  >
                    <Text style={s.tdName}>{n.name}</Text>
                    <Text style={s.tdRoles}>{n.roles.slice(0, 3).join(", ")}</Text>
                    <NodeBar pct={n.heapUsedPercent} />
                    <NodeBar pct={n.cpuPercent} />
                    <NodeBar pct={n.diskUsedPercent} />
                  </View>
                ))}
              </View>
            </View>
          )}

        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <LogoMark size={16} />
            <Text style={[s.footerBrand, { marginLeft: 5 }]}>OpenSearch Doctor</Text>
          </View>
          <Text style={s.footerCenter}>{data.clusterName}  ·  {data.sessionDate}</Text>
          <Text
            style={s.footerPage}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  );
}
