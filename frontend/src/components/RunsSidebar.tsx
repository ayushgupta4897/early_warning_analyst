"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listRuns, AnalysisRun } from "@/lib/api";
import { RISK_BAND_COLORS } from "@/lib/types";

interface RunsSidebarProps {
  currentId: string;
  open: boolean;
  onClose: () => void;
}

export default function RunsSidebar({ currentId, open, onClose }: RunsSidebarProps) {
  const router = useRouter();
  const [runs, setRuns] = useState<AnalysisRun[]>([]);

  useEffect(() => {
    if (!open) return;
    listRuns()
      .then((data) => setRuns(data.runs))
      .catch(() => {});
    const interval = setInterval(() => {
      listRuns()
        .then((data) => setRuns(data.runs))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  const formatTime = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-full w-[320px] bg-card border-r border-card-border z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
          <h2 className="text-sm font-semibold uppercase tracking-wider">Analysis Runs</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground text-lg leading-none px-1"
          >
            &times;
          </button>
        </div>

        {/* Run List */}
        <div className="flex-1 overflow-y-auto">
          {runs.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted">No runs yet</div>
          )}
          {runs.map((run) => {
            const isCurrent = run.id === currentId;
            return (
              <button
                key={run.id}
                onClick={() => {
                  if (!isCurrent) {
                    router.push(`/analysis/${run.id}`);
                    onClose();
                  }
                }}
                className={`w-full text-left px-4 py-3 border-b border-card-border transition-colors ${
                  isCurrent
                    ? "bg-accent/10 border-l-2 border-l-accent"
                    : "hover:bg-card-hover"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isCurrent ? "text-accent" : ""}`}>
                    {run.country}
                  </span>
                  {run.status === "running" && (
                    <span className="flex items-center gap-1 text-xs text-accent">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      Running
                    </span>
                  )}
                  {run.status === "completed" && run.assessment?.risk_level && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                      style={{
                        backgroundColor: `${RISK_BAND_COLORS[run.assessment.risk_level] || "#666"}20`,
                        color: RISK_BAND_COLORS[run.assessment.risk_level] || "#666",
                      }}
                    >
                      {run.assessment.risk_level.replace("_", " ").toUpperCase()}
                    </span>
                  )}
                  {run.status === "completed" && !run.assessment?.risk_level && (
                    <span className="text-[10px] text-risk-green">Complete</span>
                  )}
                  {run.status === "failed" && (
                    <span className="text-[10px] text-risk-red-action">Failed</span>
                  )}
                </div>
                <div className="text-xs text-muted font-mono">
                  {run.id} — {run.scope} — {run.horizon}y — {formatTime(run.created_at)}
                </div>
                {run.assessment?.headline && (
                  <div className="text-xs text-muted mt-1 truncate">
                    {run.assessment.headline}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* New Analysis Button */}
        <div className="p-3 border-t border-card-border">
          <a
            href="/"
            className="block w-full py-2 text-center rounded-lg bg-accent/20 text-accent text-sm font-medium hover:bg-accent/30 transition-colors"
          >
            + New Analysis
          </a>
        </div>
      </div>
    </>
  );
}
