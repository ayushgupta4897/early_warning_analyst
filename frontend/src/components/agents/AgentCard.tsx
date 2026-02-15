"use client";
import { AgentState } from "@/lib/types";
import { useRef, useEffect } from "react";

const statusLabels: Record<string, string> = {
  idle: "Standby",
  searching: "Searching...",
  hunting: "Hunting signals...",
  "cross-validating": "Cross-validating...",
  challenging: "Challenging...",
  synthesizing: "Synthesizing...",
  simulating: "Simulating...",
  concluded: "Analysis complete",
};

export default function AgentCard({ agent }: { agent: AgentState }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isActive = agent.status !== "idle" && agent.status !== "concluded";

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [agent.content]);

  return (
    <div
      className={`rounded-lg border transition-all duration-300 ${
        isActive ? "agent-active" : ""
      }`}
      style={{
        borderColor: isActive ? agent.color : "var(--color-card-border)",
        backgroundColor: "var(--color-card)",
        ["--glow-color" as string]: agent.color,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: agent.color }}
          />
          <span className="font-semibold text-sm">{agent.name}</span>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full font-mono"
          style={{
            backgroundColor: isActive ? `${agent.color}20` : "transparent",
            color: isActive ? agent.color : "var(--color-muted)",
          }}
        >
          {statusLabels[agent.status] || agent.status}
          {isActive && <span className="typing-cursor ml-1">|</span>}
        </span>
      </div>

      {/* Content */}
      {agent.content && (
        <div
          ref={contentRef}
          className="px-4 py-3 text-sm text-muted font-mono leading-relaxed max-h-64 overflow-y-auto"
        >
          <div className="whitespace-pre-wrap break-words">
            {agent.content.length > 2000
              ? "..." + agent.content.slice(-2000)
              : agent.content}
          </div>
        </div>
      )}

      {/* Concluded summary */}
      {agent.status === "concluded" && agent.data && (
        <div className="px-4 py-2 border-t border-card-border">
          <div className="flex items-center gap-2 text-xs" style={{ color: agent.color }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Analysis complete
          </div>
        </div>
      )}
    </div>
  );
}
