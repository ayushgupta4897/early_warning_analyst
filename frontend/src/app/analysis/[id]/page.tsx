"use client";
import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAnalysisStream } from "@/hooks/useAnalysisStream";
import { deleteAnalysis } from "@/lib/api";
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("signals");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAnalysis(id, deletePassword);
      router.push("/");
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }, [id, deletePassword, router]);

  useEffect(() => {
    if (!showDeleteModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDeleteModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showDeleteModal]);

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
          <button
            onClick={() => { setShowDeleteModal(true); setDeletePassword(""); setDeleteError(""); }}
            className="text-muted hover:text-risk-red-action transition-colors"
            title="Delete analysis"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-card border border-card-border rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-foreground font-semibold text-lg mb-2">Delete Analysis</h3>
            <p className="text-muted text-sm mb-4">
              This will permanently delete this analysis and all associated data. Enter the password to confirm.
            </p>
            <input
              type="password"
              placeholder="Password"
              value={deletePassword}
              onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter" && deletePassword) handleDelete(); }}
              className="w-full px-3 py-2 rounded-md bg-background border border-card-border text-foreground text-sm focus:outline-none focus:border-accent mb-2"
              autoFocus
            />
            {deleteError && (
              <p className="text-risk-red-action text-xs mb-2">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !deletePassword}
                className="px-4 py-2 text-sm bg-risk-red-action/20 text-risk-red-action hover:bg-risk-red-action/30 rounded-md transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
