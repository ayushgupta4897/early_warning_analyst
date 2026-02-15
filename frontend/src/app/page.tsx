"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { startAnalysis, listRuns, AnalysisRun } from "@/lib/api";
import { AnalysisConfig, DOMAIN_OPTIONS, RISK_BAND_COLORS } from "@/lib/types";
import { COUNTRIES, Country } from "@/lib/countries";
import dynamic from "next/dynamic";

const GlobeHero = dynamic(() => import("@/components/GlobeHero"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-[420px] mx-auto aspect-square flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
    </div>
  ),
});

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
    domains: [
      "economy",
      "infrastructure",
      "health",
      "climate",
      "food_water",
      "social_cohesion",
      "security",
      "energy",
    ],
    custom_indicators: [],
  });
  const [customText, setCustomText] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const toggleDomain = (domain: string) => {
    setConfig((prev) => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter((d) => d !== domain)
        : [...prev.domains, domain],
    }));
  };

  const handleSelectCountry = (country: Country) => {
    setConfig((prev) => ({
      ...prev,
      country: country.name,
      country_code: country.code,
    }));
    setCountrySearch(country.name);
    setSelectedCountry(country);
    setShowDropdown(false);
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
    <div className="min-h-screen flex flex-col hero-glow">
      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="text-xs font-mono tracking-widest text-muted uppercase">
          EWA
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          History
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="max-w-lg w-full space-y-6">
          {/* Globe */}
          <GlobeHero
            selectedCountry={
              selectedCountry
                ? { lat: selectedCountry.lat, lng: selectedCountry.lng }
                : null
            }
          />

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Early Warning{" "}
              <span className="text-accent">Analyst</span>
            </h1>
            <p className="text-muted text-sm max-w-md mx-auto">
              Detecting the weak signals everyone else misses — before they
              compound into crises.
            </p>
          </div>

          {/* Country Search */}
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => {
                  setCountrySearch(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) {
                    setSelectedCountry(null);
                    setConfig((prev) => ({
                      ...prev,
                      country: "",
                      country_code: "",
                    }));
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search for a country..."
                className="w-full bg-card border border-card-border rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-all placeholder:text-muted/60"
              />
            </div>
            {showDropdown && countrySearch && (
              <div className="absolute z-50 w-full mt-1.5 bg-card border border-card-border rounded-xl max-h-56 overflow-y-auto shadow-2xl shadow-black/40">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-card-hover transition-colors first:rounded-t-xl last:rounded-b-xl"
                    onClick={() => handleSelectCountry(country)}
                  >
                    {country.name}
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-4 py-3 text-sm text-muted">
                    No countries found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Run Analysis CTA */}
          <button
            onClick={handleSubmit}
            disabled={!config.country || loading}
            className="w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm disabled:opacity-40 hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/20 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Initializing Agents...
              </span>
            ) : (
              "Run Analysis"
            )}
          </button>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center gap-2 text-xs text-muted hover:text-foreground transition-colors py-1"
          >
            <svg
              className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            Advanced Options
          </button>

          {/* Advanced Options (Collapsed) */}
          {showAdvanced && (
            <div className="bg-card rounded-xl border border-card-border p-5 space-y-5 animate-in">
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
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, scope: "national" }))
                    }
                  >
                    National
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      config.scope === "department"
                        ? "bg-accent text-white"
                        : "bg-background border border-card-border text-muted hover:text-foreground"
                    }`}
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, scope: "department" }))
                    }
                  >
                    Department
                  </button>
                </div>
                {config.scope === "department" && (
                  <input
                    type="text"
                    value={config.department_name || ""}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        department_name: e.target.value,
                      }))
                    }
                    placeholder="e.g., Ministry of Health"
                    className="mt-2 w-full bg-background border border-card-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent/60"
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
                    Horizon: {config.horizon}y
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={config.horizon}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        horizon: parseInt(e.target.value),
                      }))
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
                    Signals: {config.signal_count}
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
                  Custom Indicators
                </label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={
                    "One per line, e.g.\nMonsoon-dependent crop insurance claims\nDistrict-level teacher vacancy rates"
                  }
                  rows={3}
                  className="w-full bg-background border border-card-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent/60 resize-none"
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted/60 pt-4">
            Powered by Claude Opus 4.6 — Multi-agent weak signal intelligence
          </div>
        </div>
      </main>

      {/* Runs Sidebar */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-80 bg-card border-l border-card-border z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
              <h2 className="text-sm font-semibold">Previous Runs</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-muted hover:text-foreground"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => {
                    setSidebarOpen(false);
                    router.push(`/analysis/${run.id}`);
                  }}
                  className="w-full bg-background rounded-lg border border-card-border p-3 hover:border-accent/40 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{run.country}</span>
                    {run.status === "running" && (
                      <span className="flex items-center gap-1 text-xs text-accent">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        Running
                      </span>
                    )}
                    {run.status === "completed" &&
                      run.assessment?.risk_level && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-mono font-bold"
                          style={{
                            backgroundColor: `${RISK_BAND_COLORS[run.assessment.risk_level] || "#666"}20`,
                            color:
                              RISK_BAND_COLORS[run.assessment.risk_level] ||
                              "#666",
                          }}
                        >
                          {run.assessment.risk_level
                            .replace("_", " ")
                            .toUpperCase()}
                        </span>
                      )}
                    {run.status === "failed" && (
                      <span className="text-xs text-red-400">Failed</span>
                    )}
                  </div>
                  <div className="text-xs text-muted font-mono">
                    {run.id} — {run.scope} — {run.horizon}y
                  </div>
                  {run.assessment?.headline && (
                    <div className="text-xs text-muted mt-1 truncate">
                      {run.assessment.headline}
                    </div>
                  )}
                </button>
              ))}
              {runs.length === 0 && (
                <div className="text-center text-sm text-muted py-8">
                  No previous runs
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
