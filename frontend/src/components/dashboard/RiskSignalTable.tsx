"use client";
import { useState } from "react";
import { Signal, RISK_BAND_COLORS, RISK_BAND_LABELS } from "@/lib/types";
import SignalDetailModal from "./SignalDetailModal";

type SortKey = "overall" | "impact" | "lead_time" | "reliability" | "near_term" | "structural";

const COLUMN_TOOLTIPS: Record<string, string> = {
  overall:
    "Composite score (0\u2013100) combining impact, lead-time, and structural weight. Higher = more concerning.",
  risk: "Risk band: Green (monitor), Amber (watch), Red-Watch (emerging), Red-Action (critical).",
  impact:
    "Potential severity if this signal materializes (0\u2013100). Assesses damage scale and breadth.",
  lead_time:
    "Urgency score (0\u2013100). Higher means the signal is closer to triggering a visible crisis.",
  reliability:
    "Confidence in the signal\u2019s validity (0\u2013100). Based on source quality and cross-modal corroboration.",
};

function scoreColor(val: number): string {
  if (val >= 75) return "#ef4444";
  if (val >= 60) return "#f97316";
  if (val >= 40) return "#eab308";
  return "#22c55e";
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative group/tip inline-flex ml-1 cursor-help">
      <svg
        className="w-3.5 h-3.5 text-muted/50 group-hover/tip:text-muted transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 px-3 py-2 text-xs text-foreground bg-card border border-card-border rounded-lg shadow-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all duration-150 pointer-events-none z-50 normal-case tracking-normal font-normal text-left leading-relaxed">
        {text}
      </span>
    </span>
  );
}

function SortableHeader({
  label,
  sortKey: key,
  currentSort,
  onSort,
  tooltip,
  align = "right",
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  onSort: (key: SortKey) => void;
  tooltip: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={`py-3 px-4 text-${align} cursor-pointer hover:text-foreground transition-colors select-none`}
      onClick={() => onSort(key)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        {currentSort === key && <span className="text-accent ml-0.5">&#9660;</span>}
        <InfoTooltip text={tooltip} />
      </span>
    </th>
  );
}

export default function RiskSignalTable({ signals }: { signals: Signal[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  const sorted = [...signals].sort(
    (a, b) => (b.scores[sortKey] || 0) - (a.scores[sortKey] || 0)
  );

  return (
    <>
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-sm">
          <thead className="relative">
            <tr className="border-b border-card-border text-muted text-xs uppercase tracking-wider">
              <th className="py-3 px-4 text-left w-10">#</th>
              <th className="py-3 px-4 text-left">Signal</th>
              <th className="py-3 px-4 text-left">Domain</th>
              <SortableHeader
                label="Overall"
                sortKey="overall"
                currentSort={sortKey}
                onSort={setSortKey}
                tooltip={COLUMN_TOOLTIPS.overall}
              />
              <th className="py-3 px-4 text-center">
                <span className="inline-flex items-center gap-0.5">
                  Risk
                  <InfoTooltip text={COLUMN_TOOLTIPS.risk} />
                </span>
              </th>
              <SortableHeader
                label="Impact"
                sortKey="impact"
                currentSort={sortKey}
                onSort={setSortKey}
                tooltip={COLUMN_TOOLTIPS.impact}
              />
              <SortableHeader
                label="Lead-time"
                sortKey="lead_time"
                currentSort={sortKey}
                onSort={setSortKey}
                tooltip={COLUMN_TOOLTIPS.lead_time}
              />
              <SortableHeader
                label="Reliability"
                sortKey="reliability"
                currentSort={sortKey}
                onSort={setSortKey}
                tooltip={COLUMN_TOOLTIPS.reliability}
              />
            </tr>
          </thead>
          <tbody>
            {sorted.map((signal, i) => (
              <tr
                key={signal.signal_id || i}
                className="border-b border-card-border/30 hover:bg-card-hover cursor-pointer transition-colors"
                onClick={() => setSelectedSignal(signal)}
              >
                <td className="py-3.5 px-4 font-mono text-muted/60 text-xs">
                  {i + 1}
                </td>
                <td className="py-3.5 px-4 font-medium">{signal.name}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-xs bg-card-border/60">
                    {signal.domain}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold">
                  <span style={{ color: scoreColor(signal.scores.overall || 0) }}>
                    {signal.scores.overall?.toFixed(0) || "\u2014"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wide"
                    style={{
                      backgroundColor: `${RISK_BAND_COLORS[signal.risk_band] || "#666"}15`,
                      color: RISK_BAND_COLORS[signal.risk_band] || "#666",
                    }}
                  >
                    {(RISK_BAND_LABELS[signal.risk_band] || signal.risk_band).split(" \u2014 ")[0]}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono">
                  <span style={{ color: scoreColor(signal.scores.impact || 0) }}>
                    {signal.scores.impact?.toFixed(0) || "\u2014"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono">
                  <span style={{ color: scoreColor(signal.scores.lead_time || 0) }}>
                    {signal.scores.lead_time?.toFixed(0) || "\u2014"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono">
                  <span style={{ color: scoreColor(signal.scores.reliability || 0) }}>
                    {signal.scores.reliability?.toFixed(0) || "\u2014"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {signals.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">
            Waiting for analysis to complete...
          </div>
        )}
      </div>

      {/* Signal Detail Modal */}
      {selectedSignal && (
        <SignalDetailModal
          signal={selectedSignal}
          onClose={() => setSelectedSignal(null)}
        />
      )}
    </>
  );
}
