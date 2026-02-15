"use client";
import { AgentState } from "@/lib/types";
import AgentCard from "./AgentCard";

export default function AgentDebatePanel({ agents }: { agents: AgentState[] }) {
  const activeAgent = agents.find(
    (a) => a.status !== "idle" && a.status !== "concluded"
  );
  const completedCount = agents.filter((a) => a.status === "concluded").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Agent Debate
        </h2>
        <span className="text-xs text-muted font-mono">
          {completedCount}/{agents.length} agents complete
        </span>
      </div>

      {/* Agent Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Status Bar */}
      {activeAgent && (
        <div
          className="px-4 py-2 border-t text-xs font-mono"
          style={{
            borderColor: activeAgent.color,
            color: activeAgent.color,
            backgroundColor: `${activeAgent.color}10`,
          }}
        >
          {activeAgent.name} is analyzing...
        </div>
      )}
    </div>
  );
}
