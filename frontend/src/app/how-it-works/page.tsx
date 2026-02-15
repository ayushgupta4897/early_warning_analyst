"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/* ─── Scroll-reveal hook ─── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll(
      ".reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children"
    );
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ─── Data ─── */

const AGENTS = [
  {
    name: "Signal Hunter",
    color: "#3b82f6",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    personality: "Pattern-obsessed. Sees connections others miss.",
    quote:
      "I don't care that it looks like noise. Three independent data types are whispering the same thing — and whispers precede screams.",
    role: "Hunts for non-obvious signals across OSINT, alt-data, local-language media, procurement anomalies, satellite proxies, and supply chain micro-shifts.",
  },
  {
    name: "Corroboration Agent",
    color: "#10b981",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    personality: "Methodical triangulator. Obsessed with independent confirmation.",
    quote:
      "One article isn't evidence. One data type isn't proof. Show me satellite + procurement + social media all pointing the same direction — then we talk.",
    role: "Cross-validates each signal through 12+ independent data modalities. Multi-modal corroboration is worth 10x single-source confirmation.",
  },
  {
    name: "Devil's Advocate",
    color: "#ef4444",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    personality: "The smartest skeptic in the room.",
    quote:
      "Before you panic — is this just seasonal? Is the base rate higher than you think? Could a policy change explain this perfectly? I need to try to kill this signal before I let it through.",
    role: "Constructs the strongest mundane explanation for every signal. Checks base rates, cognitive biases, alternative causation, and data quality.",
  },
  {
    name: "Synthesis Agent",
    color: "#a855f7",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    personality: "Sees the forest. Comfortable with uncertainty.",
    quote:
      "Individually, each signal is dismissible. But these six signals spanning four domains, matching a pattern we've seen before in three historical cases? That's not noise. That's architecture.",
    role: "Maps signal constellations, matches against pre-crisis historical fingerprints, scores risk, and identifies cascade paths with confidence-weighted timelines.",
  },
];

const TIMELINE_STEPS = [
  {
    agent: "Context Discovery",
    color: "#f59e0b",
    action: "Builds the baseline",
    detail:
      "Establishes what \"normal\" looks like — GDP structure, demographics, governance quality, climate exposure, logistics dependencies. Because weak signals are deviations from baseline, you need to know what normal is first.",
  },
  {
    agent: "Signal Hunter",
    color: "#3b82f6",
    action: "Hunts for anomalies",
    detail:
      "Searches 13 domains for 10–40 subtle anomalies using live web intelligence. Not headline risks — the things buried in tender portals, satellite feeds, job boards, and local-language forums.",
  },
  {
    agent: "Corroboration Agent",
    color: "#10b981",
    action: "Triangulates evidence",
    detail:
      "For every signal, finds independent confirmation from a different data modality. Social media + satellite + procurement data all pointing the same direction transforms suspicion into evidence.",
  },
  {
    agent: "Devil's Advocate",
    color: "#ef4444",
    action: "Tries to kill every signal",
    detail:
      "Applies rigorous skepticism: seasonal patterns, base rate fallacies, confirmation bias, data quality issues, alternative explanations. Only signals that survive the smartest skeptic proceed.",
  },
  {
    agent: "Synthesis Agent",
    color: "#a855f7",
    action: "Maps the constellation",
    detail:
      "Surviving signals are mapped into clusters. These constellations are matched against pre-crisis fingerprints from 6 historical cases. When the pattern matches — that's the highest-value warning possible.",
  },
];

const SRI_LANKA_SIGNALS = [
  { signal: "Organic farming mandate signals", effect: "Agricultural input imports collapsed", delay: "18 months before" },
  { signal: "Tourism structural dependency", effect: "Revenue base eroding beneath stable headline GDP", delay: "16 months before" },
  { signal: "Forex reserve composition shifts", effect: "Drawing on swaps, masking true reserve depletion", delay: "14 months before" },
  { signal: "District-level economic divergence", effect: "Rural economy hollowing while Colombo held steady", delay: "12 months before" },
  { signal: "Professional emigration acceleration", effect: "Nurses and doctors registering abroad at 3x normal rate", delay: "10 months before" },
  { signal: "Government communication shifts", effect: "Defensiveness, scapegoating, frequency spikes in official messaging", delay: "8 months before" },
];

export default function HowItWorks() {
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef} className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-card-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-muted hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="text-xs font-mono tracking-widest text-muted uppercase">
              EWA
            </span>
          </div>
          <Link
            href="/"
            className="text-xs text-accent hover:text-accent/80 transition-colors font-medium"
          >
            Run Analysis
          </Link>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow" />
        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-20">
          <div className="reveal space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Multi-Agent Intelligence System
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              The signals that{" "}
              <span className="text-accent">precede</span> crises are always
              visible in retrospect.
            </h1>
            <p className="text-xl text-muted leading-relaxed">
              We make them visible{" "}
              <span className="text-foreground font-semibold">in real-time.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ THE PROBLEM ═══════════ */}
      <section className="relative py-28 section-glow-red">
        <div className="max-w-4xl mx-auto px-6">
          <div className="reveal space-y-4 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              The Problem
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              By the time a crisis makes headlines,{" "}
              <span className="text-muted">early warning is worthless.</span>
            </h2>
          </div>

          <div className="mt-16 grid md:grid-cols-2 gap-6">
            {/* What everyone watches */}
            <div className="reveal-left">
              <div className="bg-card rounded-2xl border border-card-border p-8 h-full">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-red-400/80 mb-6">
                  What everyone watches
                </h3>
                <div className="stagger-children space-y-4">
                  {[
                    "GDP contracting",
                    "Currency in freefall",
                    "Sovereign credit downgrade",
                    "Inflation spiking to double digits",
                    "Mass protests on international news",
                  ].map((s) => (
                    <div key={s} className="flex items-center gap-3">
                      <span className="text-red-400/40 text-lg">&#x2717;</span>
                      <span className="text-muted/50 line-through text-sm">{s}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-8 text-xs text-muted/40 leading-relaxed">
                  Every government, hedge fund, and rating agency already knows.
                  The crisis is already here. This is not early warning.
                </p>
              </div>
            </div>

            {/* What EWA detects */}
            <div className="reveal-right">
              <div className="bg-card rounded-2xl border border-accent/20 p-8 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-accent mb-6">
                  What EWA detects
                </h3>
                <div className="stagger-children space-y-5">
                  {[
                    {
                      signal: "Tender cancellation rates quietly doubling",
                      why: "The state is running out of cash before the budget says so",
                    },
                    {
                      signal: "Night-shift job postings spiking 40%",
                      why: "Factories filling panic-buying orders months before trade data reflects it",
                    },
                    {
                      signal: "Satellite night-lights dimming in secondary cities",
                      why: "Economy hollowing from the periphery inward — a classic pre-crisis spatial pattern",
                    },
                    {
                      signal: "Central bank governor's vocabulary shifting",
                      why: "Linguistic stress markers 3–6 months before a policy pivot",
                    },
                    {
                      signal: "Teacher and nurse emigration quietly accelerating",
                      why: "Middle-class flight visible in visa forums before it shows in official stats",
                    },
                    {
                      signal: "Port dwell times gradually increasing",
                      why: "Bureaucratic paralysis or extraction that no corruption index captures",
                    },
                  ].map((s) => (
                    <div key={s.signal}>
                      <div className="text-sm font-medium text-foreground">{s.signal}</div>
                      <div className="text-xs text-muted/70 mt-0.5">{s.why}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Key insight callout */}
          <div className="reveal mt-12">
            <div className="bg-accent/5 border border-accent/15 rounded-2xl p-8 text-center max-w-2xl mx-auto">
              <p className="text-lg text-foreground leading-relaxed">
                Each signal alone is explainable as noise. It&apos;s the{" "}
                <span className="text-accent font-bold">combination and trajectory</span>{" "}
                across domains that reveals the emerging risk.
              </p>
              <p className="text-sm text-muted mt-3">
                This is what humans are terrible at — and what a multi-agent AI system can do.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ THE PIPELINE ═══════════ */}
      <section className="relative py-28 section-glow-blue">
        <div className="max-w-4xl mx-auto px-6">
          <div className="reveal space-y-4 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              The Pipeline
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Five agents. One adversarial debate.{" "}
              <span className="text-accent">Zero blind spots.</span>
            </h2>
            <p className="text-muted leading-relaxed">
              Not a single prompt to a single model. A full analytical workflow
              where specialized agents hunt, validate, challenge, and synthesize
              — and you watch the entire debate unfold in real-time.
            </p>
          </div>

          {/* Vertical timeline */}
          <div className="mt-16 relative">
            {/* Connecting line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-card-border" />

            <div className="space-y-2">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={step.agent} className="reveal relative pl-14">
                  {/* Dot */}
                  <div
                    className="absolute left-2.5 top-6 w-[14px] h-[14px] rounded-full border-2"
                    style={{
                      borderColor: step.color,
                      backgroundColor: `color-mix(in srgb, ${step.color} 25%, transparent)`,
                    }}
                  />

                  <div
                    className="bg-card rounded-2xl border border-card-border p-6 hover:border-opacity-60 transition-all"
                    style={{ "--glow": step.color } as React.CSSProperties}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-mono text-muted/50">
                        0{i}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: step.color }}
                      >
                        {step.agent}
                      </span>
                      <span className="text-xs text-muted">
                        {step.action}
                      </span>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ AGENT DEEP DIVE ═══════════ */}
      <section className="relative py-28 section-glow-purple">
        <div className="max-w-4xl mx-auto px-6">
          <div className="reveal space-y-4 text-center max-w-xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              The Agents
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Their debate{" "}
              <span className="text-accent">is</span> the product.
            </h2>
            <p className="text-muted leading-relaxed">
              Like eavesdropping on an intelligence briefing between four brilliant
              analysts who disagree with each other.
            </p>
          </div>

          <div className="mt-16 space-y-6">
            {AGENTS.map((agent, i) => (
              <div
                key={agent.name}
                className={i % 2 === 0 ? "reveal-left" : "reveal-right"}
              >
                <div
                  className="agent-card-glow bg-card rounded-2xl border border-card-border p-8 relative overflow-hidden"
                  style={{ "--glow": agent.color } as React.CSSProperties}
                >
                  {/* Subtle background glow */}
                  <div
                    className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-[0.04]"
                    style={{ backgroundColor: agent.color }}
                  />

                  <div className="relative flex flex-col md:flex-row gap-6">
                    {/* Left: identity */}
                    <div className="md:w-56 shrink-0 space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `color-mix(in srgb, ${agent.color} 15%, transparent)` }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke={agent.color} viewBox="0 0 24 24" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={agent.icon} />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">{agent.name}</h3>
                          <p className="text-xs text-muted">{agent.personality}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: content */}
                    <div className="flex-1 space-y-4">
                      <blockquote
                        className="text-sm leading-relaxed italic border-l-2 pl-4"
                        style={{ borderColor: agent.color, color: `color-mix(in srgb, ${agent.color} 70%, white)` }}
                      >
                        &ldquo;{agent.quote}&rdquo;
                      </blockquote>
                      <p className="text-sm text-muted leading-relaxed">
                        {agent.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HISTORICAL FINGERPRINTS ═══════════ */}
      <section className="relative py-28 section-glow-red">
        <div className="max-w-4xl mx-auto px-6">
          <div className="reveal space-y-4 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Historical Fingerprints
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              We&apos;ve seen this movie before —{" "}
              <span className="text-accent">and we know the early scenes.</span>
            </h2>
            <p className="text-muted leading-relaxed">
              The system doesn&apos;t match on the crisis. It matches on the invisible
              pre-crisis fingerprint — the pattern from when nobody thought it was a crisis yet.
            </p>
          </div>

          {/* Sri Lanka case study */}
          <div className="reveal mt-16">
            <div className="bg-card rounded-2xl border border-card-border overflow-hidden">
              {/* Case header */}
              <div className="px-8 py-6 border-b border-card-border bg-card-hover/30">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-risk-red-action/10 text-risk-red-action text-xs font-bold">
                    CASE STUDY
                  </span>
                  <h3 className="text-lg font-bold">Sri Lanka</h3>
                  <span className="text-sm text-muted">
                    Sovereign Default — April 2022
                  </span>
                </div>
                <p className="text-sm text-muted mt-3 max-w-2xl">
                  In mid-2021, GDP growth was positive. Markets were calm. The credit
                  rating was stable. No major international alarm. But underneath the
                  surface, these signals were forming a constellation:
                </p>
              </div>

              {/* Signal timeline */}
              <div className="p-8">
                <div className="stagger-children space-y-0">
                  {SRI_LANKA_SIGNALS.map((item, i) => (
                    <div key={item.signal} className="flex gap-4 group">
                      {/* Timeline */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-3 h-3 rounded-full bg-accent/80 ring-4 ring-accent/10" />
                        {i < SRI_LANKA_SIGNALS.length - 1 && (
                          <div className="w-px flex-1 bg-accent/20 my-1" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="pb-8">
                        <div className="text-xs font-mono text-accent/60 mb-1">
                          {item.delay}
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {item.signal}
                        </div>
                        <div className="text-xs text-muted mt-1">
                          {item.effect}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Punchline */}
              <div className="px-8 py-6 border-t border-card-border bg-accent/[0.03]">
                <p className="text-sm text-foreground leading-relaxed max-w-2xl">
                  <span className="text-accent font-bold">18 months</span> of
                  invisible warning. The system matches this fingerprint — not the
                  default itself. When a country today shows the same early pattern,
                  that&apos;s the signal no rating agency, no headline, and no dashboard
                  will give you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SCORING ═══════════ */}
      <section className="relative py-28">
        <div className="max-w-4xl mx-auto px-6">
          <div className="reveal space-y-4 text-center max-w-xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Risk Scoring
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              From signal to severity
            </h2>
            <p className="text-muted leading-relaxed">
              Every signal is scored on three dimensions, then classified into a risk band
              that tells you exactly how to respond.
            </p>
          </div>

          {/* Dimensions */}
          <div className="reveal mt-12 grid sm:grid-cols-3 gap-4">
            {[
              {
                name: "Impact",
                score: "0–100",
                icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
                desc: "Potential scale of consequence if this signal materializes. Assesses damage breadth and severity.",
              },
              {
                name: "Lead-time",
                score: "0–100",
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                desc: "How early we're catching this. Earlier detection = higher value = higher score.",
              },
              {
                name: "Reliability",
                score: "0–100",
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                desc: "Cross-modal corroboration strength, data quality, and survival through Devil's Advocate scrutiny.",
              },
            ].map((d) => (
              <div
                key={d.name}
                className="bg-card rounded-2xl border border-card-border p-6 text-center space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={d.icon} />
                  </svg>
                </div>
                <div className="text-sm font-bold">{d.name}</div>
                <div className="text-xs text-muted leading-relaxed">{d.desc}</div>
              </div>
            ))}
          </div>

          {/* Risk bands */}
          <div className="reveal mt-12 space-y-3">
            {[
              { label: "GREEN", range: "0–39", meaning: "Monitor — interesting weak signal, not yet concerning", color: "#22c55e", width: "39%" },
              { label: "AMBER", range: "40–59", meaning: "Watch — corroborated cluster, warrants dedicated attention", color: "#eab308", width: "59%" },
              { label: "RED-WATCH", range: "60–74", meaning: "Emerging — matches historical pre-crisis fingerprints", color: "#f97316", width: "74%" },
              { label: "RED-ACTION", range: "75+", meaning: "Critical — this pattern has historically led to crisis", color: "#ef4444", width: "92%" },
            ].map((band) => (
              <div
                key={band.label}
                className="bg-card rounded-xl border border-card-border p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-mono font-black tracking-wider"
                      style={{ color: band.color }}
                    >
                      {band.label}
                    </span>
                    <span className="text-xs text-muted/50 font-mono">{band.range}</span>
                  </div>
                  <span className="text-xs text-muted">{band.meaning}</span>
                </div>
                {/* Visual bar */}
                <div className="h-1.5 bg-card-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: band.width, backgroundColor: band.color, opacity: 0.7 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="relative py-28 hero-glow">
        <div className="max-w-4xl mx-auto px-6">
          <div className="reveal-scale text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              The next crisis is already forming.
              <br />
              <span className="text-accent">The signals are already there.</span>
            </h2>
            <p className="text-lg text-muted max-w-xl mx-auto">
              You just need to know where to look.
            </p>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-block px-10 py-4 rounded-xl bg-accent text-white font-bold text-base hover:bg-accent/90 transition-all hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-0.5"
              >
                Run an Analysis
              </Link>
            </div>
            <p className="text-xs text-muted/40 pt-4">
              Powered by Claude Opus 4.6 — Multi-agent weak signal intelligence
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
