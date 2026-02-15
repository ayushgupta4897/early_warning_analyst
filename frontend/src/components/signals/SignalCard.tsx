"use client";
import { Signal, RISK_BAND_COLORS } from "@/lib/types";
import { useState } from "react";

interface SignalCardProps {
    signal: Signal;
    rank: number;
}

export default function SignalCard({ signal, rank }: SignalCardProps) {
    const [expanded, setExpanded] = useState(false);
    const color = RISK_BAND_COLORS[signal.risk_band] || "#666";

    return (
        <div
            className={`
            bg-card border border-card-border rounded-lg p-4 transition-all duration-200 hover:border-l-4
            ${expanded ? "shadow-lg bg-card-hover" : "hover:bg-card-hover"}
        `}
            style={{ borderLeftColor: expanded ? color : undefined }}
        >
            <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex gap-3">
                    <span className="text-xs font-mono text-muted mt-0.5">#{rank}</span>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground leading-tight mb-1">
                            {signal.name}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span
                                className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-card-border"
                                style={{ color: color }}
                            >
                                {signal.risk_band.replace("_", " ")}
                            </span>
                            <span className="text-[10px] text-muted uppercase tracking-wider">
                                {signal.domain}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-lg font-mono font-bold text-foreground">
                        {signal.scores.overall.toFixed(0)}
                    </div>
                    <div className="text-[10px] text-muted uppercase">Risk Score</div>
                </div>
            </div>

            {expanded && (
                <div className="mt-4 pt-4 border-t border-card-border space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-xs text-muted leading-relaxed">
                        {signal.description}
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <MetricBox label="Impact" value={signal.scores.impact} />
                        <MetricBox label="Reliability" value={signal.scores.reliability} />
                        <MetricBox label="Lead Time" value={signal.scores.lead_time} />
                    </div>

                    <div className="bg-accent/5 p-3 rounded border border-accent/10 mt-2">
                        <h4 className="text-[10px] uppercase font-bold text-accent mb-1">The "Hidden" Angle</h4>
                        <p className="text-xs text-foreground italic">
                            "{signal.why_actually_meaningful}"
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricBox({ label, value }: { label: string; value: number }) {
    return (
        <div className="bg-background rounded p-2 text-center border border-card-border">
            <div className="text-lg font-mono font-medium text-foreground">{value.toFixed(0)}</div>
            <div className="text-[9px] text-muted uppercase">{label}</div>
        </div>
    );
}
