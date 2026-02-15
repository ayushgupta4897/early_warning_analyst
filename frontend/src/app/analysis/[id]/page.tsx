"use client";
import { use, useState } from "react";
import { useAnalysisStream } from "@/hooks/useAnalysisStream";
import AgentDebatePanel from "@/components/agents/AgentDebatePanel";
import RiskSignalTable from "@/components/dashboard/RiskSignalTable";
import ConstellationGraph from "@/components/dashboard/ConstellationGraph";
import FingerprintPanel from "@/components/dashboard/FingerprintPanel";
import WhatIfPanel from "@/components/dashboard/WhatIfPanel";
import RunsSidebar from "@/components/RunsSidebar";
import { RISK_BAND_COLORS } from "@/lib/types";

type Tab = "constellation" | "signals" | "fingerprints" | "whatif";

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { agents, signals, constellations, assessment, status, error } = useAnalysisStream(id);
  const [activeTab, setActiveTab] = useState<Tab>("signals");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs: { key: Tab; label: string }[] = [
    { key: "constellation", label: "Constellation Map" },
    { key: "signals", label: `Signals (${signals.length})` },
    { key: "fingerprints", label: "Fingerprints" },
    { key: "whatif", label: "What-If" },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Runs Sidebar */}
      <RunsSidebar currentId={id} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-card-border bg-card">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted hover:text-foreground transition-colors"
            title="View all runs"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <a href="/" className="text-accent font-bold text-sm hover:underline">
            EWA
          </a>
          <span className="text-muted text-xs font-mono">Analysis: {id}</span>
          {status === "running" && (
            <span className="flex items-center gap-1.5 text-xs text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Running
            </span>
          )}
          {status === "complete" && (
            <span className="flex items-center gap-1.5 text-xs text-risk-green">
              <span className="w-1.5 h-1.5 rounded-full bg-risk-green" />
              Complete
            </span>
          )}
          {status === "error" && (
            <span className="text-xs text-risk-red-action">{error}</span>
          )}
        </div>

        {/* Overall Assessment Badge */}
        {assessment && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted max-w-xs truncate">
              {assessment.headline}
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor: `${RISK_BAND_COLORS[assessment.risk_level] || "#666"}20`,
                color: RISK_BAND_COLORS[assessment.risk_level] || "#666",
              }}
            >
              {assessment.risk_level?.replace("_", " ").toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Agent Debate Panel */}
        <div className="w-[420px] border-r border-card-border overflow-hidden flex flex-col bg-card/50">
          <AgentDebatePanel agents={agents} />
        </div>

        {/* Right: Dashboard Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Bar */}
          <div className="flex border-b border-card-border">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`px-5 py-3 text-sm transition-colors ${
                  activeTab === tab.key
                    ? "text-accent border-b-2 border-accent"
                    : "text-muted hover:text-foreground"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "constellation" && (
              <ConstellationGraph signals={signals} constellations={constellations} />
            )}
            {activeTab === "signals" && <RiskSignalTable signals={signals} />}
            {activeTab === "fingerprints" && (
              <FingerprintPanel constellations={constellations} />
            )}
            {activeTab === "whatif" && <WhatIfPanel analysisId={id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
