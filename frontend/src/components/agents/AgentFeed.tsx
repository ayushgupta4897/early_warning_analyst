import { AgentState } from "@/lib/types";
import { useEffect, useRef } from "react";

// Mock Avatar since I don't want to assume ui library existence
function AgentAvatar({ name, color, icon }: { name: string; color: string; icon: string }) {
    return (
        <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
            style={{ backgroundColor: color }}
            title={name}
        >
            {name.substring(0, 2).toUpperCase()}
        </div>
    );
}

export default function AgentFeed({ agents }: { agents: AgentState[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom like a terminal/feed
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [agents]);

    // We want to show active agents and their latest outputs.
    // Since `content` is a big string, we might just show the whole thing for now, 
    // but styled as a stream.

    return (
        <div className="flex flex-col h-full bg-card/50 border-r border-card-border">
            <div className="p-3 border-b border-card-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                    Live Intelligence Feed
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth" ref={scrollRef}>
                {agents.map((agent) => (
                    agent.content && (
                        <div key={agent.id} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                            <div className="flex-shrink-0 mt-1">
                                <AgentAvatar name={agent.name} color={agent.color} icon="" />
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">{agent.name}</span>
                                    <span
                                        className="text-[9px] px-1.5 py-0.5 rounded-full border"
                                        style={{ borderColor: agent.color, color: agent.color }}
                                    >
                                        {agent.status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="text-xs text-muted leading-relaxed whitespace-pre-wrap font-mono bg-background/50 p-3 rounded-lg border border-card-border/50">
                                    {agent.content}
                                </div>
                            </div>
                        </div>
                    )
                ))}

                {agents.every(a => a.status === 'concluded' || a.status === 'idle') && (
                    <div className="text-center py-8 text-xs text-muted italic">
                        -- Analysis Session Ended --
                    </div>
                )}
            </div>
        </div>
    );
}
