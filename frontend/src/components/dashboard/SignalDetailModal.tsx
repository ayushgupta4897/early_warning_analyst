"use client";
import { useEffect } from "react";
import { Signal, RISK_BAND_COLORS, RISK_BAND_LABELS } from "@/lib/types";

const AGENT_COLORS: Record<string, string> = {
  signal_hunter: "#3b82f6",
  corroboration: "#10b981",
  devils_advocate: "#ef4444",
};

const AGENT_LABELS: Record<string, string> = {
  signal_hunter: "Signal Hunter",
  corroboration: "Corroboration",
  devils_advocate: "Devil's Advocate",
};

function scoreColor(val: number): string {
  if (val >= 75) return "#ef4444";
  if (val >= 60) return "#f97316";
  if (val >= 40) return "#eab308";
  return "#22c55e";
}

function ScoreBar({ label, value }: { label: string; value: number | undefined }) {
  const v = value ?? 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-card-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${v}%`, backgroundColor: scoreColor(v) }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color: scoreColor(v) }}>
        {v.toFixed(0)}
      </span>
    </div>
  );
}

export default function SignalDetailModal({
  signal,
  onClose,
}: {
  signal: Signal;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm backdrop-enter"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[1120px] max-h-[85vh] overflow-y-auto bg-card border border-card-border rounded-2xl shadow-2xl modal-enter">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-card-border px-6 py-4 flex items-start justify-between gap-4 z-10 rounded-t-2xl">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold leading-tight">{signal.name}</h2>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs bg-card-border">
                {signal.domain}
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
                style={{
                  backgroundColor: `${RISK_BAND_COLORS[signal.risk_band] || "#666"}20`,
                  color: RISK_BAND_COLORS[signal.risk_band] || "#666",
                }}
              >
                {RISK_BAND_LABELS[signal.risk_band] || signal.risk_band}
              </span>
              {signal.constellation_id && (
                <span className="px-2 py-0.5 rounded text-xs text-accent bg-accent/10">
                  {signal.constellation_id}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors shrink-0 mt-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* Scores */}
          <div className="space-y-2.5">
            <h3 className="text-xs uppercase tracking-wider text-muted font-semibold">Scores</h3>
            <div className="bg-background rounded-xl p-4 space-y-2.5">
              <ScoreBar label="Overall" value={signal.scores.overall} />
              <ScoreBar label="Impact" value={signal.scores.impact} />
              <ScoreBar label="Lead-time" value={signal.scores.lead_time} />
              <ScoreBar label="Reliability" value={signal.scores.reliability} />
              <div className="border-t border-card-border pt-2.5 mt-2.5 space-y-2.5">
                <ScoreBar label="Near-term" value={signal.scores.near_term} />
                <ScoreBar label="Structural" value={signal.scores.structural} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">Description</h3>
            <p className="text-sm leading-relaxed">{signal.description}</p>
          </div>

          {/* Signal vs Noise */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background rounded-xl p-4">
              <h4 className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
                Why it looks like noise
              </h4>
              <p className="text-sm text-muted leading-relaxed">{signal.why_looks_like_noise}</p>
            </div>
            <div className="bg-background rounded-xl p-4">
              <h4 className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">
                Why it actually matters
              </h4>
              <p className="text-sm text-muted leading-relaxed">{signal.why_actually_meaningful}</p>
            </div>
          </div>

          {/* Evidence Chain */}
          {signal.evidence_chain && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">Evidence Chain</h3>
              <p className="text-sm text-muted leading-relaxed">{signal.evidence_chain}</p>
            </div>
          )}

          {/* Agent Perspectives */}
          {signal.agent_perspectives && Object.keys(signal.agent_perspectives).length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-3">Agent Perspectives</h3>
              <div className="space-y-3">
                {Object.entries(signal.agent_perspectives).map(([agent, perspective]) => (
                  <div key={agent} className="flex gap-3">
                    <div className="shrink-0 mt-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: AGENT_COLORS[agent] || "#666" }}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-0.5" style={{ color: AGENT_COLORS[agent] || "#999" }}>
                        {AGENT_LABELS[agent] || agent}
                      </div>
                      <p className="text-sm text-muted leading-relaxed">{perspective}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monitoring Triggers */}
          {signal.monitoring_triggers && signal.monitoring_triggers.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">Monitoring Triggers</h3>
              <ul className="space-y-1.5">
                {signal.monitoring_triggers.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted">
                    <span className="text-accent shrink-0">-</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No-Regret Actions */}
          {signal.no_regret_actions && signal.no_regret_actions.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-2">No-Regret Actions</h3>
              <ul className="space-y-1.5">
                {signal.no_regret_actions.map((a, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted">
                    <span className="text-risk-green shrink-0">-</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
