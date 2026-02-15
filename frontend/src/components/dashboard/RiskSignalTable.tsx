"use client";
import { useState, Fragment } from "react";
import { Signal, RISK_BAND_COLORS, RISK_BAND_LABELS } from "@/lib/types";

type SortKey = "overall" | "impact" | "lead_time" | "reliability" | "near_term" | "structural";

export default function RiskSignalTable({ signals }: { signals: Signal[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...signals].sort(
    (a, b) => (b.scores[sortKey] || 0) - (a.scores[sortKey] || 0)
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-card-border text-muted text-xs uppercase tracking-wider">
            <th className="py-3 px-3 text-left">#</th>
            <th className="py-3 px-3 text-left">Signal</th>
            <th className="py-3 px-3 text-left">Domain</th>
            <th
              className="py-3 px-3 text-right cursor-pointer hover:text-foreground"
              onClick={() => setSortKey("overall")}
            >
              Overall {sortKey === "overall" && "▼"}
            </th>
            <th className="py-3 px-3 text-center">Risk</th>
            <th
              className="py-3 px-3 text-right cursor-pointer hover:text-foreground"
              onClick={() => setSortKey("impact")}
            >
              Impact {sortKey === "impact" && "▼"}
            </th>
            <th
              className="py-3 px-3 text-right cursor-pointer hover:text-foreground"
              onClick={() => setSortKey("lead_time")}
            >
              Lead-time {sortKey === "lead_time" && "▼"}
            </th>
            <th
              className="py-3 px-3 text-right cursor-pointer hover:text-foreground"
              onClick={() => setSortKey("reliability")}
            >
              Reliability {sortKey === "reliability" && "▼"}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((signal, i) => (
            <Fragment key={signal.signal_id || i}>
              <tr
                className="border-b border-card-border/50 hover:bg-card-hover cursor-pointer transition-colors"
                onClick={() =>
                  setExpandedId(expandedId === signal.signal_id ? null : signal.signal_id)
                }
              >
                <td className="py-3 px-3 font-mono text-muted">{i + 1}</td>
                <td className="py-3 px-3 font-medium">{signal.name}</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded text-xs bg-card-border">
                    {signal.domain}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold">
                  {signal.scores.overall?.toFixed(0) || "—"}
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className="inline-block w-3 h-3 rounded-full risk-pulse"
                    style={{
                      backgroundColor: RISK_BAND_COLORS[signal.risk_band] || "#666",
                    }}
                    title={RISK_BAND_LABELS[signal.risk_band]}
                  />
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {signal.scores.impact?.toFixed(0) || "—"}
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {signal.scores.lead_time?.toFixed(0) || "—"}
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {signal.scores.reliability?.toFixed(0) || "—"}
                </td>
              </tr>

              {/* Expanded Detail */}
              {expandedId === signal.signal_id && (
                <tr key={`${signal.signal_id}-detail`}>
                  <td colSpan={8} className="p-0">
                    <div className="bg-card border-l-2 p-4 space-y-3" style={{ borderColor: RISK_BAND_COLORS[signal.risk_band] }}>
                      <p className="text-sm">{signal.description}</p>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <h4 className="text-muted uppercase tracking-wider mb-1 font-semibold">
                            Why it looks like noise
                          </h4>
                          <p className="text-muted">{signal.why_looks_like_noise}</p>
                        </div>
                        <div>
                          <h4 className="text-muted uppercase tracking-wider mb-1 font-semibold">
                            Why it actually matters
                          </h4>
                          <p className="text-muted">{signal.why_actually_meaningful}</p>
                        </div>
                      </div>

                      {signal.evidence_chain && (
                        <div className="text-xs">
                          <h4 className="text-muted uppercase tracking-wider mb-1 font-semibold">
                            Evidence Chain
                          </h4>
                          <p className="text-muted">{signal.evidence_chain}</p>
                        </div>
                      )}

                      {signal.agent_perspectives && (
                        <div className="text-xs space-y-1">
                          <h4 className="text-muted uppercase tracking-wider mb-1 font-semibold">
                            Agent Perspectives
                          </h4>
                          {Object.entries(signal.agent_perspectives).map(([agent, perspective]) => (
                            <div key={agent} className="flex gap-2">
                              <span className="font-mono text-muted shrink-0">{agent}:</span>
                              <span className="text-muted">{perspective}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {signal.monitoring_triggers && signal.monitoring_triggers.length > 0 && (
                        <div className="text-xs">
                          <h4 className="text-muted uppercase tracking-wider mb-1 font-semibold">
                            Monitoring Triggers
                          </h4>
                          <ul className="list-disc pl-4 text-muted space-y-0.5">
                            {signal.monitoring_triggers.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex gap-4 text-xs font-mono">
                        <span>Near-term: {signal.scores.near_term?.toFixed(1)}</span>
                        <span>Structural: {signal.scores.structural?.toFixed(1)}</span>
                        {signal.constellation_id && (
                          <span className="text-accent">
                            Constellation: {signal.constellation_id}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      {signals.length === 0 && (
        <div className="text-center py-12 text-muted text-sm">
          Waiting for analysis to complete...
        </div>
      )}
    </div>
  );
}
