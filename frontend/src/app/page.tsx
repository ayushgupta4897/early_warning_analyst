"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startAnalysis, listRuns, AnalysisRun } from "@/lib/api";
import { AnalysisConfig, DOMAIN_OPTIONS, RISK_BAND_COLORS } from "@/lib/types";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Armenia", "Australia",
  "Azerbaijan", "Bangladesh", "Belarus", "Bolivia", "Bosnia and Herzegovina", "Brazil",
  "Burkina Faso", "Cambodia", "Cameroon", "Central African Republic", "Chad", "Chile",
  "China", "Colombia", "Congo (DRC)", "Cote d'Ivoire", "Cuba", "Ecuador", "Egypt",
  "El Salvador", "Eritrea", "Ethiopia", "Georgia", "Ghana", "Guatemala", "Guinea",
  "Haiti", "Honduras", "India", "Indonesia", "Iran", "Iraq", "Israel", "Jamaica",
  "Jordan", "Kazakhstan", "Kenya", "Kyrgyzstan", "Laos", "Lebanon", "Libya",
  "Madagascar", "Malawi", "Malaysia", "Mali", "Mauritania", "Mexico", "Moldova",
  "Mongolia", "Morocco", "Mozambique", "Myanmar", "Nepal", "Nicaragua", "Niger",
  "Nigeria", "North Korea", "Pakistan", "Palestine", "Panama", "Papua New Guinea",
  "Paraguay", "Peru", "Philippines", "Russia", "Rwanda", "Saudi Arabia", "Senegal",
  "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sri Lanka", "Sudan",
  "Syria", "Tajikistan", "Tanzania", "Thailand", "Tunisia", "Turkey", "Turkmenistan",
  "Uganda", "Ukraine", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<AnalysisConfig>({
    country: "",
    country_code: "",
    scope: "national",
    department_name: "",
    horizon: 5,
    signal_count: 20,
    domains: ["economy", "infrastructure", "health", "climate", "food_water", "social_cohesion", "security", "energy"],
    custom_indicators: [],
  });
  const [customText, setCustomText] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [runs, setRuns] = useState<AnalysisRun[]>([]);

  useEffect(() => {
    listRuns()
      .then((data) => setRuns(data.runs))
      .catch(() => {});
    const interval = setInterval(() => {
      listRuns()
        .then((data) => setRuns(data.runs))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const toggleDomain = (domain: string) => {
    setConfig((prev) => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter((d) => d !== domain)
        : [...prev.domains, domain],
    }));
  };

  const handleSubmit = async () => {
    if (!config.country) return;
    setLoading(true);

    try {
      const analysisConfig = {
        ...config,
        custom_indicators: customText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const { analysis_id } = await startAnalysis(analysisConfig);
      router.push(`/analysis/${analysis_id}`);
    } catch (err) {
      console.error("Failed to start analysis:", err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full space-y-8">
          {/* Title */}
          <div className="text-center space-y-3">
            <div className="text-xs uppercase tracking-[0.3em] text-muted font-mono">
              Intelligence Platform
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Early Warning{" "}
              <span className="text-accent">Analyst</span>
            </h1>
            <p className="text-muted text-lg max-w-xl mx-auto">
              Detecting the weak signals everyone else misses — before they
              compound into crises.
            </p>
          </div>

          {/* Config Form */}
          <div className="bg-card rounded-xl border border-card-border p-6 space-y-5">
            {/* Country */}
            <div className="relative">
              <label className="text-xs uppercase tracking-wider text-muted font-semibold block mb-2">
                Country
              </label>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => {
                  setCountrySearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search for a country..."
                className="w-full bg-background border border-card-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
              />
              {showDropdown && countrySearch && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-card-border rounded-lg max-h-48 overflow-y-auto">
                  {filteredCountries.map((country) => (
                    <button
                      key={country}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-card-hover"
                      onClick={() => {
                        setConfig((prev) => ({ ...prev, country }));
                        setCountrySearch(country);
                        setShowDropdown(false);
                      }}
                    >
                      {country}
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="px-4 py-2 text-sm text-muted">No matches</div>
                  )}
                </div>
              )}
            </div>

            {/* Scope */}
            <div>
              <label className="text-xs uppercase tracking-wider text-muted font-semibold block mb-2">
                Scope
              </label>
              <div className="flex gap-2">
                <button
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    config.scope === "national"
                      ? "bg-accent text-white"
                      : "bg-background border border-card-border text-muted hover:text-foreground"
                  }`}
                  onClick={() => setConfig((prev) => ({ ...prev, scope: "national" }))}
                >
                  National
                </button>
                <button
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    config.scope === "department"
                      ? "bg-accent text-white"
                      : "bg-background border border-card-border text-muted hover:text-foreground"
                  }`}
                  onClick={() => setConfig((prev) => ({ ...prev, scope: "department" }))}
                >
                  Department
                </button>
              </div>
              {config.scope === "department" && (
                <input
                  type="text"
                  value={config.department_name || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, department_name: e.target.value }))
                  }
                  placeholder="e.g., Ministry of Health"
                  className="mt-2 w-full bg-background border border-card-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent"
                />
              )}
            </div>

            {/* Domains */}
            <div>
              <label className="text-xs uppercase tracking-wider text-muted font-semibold block mb-2">
                Priority Domains
              </label>
              <div className="flex flex-wrap gap-2">
                {DOMAIN_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      config.domains.includes(d.value)
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-background border border-card-border text-muted hover:text-foreground"
                    }`}
                    onClick={() => toggleDomain(d.value)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted font-semibold block mb-2">
                  Time Horizon: {config.horizon} years
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={config.horizon}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, horizon: parseInt(e.target.value) }))
                  }
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>1yr</span>
                  <span>10yr</span>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted font-semibold block mb-2">
                  Signal Count: {config.signal_count}
                </label>
                <input
                  type="range"
                  min={10}
                  max={40}
                  step={5}
                  value={config.signal_count}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      signal_count: parseInt(e.target.value),
                    }))
                  }
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>10</span>
                  <span>40</span>
                </div>
              </div>
            </div>

            {/* Custom Indicators */}
            <div>
              <label className="text-xs uppercase tracking-wider text-muted font-semibold block mb-2">
                Custom Indicators (optional)
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={"One per line, e.g.\nMonsoon-dependent crop insurance claims\nDistrict-level teacher vacancy rates"}
                rows={3}
                className="w-full bg-background border border-card-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!config.country || loading}
              className="w-full py-3 rounded-lg bg-accent text-white font-semibold text-sm disabled:opacity-50 hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Initializing Agents...
                </span>
              ) : (
                "Run Analysis"
              )}
            </button>
          </div>

          {/* Previous Runs */}
          {runs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm uppercase tracking-wider text-muted font-semibold">
                Previous Runs
              </h2>
              <div className="space-y-2">
                {runs.map((run) => (
                  <button
                    key={run.id}
                    onClick={() => router.push(`/analysis/${run.id}`)}
                    className="w-full bg-card rounded-lg border border-card-border p-4 flex items-center justify-between hover:border-accent/40 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-sm font-medium">{run.country}</div>
                        <div className="text-xs text-muted font-mono">
                          {run.id} — {run.scope} — {run.horizon}y — {run.signal_count} signals
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {run.assessment?.headline && (
                        <span className="text-xs text-muted max-w-[200px] truncate hidden sm:block">
                          {run.assessment.headline}
                        </span>
                      )}
                      {run.status === "running" && (
                        <span className="flex items-center gap-1.5 text-xs text-accent">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                          Running
                        </span>
                      )}
                      {run.status === "completed" && run.assessment?.risk_level && (
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
                          style={{
                            backgroundColor: `${RISK_BAND_COLORS[run.assessment.risk_level] || "#666"}20`,
                            color: RISK_BAND_COLORS[run.assessment.risk_level] || "#666",
                          }}
                        >
                          {run.assessment.risk_level.replace("_", " ").toUpperCase()}
                        </span>
                      )}
                      {run.status === "completed" && !run.assessment?.risk_level && (
                        <span className="text-xs text-risk-green">Complete</span>
                      )}
                      {run.status === "failed" && (
                        <span className="text-xs text-risk-red-action">Failed</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted">
            Powered by Claude Opus 4.6 — Multi-agent weak signal intelligence
          </div>
        </div>
      </div>
    </div>
  );
}
