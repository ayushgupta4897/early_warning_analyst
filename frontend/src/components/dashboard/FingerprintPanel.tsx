"use client";
import { Constellation, RISK_BAND_COLORS } from "@/lib/types";

export default function FingerprintPanel({
  constellations,
}: {
  constellations: Constellation[];
}) {
  const fingerprintMatches = constellations.filter(
    (c) => c.fingerprint_match?.historical_case
  );

  if (fingerprintMatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-4xl mb-4 opacity-50">🔍</div>
        <h3 className="text-lg font-semibold mb-2">No Fingerprint Matches</h3>
        <p className="text-muted text-sm max-w-md">
          No current signal constellations match known pre-crisis fingerprints.
          This is generally a positive indicator — the invisible architecture of
          known crisis patterns is not detected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="text-xs uppercase tracking-wider text-muted font-semibold">
        Historical Pre-Crisis Pattern Matches
      </div>

      {fingerprintMatches.map((constellation) => {
        const fp = constellation.fingerprint_match!;
        return (
          <div
            key={constellation.id}
            className="bg-card rounded-lg border border-card-border overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-card-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">{constellation.name}</h3>
                <p className="text-xs text-muted mt-0.5">
                  {constellation.signal_ids.length} signals in this constellation
                </p>
              </div>
              <span
                className="px-3 py-1 rounded-full text-xs font-mono font-bold"
                style={{
                  backgroundColor: `${RISK_BAND_COLORS[fp.match_strength === "strong" ? "red_action" : fp.match_strength === "moderate" ? "red_watch" : "amber"]}20`,
                  color: RISK_BAND_COLORS[fp.match_strength === "strong" ? "red_action" : fp.match_strength === "moderate" ? "red_watch" : "amber"],
                }}
              >
                {fp.match_strength?.toUpperCase()} MATCH
              </span>
            </div>

            {/* Historical Case */}
            <div className="px-4 py-3 bg-card-hover border-b border-card-border">
              <div className="text-xs uppercase tracking-wider text-muted mb-1">
                Historical Analog
              </div>
              <div className="text-sm font-semibold text-accent">
                {fp.historical_case}
              </div>
            </div>

            {/* Timeline */}
            <div className="px-4 py-3 space-y-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted mb-1">
                  Historical Timeline
                </div>
                <p className="text-sm">{fp.historical_timeline}</p>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-muted mb-1">
                  Current Stage Estimate
                </div>
                <p className="text-sm font-semibold" style={{ color: "#f97316" }}>
                  {fp.current_stage_estimate}
                </p>
              </div>

              {/* Matching signals */}
              {fp.matching_signals && fp.matching_signals.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted mb-1">
                    Matching Signals
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {fp.matching_signals.map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-xs bg-accent/20 text-accent"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Divergences */}
              {fp.divergences && fp.divergences.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted mb-1">
                    Key Divergences from Historical Case
                  </div>
                  <ul className="list-disc pl-4 text-xs text-muted space-y-0.5">
                    {fp.divergences.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Constellation description */}
            <div className="px-4 py-3 border-t border-card-border text-xs text-muted">
              {constellation.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}
