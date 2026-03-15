import type { AnalysisResult, AgentPayload } from "@/lib/analysis/types";

export interface AlertContext {
  clusterId: string;
  userId: string;
  clusterName: string;
  result: AnalysisResult;
  payload: AgentPayload;
}
