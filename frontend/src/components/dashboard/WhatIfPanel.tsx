"use client";
import { useState } from "react";
import { startWhatIf, createWhatIfStream } from "@/lib/api";
import { WhatIfResult, CascadeNode, RISK_BAND_COLORS } from "@/lib/types";

function CascadeTree({ node, depth = 0 }: { node: CascadeNode; depth?: number }) {
  const domainColors: Record<string, string> = {
    economy: "#3b82f6",
    labor: "#8b5cf6",
    infrastructure: "#f59e0b",
    health: "#ef4444",
    climate: "#10b981",
    food_water: "#06b6d4",
    cyber: "#ec4899",
    logistics: "#f97316",
    social_cohesion: "#a855f7",
    security: "#dc2626",
    energy: "#eab308",
    education: "#14b8a6",
    demographics: "#6366f1",
  };

  return (
    <div className="ml-4 relative">
      {depth > 0 && (
        <div className="absolute left-[-12px] top-0 bottom-0 w-px bg-card-border" />
      )}
      <div className="flex items-start gap-2 py-1.5 relative">
        {depth > 0 && (
          <div className="absolute left-[-12px] top-3 w-3 h-px bg-card-border" />
        )}
        <span
          className="shrink-0 w-2 h-2 rounded-full mt-1.5"
          style={{ backgroundColor: domainColors[node.domain] || "#666" }}
        />
        <div>
          <span className="text-sm">{node.effect}</span>
          <span className="text-xs text-muted ml-2">({node.domain})</span>
        </div>
      </div>
      {node.children?.map((child, i) => (
        <CascadeTree key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function WhatIfPanel({ analysisId }: { analysisId: string }) {
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [streamContent, setStreamContent] = useState("");

  const runScenario = async () => {
    if (!scenario.trim()) return;
    setLoading(true);
    setStreamContent("");
    setResult(null);

    try {
      const { stream_key } = await startWhatIf(analysisId, scenario);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const es = new EventSource(
        `${apiUrl}/api/analyze/${analysisId}/what-if/${stream_key}/stream`
      );

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "agent_chunk") {
          setStreamContent((prev) => prev + (data.content || ""));
        } else if (data.type === "agent_complete") {
          setResult(data.data as WhatIfResult);
          setLoading(false);
          es.close();
        } else if (data.type === "error") {
          setLoading(false);
          es.close();
        }
      };

      es.onerror = () => {
        setLoading(false);
        es.close();
      };
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Scenario Input */}
      <div>
        <label className="text-xs uppercase tracking-wider text-muted font-semibold block mb-2">
          Inject Scenario
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runScenario()}
            placeholder='e.g., "What if monsoon rainfall is 30% below normal?"'
            className="flex-1 bg-card border border-card-border rounded-lg px-4 py-2 text-sm placeholder:text-muted/50 focus:outline-none focus:border-accent"
          />
          <button
            onClick={runScenario}
            disabled={loading || !scenario.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold disabled:opacity-50 hover:bg-accent/90 transition-colors"
          >
            {loading ? "Simulating..." : "Run Scenario"}
          </button>
        </div>
        <p className="text-xs text-muted mt-1">
          Stress-test the weak signal landscape with a hypothetical shock
        </p>
      </div>

      {/* Streaming Output */}
      {loading && streamContent && (
        <div className="bg-card border border-card-border rounded-lg p-4">
          <div className="text-xs uppercase tracking-wider text-muted mb-2 font-semibold">
            Analyzing scenario...
          </div>
          <div className="text-sm text-muted font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
            {streamContent.slice(-1000)}
            <span className="typing-cursor">|</span>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Key Insight */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted font-semibold">
                Key Insight
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-mono font-bold"
                style={{
                  backgroundColor: `${RISK_BAND_COLORS[result.new_overall_risk_level] || "#666"}20`,
                  color: RISK_BAND_COLORS[result.new_overall_risk_level] || "#666",
                }}
              >
                {result.new_overall_risk_level?.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <p className="text-sm">{result.key_insight}</p>
          </div>

          {/* Cascade */}
          {result.cascade && (
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="text-xs uppercase tracking-wider text-muted mb-3 font-semibold">
                Cascade Propagation
              </div>
              <div className="font-semibold text-sm mb-2 text-accent">
                {result.cascade.root}
              </div>
              {result.cascade.first_order?.map((node, i) => (
                <CascadeTree key={i} node={node} />
              ))}
            </div>
          )}

          {/* Amplified Signals */}
          {result.amplified_signals && result.amplified_signals.length > 0 && (
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="text-xs uppercase tracking-wider text-muted mb-2 font-semibold">
                Amplified Signals ({result.amplified_signals.length})
              </div>
              <div className="space-y-2">
                {result.amplified_signals.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{s.signal_id}</span>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-muted">{s.original_overall_score?.toFixed(0)}</span>
                      <span className="text-risk-red-action">→ {s.new_overall_score?.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Signals */}
          {result.new_signals && result.new_signals.length > 0 && (
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="text-xs uppercase tracking-wider text-muted mb-2 font-semibold">
                New Signals Emerged ({result.new_signals.length})
              </div>
              <div className="space-y-2">
                {result.new_signals.map((s, i) => (
                  <div key={i} className="text-sm flex items-center justify-between">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs text-muted ml-2">({s.domain})</span>
                    </div>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${RISK_BAND_COLORS[s.risk_band] || "#666"}20`,
                        color: RISK_BAND_COLORS[s.risk_band] || "#666",
                      }}
                    >
                      {s.scores.overall?.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !result && (
        <div className="text-center py-8 text-muted text-sm">
          <p>Enter a hypothetical scenario to stress-test the risk landscape.</p>
          <p className="mt-1 text-xs">
            Examples: trade disruptions, commodity price shocks, natural disasters, policy changes
          </p>
        </div>
      )}
    </div>
  );
}
