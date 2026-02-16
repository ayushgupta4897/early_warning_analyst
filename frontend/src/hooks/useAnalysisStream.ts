"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { AgentState, SSEEvent, Signal, Constellation, OverallAssessment, SynthesisData, AGENT_CONFIGS } from "@/lib/types";

const initialAgentStates: AgentState[] = AGENT_CONFIGS.map((a) => ({
  id: a.id,
  name: a.name,
  status: "idle" as const,
  color: a.color,
  content: "",
  data: null,
}));

export function useAnalysisStream(analysisId: string | null) {
  const [agents, setAgents] = useState<AgentState[]>(initialAgentStates);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [constellations, setConstellations] = useState<Constellation[]>([]);
  const [assessment, setAssessment] = useState<OverallAssessment | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fullData, setFullData] = useState<Record<string, unknown> | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!analysisId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const es = new EventSource(`${apiUrl}/api/analyze/${analysisId}/stream`);
    esRef.current = es;
    setStatus("running");

    es.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);

        switch (data.type) {
          case "agent_start":
            setAgents((prev) =>
              prev.map((a) =>
                a.id === data.agent
                  ? { ...a, status: data.status as AgentState["status"], content: "" }
                  : a
              )
            );
            break;

          case "agent_chunk":
            setAgents((prev) =>
              prev.map((a) =>
                a.id === data.agent
                  ? { ...a, content: a.content + (data.content || "") }
                  : a
              )
            );
            break;

          case "agent_complete":
            setAgents((prev) =>
              prev.map((a) =>
                a.id === data.agent
                  ? { ...a, status: "concluded" as const, data: data.data as Record<string, unknown> | null }
                  : a
              )
            );

            // Extract signals from synthesis agent
            if (data.agent === "synthesis" && data.data) {
              const synthData = data.data as unknown as SynthesisData;
              if (synthData.scored_signals) setSignals(synthData.scored_signals);
              if (synthData.constellations) setConstellations(synthData.constellations);
              if (synthData.overall_assessment) setAssessment(synthData.overall_assessment);
            }
            break;

          case "analysis_complete": {
            setStatus("complete");
            setFullData(data.data || null);

            // Extract signals/constellations/assessment from final data
            // (needed when loading cached analysis from Firebase)
            const finalData = data.data as Record<string, unknown> | undefined;
            if (finalData) {
              const agentsData = finalData.agents as Record<string, unknown> | undefined;
              if (agentsData) {
                const rawSynth = agentsData.synthesis;
                // Handle case where synthesis is a list (extraction grabbed signals array only)
                const synth: SynthesisData | undefined = Array.isArray(rawSynth)
                  ? { scored_signals: rawSynth as Signal[], constellations: [], overall_assessment: {} as OverallAssessment }
                  : (rawSynth as SynthesisData | undefined);
                if (synth) {
                  if (synth.scored_signals) setSignals(synth.scored_signals);
                  if (synth.constellations) setConstellations(synth.constellations);
                  if (synth.overall_assessment) setAssessment(synth.overall_assessment);
                }
                // Mark all agents as concluded with their data
                setAgents((prev) =>
                  prev.map((a) => {
                    const agentResult = agentsData[a.id] as Record<string, unknown> | undefined;
                    if (agentResult) {
                      return { ...a, status: "concluded" as const, data: agentResult };
                    }
                    return a;
                  })
                );
              }
            }

            es.close();
            break;
          }

          case "error":
            setError(data.message || "Unknown error");
            setStatus("error");
            es.close();
            break;
        }
      } catch (err) {
        console.error("Failed to parse SSE event:", err);
      }
    };

    es.onerror = () => {
      if (status !== "complete") {
        setStatus("error");
        setError("Connection lost");
      }
      es.close();
    };
  }, [analysisId]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
    };
  }, [connect]);

  return { agents, signals, constellations, assessment, status, error, fullData };
}
