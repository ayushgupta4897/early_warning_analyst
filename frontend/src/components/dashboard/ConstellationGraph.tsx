"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Signal, Constellation, RISK_BAND_COLORS } from "@/lib/types";

// Dynamic import to avoid SSR issues with react-force-graph-2d
import dynamic from "next/dynamic";
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface GraphNode {
  id: string;
  name: string;
  val: number; // node size
  color: string;
  domain: string;
  overall: number;
  risk_band: string;
}

interface GraphLink {
  source: string;
  target: string;
  value: number; // link strength
}

export default function ConstellationGraph({
  signals,
  constellations,
}: {
  signals: Signal[];
  constellations: Constellation[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height: Math.max(height, 400) });
    }
  }, []);

  // Build graph data from signals and constellations
  const nodes: GraphNode[] = signals.map((s) => ({
    id: s.signal_id,
    name: s.name,
    val: Math.max(3, (s.scores.overall || 50) / 10),
    color: RISK_BAND_COLORS[s.risk_band] || "#666",
    domain: s.domain,
    overall: s.scores.overall || 0,
    risk_band: s.risk_band,
  }));

  const links: GraphLink[] = [];
  constellations.forEach((c) => {
    // Create links between all signals in a constellation
    for (let i = 0; i < c.signal_ids.length; i++) {
      for (let j = i + 1; j < c.signal_ids.length; j++) {
        if (
          signals.some((s) => s.signal_id === c.signal_ids[i]) &&
          signals.some((s) => s.signal_id === c.signal_ids[j])
        ) {
          links.push({
            source: c.signal_ids[i],
            target: c.signal_ids[j],
            value: c.category === "fingerprint_match" ? 3 : c.category === "correlated_cluster" ? 2 : 1,
          });
        }
      }
    }
  });

  const nodeCanvasObject = useCallback(
    (node: GraphNode & { x: number; y: number }, ctx: CanvasRenderingContext2D) => {
      const radius = node.val;

      // Draw glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI);
      ctx.fillStyle = `${node.color}30`;
      ctx.fill();

      // Draw node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = `${node.color}80`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw label
      ctx.font = "3px sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.textAlign = "center";
      ctx.fillText(node.name, node.x, node.y + radius + 5);
    },
    []
  );

  if (signals.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        Constellation map will appear after analysis completes
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] relative">
      <ForceGraph2D
        graphData={{ nodes, links }}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="transparent"
        nodeCanvasObject={nodeCanvasObject as any}
        linkColor={() => "#1e1e2e"}
        linkWidth={(link: any) => link.value || 1}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={(link: any) => link.value || 1}
        linkDirectionalParticleColor={() => "#3b82f640"}
        cooldownTime={3000}
        nodeLabel={(node: any) =>
          `${node.name}\nScore: ${node.overall}\nDomain: ${node.domain}`
        }
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm rounded-lg p-3 border border-card-border text-xs space-y-1">
        {Object.entries(RISK_BAND_COLORS).map(([band, color]) => (
          <div key={band} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-muted capitalize">{band.replace("_", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
