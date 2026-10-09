export type EntryType =
  | "sale"
  | "purchase"
  | "expense"
  | "udhaar_given"
  | "udhaar_recovered";
export type View = "overview" | "ledger" | "report" | "method";
export interface LedgerEntry {
  date: string;
  description: string;
  type: EntryType;
  amount: number;
  page?: number | null;
  confidence?: number | null;
}
export interface PageInfo {
  page: number;
  stated_total?: number | null;
}
export interface Ledger {
  business_name?: string | null;
  entries: LedgerEntry[];
  pages: PageInfo[];
}
export interface SampleSummary {
  id: string;
  business_name: string;
  description: string;
  months: number;
  entries: number;
}
export interface ModelInfo {
  name: string;
  version: number;
  trained_at: string;
  training_data: string;
  metrics: Record<string, number>;
}
export interface Health {
  status: string;
  llm_enabled: boolean;
  model: ModelInfo;
}
export interface Flag {
  kind:
    | "page_total_mismatch"
    | "outlier"
    | "duplicate"
    | "low_confidence"
    | "short_history";
  severity: "info" | "warning";
  message: string;
  entry_index?: number | null;
  page?: number | null;
}
export interface Explanation {
  language: "en" | "ur";
  summary: string;
  strengths: string[];
  concerns: string[];
  next_steps: string[];
  source: "gemini" | "template";
}
export interface AnalyzeResponse {
  business_name: string | null;
  profile: {
    months_of_history: number;
    avg_monthly_inflow: number;
    avg_monthly_outflow: number;
    avg_monthly_surplus: number;
    inflow_volatility: number;
    net_margin: number;
    active_day_ratio: number;
    udhaar_ratio: number;
    recovery_rate: number;
    inflow_trend: number;
    udhaar_outstanding: number;
    monthly: {
      month: string;
      inflow: number;
      outflow: number;
      udhaar_given: number;
      udhaar_recovered: number;
    }[];
  };
  score: {
    score: number;
    band: "ready" | "building" | "not_yet";
    repay_probability: number;
    factors: {
      feature: string;
      label: string;
      value: number;
      display_value: string;
      impact: number;
      direction: "up" | "down";
    }[];
  };
  loan: {
    eligible: boolean;
    monthly_instalment: number;
    tenure_months: number;
    principal: number;
    note: string;
  };
  flags: Flag[];
  explanations: Explanation[];
  model_info: ModelInfo;
}
export const ENTRY_LABELS: Record<EntryType, string> = {
  sale: "Sale",
  purchase: "Stock purchase",
  expense: "Expense",
  udhaar_given: "Udhaar given",
  udhaar_recovered: "Udhaar recovered",
};
export const BANDS = {
  ready: "Credit ready",
  building: "Building credit",
  not_yet: "Not ready yet",
};
