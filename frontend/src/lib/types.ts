export interface AnalysisConfig {
  country: string;
  country_code: string;
  scope: "national" | "department";
  department_name?: string;
  horizon: number;
  signal_count: number;
  domains: string[];
  custom_indicators: string[];
}

export interface AgentState {
  id: string;
  name: string;
  status: "idle" | "searching" | "hunting" | "cross-validating" | "challenging" | "synthesizing" | "simulating" | "concluded";
  color: string;
  content: string;
  data: Record<string, unknown> | null;
}

export interface Signal {
  signal_id: string;
  name: string;
  domain: string;
  description: string;
  why_looks_like_noise: string;
  why_actually_meaningful: string;
  evidence_chain: string;
  agent_perspectives: {
    signal_hunter: string;
    corroboration: string;
    devils_advocate: string;
  };
  scores: {
    impact: number;
    lead_time: number;
    reliability: number;
    near_term: number;
    structural: number;
    overall: number;
  };
  risk_band: "green" | "amber" | "red_watch" | "red_action";
  constellation_id: string | null;
  monitoring_triggers: string[];
  no_regret_actions: string[];
}

export interface Constellation {
  id: string;
  name: string;
  signal_ids: string[];
  category: "isolated" | "correlated_cluster" | "fingerprint_match";
  description: string;
  cascade_paths: {
    path: string[];
    description: string;
  }[];
  fingerprint_match: {
    historical_case: string | null;
    match_strength: string | null;
    matching_signals: string[];
    divergences: string[];
    historical_timeline: string;
    current_stage_estimate: string;
  } | null;
}

export interface OverallAssessment {
  headline: string;
  risk_level: string;
  key_concern: string;
  confidence: string;
  what_to_watch: string[];
  timeline_estimate: string;
}

export interface SynthesisData {
  scored_signals: Signal[];
  constellations: Constellation[];
  overall_assessment: OverallAssessment;
}

export interface SSEEvent {
  type: "agent_start" | "agent_chunk" | "agent_complete" | "analysis_complete" | "error";
  agent?: string;
  content?: string;
  data?: Record<string, unknown>;
  status?: string;
  message?: string;
}

export interface CascadeNode {
  effect: string;
  domain: string;
  children?: CascadeNode[];
}

export interface WhatIfResult {
  scenario: string;
  cascade: {
    root: string;
    first_order: CascadeNode[];
  };
  amplified_signals: {
    signal_id: string;
    original_overall_score: number;
    new_overall_score: number;
    reason: string;
  }[];
  diminished_signals: {
    signal_id: string;
    original_overall_score: number;
    new_overall_score: number;
    reason: string;
  }[];
  new_signals: {
    name: string;
    domain: string;
    description: string;
    scores: { impact: number; lead_time: number; reliability: number; overall: number };
    risk_band: string;
  }[];
  new_overall_risk_level: string;
  key_insight: string;
}

export const DOMAIN_OPTIONS = [
  { value: "economy", label: "Economy" },
  { value: "labor", label: "Labor" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "health", label: "Health" },
  { value: "climate", label: "Climate" },
  { value: "food_water", label: "Food & Water" },
  { value: "cyber", label: "Cyber" },
  { value: "logistics", label: "Logistics" },
  { value: "social_cohesion", label: "Social Cohesion" },
  { value: "security", label: "Security" },
  { value: "energy", label: "Energy" },
  { value: "education", label: "Education" },
  { value: "demographics", label: "Demographics" },
];

export const AGENT_CONFIGS = [
  { id: "context", name: "Context Discovery", color: "#f59e0b", icon: "Globe" },
  { id: "signal_hunter", name: "Signal Hunter", color: "#3b82f6", icon: "Radar" },
  { id: "corroboration", name: "Corroboration Agent", color: "#10b981", icon: "CheckCircle" },
  { id: "devils_advocate", name: "Devil's Advocate", color: "#ef4444", icon: "ShieldAlert" },
  { id: "synthesis", name: "Synthesis Agent", color: "#a855f7", icon: "Brain" },
] as const;

export const RISK_BAND_COLORS: Record<string, string> = {
  green: "#22c55e",
  amber: "#eab308",
  red_watch: "#f97316",
  red_action: "#ef4444",
};

export const RISK_BAND_LABELS: Record<string, string> = {
  green: "Green — Monitor",
  amber: "Amber — Watch",
  red_watch: "Red-Watch — Emerging",
  red_action: "Red-Action — Critical",
};
