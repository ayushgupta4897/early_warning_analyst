import json
import time
import logging
import asyncio
from typing import AsyncGenerator

from backend.agents.prompts import (
    COUNTRY_CONTEXT_SYSTEM,
    SIGNAL_HUNTER_SYSTEM,
    CORROBORATION_SYSTEM,
    DEVILS_ADVOCATE_SYSTEM,
    SYNTHESIS_SYSTEM,
    WHAT_IF_SYSTEM,
)
from backend.agents.schemas import SSEEvent
from backend.services.claude_client import stream_agent_response, extract_json_from_response
from backend.services.scoring import compute_scores
from backend.models.analysis import AnalysisConfig

logger = logging.getLogger("ewa.orchestrator")


async def run_analysis_pipeline(config: AnalysisConfig) -> AsyncGenerator[str, None]:
    """Run the full 5-agent pipeline, yielding SSE events."""

    pipeline_start = time.time()
    logger.info("=" * 60)
    logger.info(f"[Pipeline] Starting analysis for {config.country}")
    logger.info(f"[Pipeline] Scope: {config.scope}, Horizon: {config.horizon}y, Signals: {config.signal_count}")
    logger.info(f"[Pipeline] Domains: {config.domains}")
    if config.custom_indicators:
        logger.info(f"[Pipeline] Custom indicators: {config.custom_indicators}")
    logger.info("=" * 60)

    domains_str = ", ".join(config.domains)
    scope_str = f"department: {config.department_name}" if config.department_name else "national"
    custom_str = ""
    if config.custom_indicators:
        custom_str = f"\n\nAdditional country-specific weak signal indicators to investigate:\n" + "\n".join(f"- {i}" for i in config.custom_indicators)

    # Accumulate outputs from each agent for passing to next
    country_context = ""
    signal_hunter_output = ""
    corroboration_output = ""
    devils_advocate_output = ""

    # ── Agent 0: Country Context Discovery ──
    agent_start = time.time()
    logger.info("[Agent 0/4] CONTEXT DISCOVERY — Starting for %s", config.country)
    yield SSEEvent(type="agent_start", agent="context", status="searching").to_sse()

    context_prompt = f"""Establish the baseline profile for {config.country} (scope: {scope_str}).
Use web search to gather current, real data. Be thorough and specific.
Time horizon for analysis: {config.horizon} years.
Priority domains: {domains_str}"""

    async for event in stream_agent_response(COUNTRY_CONTEXT_SYSTEM, context_prompt, use_web_search=True):
        if event["type"] == "chunk":
            yield SSEEvent(type="agent_chunk", agent="context", content=event["content"]).to_sse()
        elif event["type"] == "complete":
            country_context = event["content"]

    context_json = extract_json_from_response(country_context)
    yield SSEEvent(type="agent_complete", agent="context", data=context_json).to_sse()
    logger.info("[Agent 0/4] CONTEXT DISCOVERY — Complete (%.1fs, %d chars, JSON: %s)",
                time.time() - agent_start, len(country_context), "OK" if context_json else "FAILED")

    # ── Agent 1: Signal Hunter ──
    agent_start = time.time()
    logger.info("[Agent 1/4] SIGNAL HUNTER — Hunting %d weak signals", config.signal_count)
    yield SSEEvent(type="agent_start", agent="signal_hunter", status="hunting").to_sse()

    signal_prompt = f"""COUNTRY CONTEXT:
{country_context}

ANALYSIS CONFIGURATION:
- Country: {config.country}
- Scope: {scope_str}
- Time Horizon: {config.horizon} years
- Number of signals to find: {config.signal_count}
- Priority domains: {domains_str}
{custom_str}

Hunt for {config.signal_count} weak signals. Use web search to find REAL, CURRENT evidence. Focus on Tier 1 (deep weak signals) and Tier 2 (intermediate signals). DO NOT report obvious/strong signals that any analyst would already know."""

    hunter_system = SIGNAL_HUNTER_SYSTEM.replace("{signal_count}", str(config.signal_count)).replace("{domains}", domains_str).replace("{horizon}", str(config.horizon))

    async for event in stream_agent_response(hunter_system, signal_prompt, use_web_search=True):
        if event["type"] == "chunk":
            yield SSEEvent(type="agent_chunk", agent="signal_hunter", content=event["content"]).to_sse()
        elif event["type"] == "complete":
            signal_hunter_output = event["content"]

    signals_json = extract_json_from_response(signal_hunter_output)
    signal_count = 0
    if signals_json and isinstance(signals_json, dict) and "signals" in signals_json:
        signal_count = len(signals_json["signals"])
    yield SSEEvent(type="agent_complete", agent="signal_hunter", data=signals_json).to_sse()
    logger.info("[Agent 1/4] SIGNAL HUNTER — Complete (%.1fs, %d chars, %d signals found, JSON: %s)",
                time.time() - agent_start, len(signal_hunter_output), signal_count, "OK" if signals_json else "FAILED")

    # ── Agent 2: Corroboration Agent ──
    agent_start = time.time()
    logger.info("[Agent 2/4] CORROBORATION — Cross-validating %d signals", signal_count)
    yield SSEEvent(type="agent_start", agent="corroboration", status="cross-validating").to_sse()

    corroboration_prompt = f"""COUNTRY CONTEXT:
{country_context}

SIGNALS TO CORROBORATE (from Signal Hunter):
{signal_hunter_output}

For each signal above, search for INDEPENDENT cross-modal corroboration using web search. Different data types count more than multiple articles saying the same thing. Update reliability scores based on corroboration strength."""

    async for event in stream_agent_response(CORROBORATION_SYSTEM, corroboration_prompt, use_web_search=True):
        if event["type"] == "chunk":
            yield SSEEvent(type="agent_chunk", agent="corroboration", content=event["content"]).to_sse()
        elif event["type"] == "complete":
            corroboration_output = event["content"]

    corroboration_json = extract_json_from_response(corroboration_output)
    yield SSEEvent(type="agent_complete", agent="corroboration", data=corroboration_json).to_sse()
    logger.info("[Agent 2/4] CORROBORATION — Complete (%.1fs, %d chars, JSON: %s)",
                time.time() - agent_start, len(corroboration_output), "OK" if corroboration_json else "FAILED")

    # ── Agent 3: Devil's Advocate ──
    agent_start = time.time()
    logger.info("[Agent 3/4] DEVIL'S ADVOCATE — Challenging signals")
    yield SSEEvent(type="agent_start", agent="devils_advocate", status="challenging").to_sse()

    devils_prompt = f"""COUNTRY CONTEXT:
{country_context}

SIGNALS IDENTIFIED (Signal Hunter):
{signal_hunter_output}

CORROBORATION RESULTS:
{corroboration_output}

For each signal, construct the STRONGEST mundane explanation. Try to kill every signal. Be the smartest skeptic. But be honest — if you can't explain it away, say so."""

    async for event in stream_agent_response(DEVILS_ADVOCATE_SYSTEM, devils_prompt, use_web_search=False):
        if event["type"] == "chunk":
            yield SSEEvent(type="agent_chunk", agent="devils_advocate", content=event["content"]).to_sse()
        elif event["type"] == "complete":
            devils_advocate_output = event["content"]

    devils_json = extract_json_from_response(devils_advocate_output)
    survived = 0
    if devils_json and isinstance(devils_json, dict) and "debunking_results" in devils_json:
        survived = sum(1 for r in devils_json["debunking_results"] if r.get("verdict") == "survives")
        total = len(devils_json["debunking_results"])
        logger.info("[Agent 3/4] DEVIL'S ADVOCATE — %d/%d signals survived", survived, total)
    yield SSEEvent(type="agent_complete", agent="devils_advocate", data=devils_json).to_sse()
    logger.info("[Agent 3/4] DEVIL'S ADVOCATE — Complete (%.1fs, %d chars, JSON: %s)",
                time.time() - agent_start, len(devils_advocate_output), "OK" if devils_json else "FAILED")

    # ── Agent 4: Synthesis Agent ──
    agent_start = time.time()
    logger.info("[Agent 4/4] SYNTHESIS — Mapping constellations and fingerprints")
    yield SSEEvent(type="agent_start", agent="synthesis", status="synthesizing").to_sse()

    synthesis_prompt = f"""COUNTRY: {config.country}
SCOPE: {scope_str}
TIME HORIZON: {config.horizon} years
PRIORITY DOMAINS: {domains_str}

COUNTRY CONTEXT:
{country_context}

SIGNAL HUNTER FINDINGS:
{signal_hunter_output}

CORROBORATION RESULTS:
{corroboration_output}

DEVIL'S ADVOCATE RESULTS:
{devils_advocate_output}

Now synthesize everything:
1. Map surviving signals into constellations
2. Match against historical pre-crisis fingerprints
3. Apply the scoring rubric (compute near_term, structural, overall scores)
4. Identify cascade paths between domains
5. Set monitoring triggers
6. Produce the final scored assessment

Remember: Category (c) fingerprint matches — where the current weak signal constellation matches a known pre-crisis pattern — are the HIGHEST VALUE output."""

    synthesis_output = ""
    async for event in stream_agent_response(SYNTHESIS_SYSTEM, synthesis_prompt, use_web_search=False):
        if event["type"] == "chunk":
            yield SSEEvent(type="agent_chunk", agent="synthesis", content=event["content"]).to_sse()
        elif event["type"] == "complete":
            synthesis_output = event["content"]

    synthesis_json = extract_json_from_response(synthesis_output)

    # If extraction returned a list (e.g., just the signals array), wrap it
    if isinstance(synthesis_json, list):
        logger.warning("[Agent 4/4] SYNTHESIS — JSON extraction returned a list, wrapping as scored_signals")
        synthesis_json = {"scored_signals": synthesis_json, "constellations": [], "overall_assessment": {}}

    # Apply scoring from code to ensure consistency
    if synthesis_json and "scored_signals" in synthesis_json:
        for signal in synthesis_json["scored_signals"]:
            scores = signal.get("scores", {})
            computed = compute_scores(
                scores.get("impact", 50),
                scores.get("lead_time", 50),
                scores.get("reliability", 50),
            )
            signal["scores"]["near_term"] = computed.near_term
            signal["scores"]["structural"] = computed.structural
            signal["scores"]["overall"] = computed.overall
            signal["risk_band"] = computed.risk_band.value

        # Log final scores summary
        for s in synthesis_json["scored_signals"]:
            logger.info("  [Signal] %-40s | Overall: %5.1f | Band: %-10s | Impact: %3.0f | Lead: %3.0f | Rel: %3.0f",
                        s.get("name", "?")[:40], s["scores"]["overall"],
                        s["risk_band"], s["scores"]["impact"],
                        s["scores"]["lead_time"], s["scores"]["reliability"])

    if synthesis_json and "constellations" in synthesis_json:
        for c in synthesis_json["constellations"]:
            fp = c.get("fingerprint_match") or {}
            logger.info("  [Constellation] %s — %s — %d signals%s",
                        c.get("name", "?"), c.get("category", "?"),
                        len(c.get("signal_ids", [])),
                        f" — FINGERPRINT: {fp.get('historical_case')}" if fp.get("historical_case") else "")

    if synthesis_json and "overall_assessment" in synthesis_json:
        oa = synthesis_json["overall_assessment"]
        logger.info("  [Assessment] %s | Risk: %s | Confidence: %s",
                    oa.get("headline", "?"), oa.get("risk_level", "?"), oa.get("confidence", "?"))

    yield SSEEvent(type="agent_complete", agent="synthesis", data=synthesis_json).to_sse()
    logger.info("[Agent 4/4] SYNTHESIS — Complete (%.1fs, %d chars, JSON: %s)",
                time.time() - agent_start, len(synthesis_output), "OK" if synthesis_json else "FAILED")

    # ── Final: Complete Analysis ──
    final_data = {
        "config": config.model_dump(),
        "country_context": context_json,
        "agents": {
            "signal_hunter": signals_json,
            "corroboration": corroboration_json,
            "devils_advocate": devils_json,
            "synthesis": synthesis_json,
        },
    }

    yield SSEEvent(type="analysis_complete", data=final_data).to_sse()

    total_time = time.time() - pipeline_start
    logger.info("=" * 60)
    logger.info("[Pipeline] ANALYSIS COMPLETE for %s in %.1fs (%.1f min)", config.country, total_time, total_time / 60)
    logger.info("=" * 60)


async def run_what_if(config: AnalysisConfig, existing_analysis: dict, scenario: str) -> AsyncGenerator[str, None]:
    """Run a what-if scenario on an existing analysis."""

    logger.info("[What-If] Starting scenario: '%s' for %s", scenario[:80], config.country)
    yield SSEEvent(type="agent_start", agent="what_if", status="simulating").to_sse()

    what_if_prompt = f"""COUNTRY: {config.country}
SCENARIO: {scenario}

EXISTING ANALYSIS:
{json.dumps(existing_analysis, indent=2, default=str)}

Evaluate how this scenario would change the risk landscape. Which existing signals get amplified or diminished? What NEW signals would emerge? Map the cascade propagation paths."""

    what_if_output = ""
    async for event in stream_agent_response(WHAT_IF_SYSTEM, what_if_prompt, use_web_search=True):
        if event["type"] == "chunk":
            yield SSEEvent(type="agent_chunk", agent="what_if", content=event["content"]).to_sse()
        elif event["type"] == "complete":
            what_if_output = event["content"]

    what_if_json = extract_json_from_response(what_if_output)
    yield SSEEvent(type="agent_complete", agent="what_if", data=what_if_json).to_sse()
    logger.info("[What-If] Complete (%d chars, JSON: %s)", len(what_if_output), "OK" if what_if_json else "FAILED")
