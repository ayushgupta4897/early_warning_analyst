"use client";
import { OverallAssessment, RISK_BAND_COLORS } from "@/lib/types";

interface SeverityHeaderProps {
  assessment?: OverallAssessment;
  isLoading?: boolean;
}

export default function SeverityHeader({ assessment, isLoading }: SeverityHeaderProps) {
  if (isLoading || !assessment) {
    return (
      <div className="w-full h-32 bg-card border-b border-card-border animate-pulse" />
    );
  }

  const riskColor = RISK_BAND_COLORS[assessment.risk_level] || "#666";
  const riskLabel = assessment.risk_level.replace("_", " ").toUpperCase();

  return (
    <div className="w-full bg-card border-b border-card-border p-6 flex items-center justify-between relative overflow-hidden">
        {/* Background Glow */}
        <div 
            className="absolute top-0 right-0 w-1/3 h-full opacity-10 blur-3xl"
            style={{ backgroundColor: riskColor }}
        />

      <div className="flex items-start gap-6 z-10 relative">
        {/* Severity Gauge/Badge */}
        <div className="flex flex-col items-center justify-center">
            <div 
                className="w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                style={{ borderColor: riskColor, boxShadow: `0 0 20px ${riskColor}40` }}
            >
                <div 
                    className="w-16 h-16 rounded-full opacity-80 animate-pulse"
                    style={{ backgroundColor: riskColor }}
                />
            </div>
            <span 
                className="mt-2 text-xs font-mono font-bold tracking-widest"
                style={{ color: riskColor }}
            >
                {riskLabel}
            </span>
        </div>

        {/* Content */}
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-foreground mb-2">
                {assessment.headline}
            </h1>
            <p className="text-muted text-sm leading-relaxed mb-3">
                {assessment.key_concern}
            </p>
            
            <div className="flex items-center gap-4 text-xs font-mono text-accent">
                <span className="bg-accent/10 px-2 py-1 rounded">
                    CONFIDENCE: {assessment.confidence}
                </span>
                <span className="bg-accent/10 px-2 py-1 rounded">
                    TIMELINE: {assessment.timeline_estimate}
                </span>
            </div>
        </div>
      </div>

      {/* Quick Watchlist */}
      <div className="hidden lg:block z-10 w-64 border-l border-card-border pl-6">
        <h3 className="text-xs font-semibold uppercase text-muted mb-3 tracking-wider">
            Critical Watchlist
        </h3>
        <ul className="space-y-2">
            {assessment.what_to_watch.slice(0, 3).map((item, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                    <span className="text-accent mt-0.5">›</span> 
                    {item}
                </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
