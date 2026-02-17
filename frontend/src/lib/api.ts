import { AnalysisConfig } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function startAnalysis(config: AnalysisConfig, password: string): Promise<{ analysis_id: string }> {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config, password }),
  });
  if (!res.ok) {
    const msg = res.status === 403 ? "Invalid password" : `Failed to start analysis: ${res.statusText}`;
    throw new Error(msg);
  }
  return res.json();
}

export function createAnalysisStream(analysisId: string): EventSource {
  return new EventSource(`${API_URL}/api/analyze/${analysisId}/stream`);
}

export async function startWhatIf(
  analysisId: string,
  scenario: string
): Promise<{ scenario_id: string; stream_key: string }> {
  const res = await fetch(`${API_URL}/api/analyze/${analysisId}/what-if`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) throw new Error(`Failed to start what-if: ${res.statusText}`);
  return res.json();
}

export function createWhatIfStream(analysisId: string, streamKey: string): EventSource {
  return new EventSource(`${API_URL}/api/analyze/${analysisId}/what-if/${streamKey}/stream`);
}

export interface AnalysisRun {
  id: string;
  country: string;
  scope: string;
  horizon: number;
  domains: string[];
  signal_count: number;
  status: "running" | "completed" | "failed";
  created_at: number;
  assessment: {
    headline?: string;
    risk_level?: string;
    confidence?: string;
  } | null;
}

export async function listRuns(): Promise<{ runs: AnalysisRun[] }> {
  const res = await fetch(`${API_URL}/api/runs`);
  if (!res.ok) throw new Error(`Failed to list runs: ${res.statusText}`);
  return res.json();
}

export async function deleteAnalysis(analysisId: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/analyze/${analysisId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const msg = res.status === 403 ? "Invalid password" : `Failed to delete: ${res.statusText}`;
    throw new Error(msg);
  }
}
