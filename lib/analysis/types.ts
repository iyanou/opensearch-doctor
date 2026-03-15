import type { CheckCategory, Severity } from "@prisma/client";

export interface FindingInput {
  category: CheckCategory;
  severity: Severity;
  title: string;
  detail: string;
  recommendation: string;
  docUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface MetricInput {
  clusterId: string;
  recordedAt: Date;
  metricKey: string;
  metricValue: number;
  nodeId?: string;
}

export interface AnalysisResult {
  findings: FindingInput[];
  metrics: MetricInput[];
  healthScore: number;
}

// Raw data shape sent by the agent
export interface AgentPayload {
  clusterHealth?: ClusterHealthData;
  nodes?: NodesData;
  shards?: ShardsData;
  indices?: IndicesData;
  performance?: PerformanceData;
  snapshots?: SnapshotsData;
  ismPolicies?: IsmPoliciesData;
  security?: SecurityData;
  plugins?: PluginsData;
  ingestPipelines?: IngestPipelinesData;
  templates?: TemplatesData;
}

export interface ClusterHealthData {
  status: "green" | "yellow" | "red";
  numberOfNodes: number;
  numberOfDataNodes: number;
  activePrimaryShards: number;
  activeShards: number;
  relocatingShards: number;
  initializingShards: number;
  unassignedShards: number;
  pendingTasks: number;
}

export interface NodeStat {
  id: string;
  name: string;
  roles: string[];
  heapUsedPercent: number;
  cpuPercent: number;
  diskUsedPercent: number;
  diskTotalBytes: number;
  diskAvailableBytes: number;
  uptimeMs: number;
  osMemUsedPercent: number;
}

export interface NodesData {
  nodes: NodeStat[];
}

export interface ShardsData {
  unassignedCount: number;
  unassignedReasons: Record<string, number>; // reason -> count
  shardCountPerNode: Record<string, number>; // nodeId -> count
  avgShardSizeBytes: number;
}

export interface IndicesData {
  indices: {
    name: string;
    health: "green" | "yellow" | "red";
    status: "open" | "close";
    primaryShards: number;
    replicas: number;
    docsCount: number;
    storeSizeBytes: number;
    mappingFieldCount: number;
    isReadOnly: boolean;
    refreshInterval: string;
  }[];
}

export interface PerformanceData {
  indexingRatePerSec: number;
  searchRatePerSec: number;
  searchLatencyMs: number;
  queryRejections: number;
  bulkRejections: number;
  queryCacheHitRate: number;
  fieldDataEvictions: number;
  segmentCountTotal: number;
  mergeTimeMs: number;
}

export interface SnapshotsData {
  repositoriesCount: number;
  lastSuccessfulSnapshotAt: string | null;
  failedSnapshotsLast7Days: number;
}

export interface IsmPoliciesData {
  policiesCount: number;
  indicesWithoutPolicy: number;
  indicesWithErrors: number;
}

export interface SecurityData {
  tlsHttpEnabled: boolean;
  tlsTransportEnabled: boolean;
  anonymousAccessEnabled: boolean;
  auditLoggingEnabled: boolean;
  authBackendConfigured: boolean;
}

export interface PluginsData {
  osVersion: string;
  plugins: { name: string; version: string }[];
}

export interface IngestPipelinesData {
  pipelinesCount: number;
  orphanedPipelines: number;
}

export interface TemplatesData {
  templatesCount: number;
  overlappingPriorities: number;
  unusedTemplates: number;
}
