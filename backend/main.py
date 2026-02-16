import uuid
import asyncio
import hashlib
import json
import logging
import time
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("ewa.api")

from backend.models.analysis import AnalysisConfig, WhatIfRequest
from backend.agents.orchestrator import run_analysis_pipeline, run_what_if
from backend.services.firebase_service import (
    save_analysis,
    update_analysis_status,
    save_final_analysis,
    get_analysis,
    delete_analysis,
    save_what_if,
    list_analyses,
)

DELETE_PASSWORD_HASH = "e3c0bb912273a573f5360a9ac7ed5c41fc19a7f722b32613ff2b0de3edb9cb1e"

app = FastAPI(title="Early Warning Analyst API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for active analysis streams
# Maps analysis_id -> asyncio.Queue of SSE events
active_streams = {}  # type: dict[str, asyncio.Queue]

# In-memory store for completed/running analyses (for history listing)
# Maps analysis_id -> {id, country, scope, horizon, domains, status, created_at, assessment}
analysis_history = {}  # type: dict[str, dict]


@app.get("/api/health")
async def health():
    logger.debug("[Health] OK")
    return {"status": "ok"}


@app.post("/api/analyze")
async def start_analysis(config: AnalysisConfig, background_tasks: BackgroundTasks):
    analysis_id = str(uuid.uuid4())[:8]
    logger.info("[API] POST /api/analyze — id=%s, country=%s, scope=%s, horizon=%dy, signals=%d",
                analysis_id, config.country, config.scope.value, config.horizon, config.signal_count)
    logger.info("[API] Domains: %s", config.domains)

    # Create a queue for this analysis
    queue = asyncio.Queue()
    active_streams[analysis_id] = queue

    # Save initial state to Firebase (non-blocking, best effort)
    try:
        save_analysis(analysis_id, config.model_dump(), status="running")
        logger.info("[Firebase] Saved initial analysis state for %s", analysis_id)
    except Exception as e:
        logger.warning("[Firebase] Failed to save initial state: %s", e)

    # Track in history
    analysis_history[analysis_id] = {
        "id": analysis_id,
        "country": config.country,
        "scope": config.scope.value,
        "horizon": config.horizon,
        "domains": config.domains,
        "signal_count": config.signal_count,
        "status": "running",
        "created_at": time.time(),
        "assessment": None,
    }

    # Run pipeline in background
    background_tasks.add_task(run_pipeline_to_queue, analysis_id, config, queue)

    return {"analysis_id": analysis_id}


async def run_pipeline_to_queue(analysis_id: str, config: AnalysisConfig, queue: asyncio.Queue):
    """Run the agent pipeline and push events to the queue."""
    logger.info("[Pipeline] Background task started for %s", analysis_id)
    try:
        final_data = None
        event_count = 0
        async for event_str in run_analysis_pipeline(config):
            await queue.put(event_str)
            event_count += 1
            # Parse event to check for completion and save to Firebase
            try:
                event = json.loads(event_str)
                if event.get("type") == "analysis_complete":
                    final_data = event.get("data")
                    # Update history with assessment
                    if analysis_id in analysis_history:
                        synthesis = (final_data or {}).get("agents", {}).get("synthesis", {})
                        assessment = synthesis.get("overall_assessment", {}) if synthesis else {}
                        analysis_history[analysis_id]["status"] = "completed"
                        analysis_history[analysis_id]["assessment"] = assessment
            except Exception:
                pass

        logger.info("[Pipeline] Streamed %d events for %s", event_count, analysis_id)

        # Save final results to Firebase (best effort)
        if final_data:
            try:
                save_final_analysis(analysis_id, final_data)
                logger.info("[Firebase] Saved final analysis for %s", analysis_id)
            except Exception as e:
                logger.warning("[Firebase] Failed to save final analysis: %s", e)

        await queue.put(None)  # Signal end of stream
    except Exception as e:
        logger.error("[Pipeline] ERROR for %s: %s: %s", analysis_id, type(e).__name__, e)
        error_event = json.dumps({"type": "error", "message": str(e)})
        await queue.put(error_event)
        await queue.put(None)
        if analysis_id in analysis_history:
            analysis_history[analysis_id]["status"] = "failed"
        try:
            update_analysis_status(analysis_id, "failed")
        except Exception:
            pass


@app.get("/api/analyze/{analysis_id}/stream")
async def stream_analysis(analysis_id: str):
    logger.info("[API] GET /api/analyze/%s/stream", analysis_id)
    queue = active_streams.get(analysis_id)
    if not queue:
        # Check if analysis exists in Firebase (completed previously)
        try:
            existing = get_analysis(analysis_id)
            if existing and existing.get("status") == "completed":
                logger.info("[API] Serving cached analysis %s from Firebase", analysis_id)
                async def completed_stream():
                    yield json.dumps({
                        "type": "analysis_complete",
                        "data": existing.get("final_data", {})
                    })
                return EventSourceResponse(completed_stream())
        except Exception:
            pass

        logger.warning("[API] Analysis %s not found", analysis_id)
        return {"error": "Analysis not found"}, 404

    logger.info("[API] Connecting SSE stream for %s", analysis_id)

    async def event_generator():
        while True:
            event = await queue.get()
            if event is None:
                # Clean up
                active_streams.pop(analysis_id, None)
                logger.info("[API] SSE stream ended for %s", analysis_id)
                break
            yield event

    return EventSourceResponse(event_generator())


@app.get("/api/runs")
async def list_runs():
    """List all analysis runs (most recent first), merging in-memory + Firebase."""
    merged = dict(analysis_history)  # start with in-memory

    # Load from Firebase for persisted runs not in memory
    try:
        fb_runs = list_analyses()
        for run in fb_runs:
            rid = run.get("id", "")
            if rid and rid not in merged:
                config = run.get("config", {}) or {}
                final_data = run.get("final_data", {}) or {}
                if not isinstance(final_data, dict):
                    final_data = {}
                agents = final_data.get("agents", {}) or {}
                if not isinstance(agents, dict):
                    agents = {}
                synth = agents.get("synthesis", {}) or {}
                if not isinstance(synth, dict):
                    synth = {}
                assessment = synth.get("overall_assessment") if synth else None
                created = run.get("created_at")
                ts = created.timestamp() if hasattr(created, "timestamp") else time.time()
                merged[rid] = {
                    "id": rid,
                    "country": config.get("country", "Unknown"),
                    "scope": config.get("scope", "national"),
                    "horizon": config.get("horizon", 5),
                    "domains": config.get("domains", []),
                    "signal_count": config.get("signal_count", 0),
                    "status": run.get("status", "unknown"),
                    "created_at": ts,
                    "assessment": assessment,
                }
    except Exception as e:
        logger.warning("[API] Failed to load runs from Firebase: %s", e)

    runs = sorted(merged.values(), key=lambda r: r["created_at"], reverse=True)
    return {"runs": runs}


@app.get("/api/analyze/{analysis_id}")
async def get_analysis_result(analysis_id: str):
    logger.info("[API] GET /api/analyze/%s", analysis_id)
    try:
        result = get_analysis(analysis_id)
        if result:
            return result
    except Exception as e:
        logger.warning("[API] Failed to get analysis %s: %s", analysis_id, e)
    return {"error": "Analysis not found"}, 404


@app.delete("/api/analyze/{analysis_id}")
async def delete_analysis_endpoint(analysis_id: str, body: dict):
    logger.info("[API] DELETE /api/analyze/%s", analysis_id)
    password = body.get("password", "")
    if hashlib.sha256(password.encode()).hexdigest() != DELETE_PASSWORD_HASH:
        logger.warning("[API] Invalid delete password for %s", analysis_id)
        return {"error": "Invalid password"}, 403

    try:
        delete_analysis(analysis_id)
        logger.info("[Firebase] Deleted analysis %s", analysis_id)
    except Exception as e:
        logger.warning("[Firebase] Failed to delete analysis %s: %s", analysis_id, e)

    active_streams.pop(analysis_id, None)
    analysis_history.pop(analysis_id, None)

    return {"ok": True}


@app.post("/api/analyze/{analysis_id}/what-if")
async def start_what_if(
    analysis_id: str, request: WhatIfRequest, background_tasks: BackgroundTasks
):
    scenario_id = str(uuid.uuid4())[:8]
    logger.info("[API] POST /api/analyze/%s/what-if — scenario: '%s'", analysis_id, request.scenario[:80])

    # Get existing analysis
    existing = None
    try:
        existing = get_analysis(analysis_id)
    except Exception as e:
        logger.warning("[API] Failed to get analysis for what-if: %s", e)

    if not existing or not existing.get("final_data"):
        logger.warning("[API] Analysis %s not found or not completed for what-if", analysis_id)
        return {"error": "Analysis not found or not completed"}, 404

    queue = asyncio.Queue()
    stream_key = f"{analysis_id}_whatif_{scenario_id}"
    active_streams[stream_key] = queue

    config = AnalysisConfig(**existing["config"])

    background_tasks.add_task(
        run_whatif_to_queue,
        analysis_id,
        scenario_id,
        config,
        existing.get("final_data", {}),
        request.scenario,
        queue,
        stream_key,
    )

    return {"scenario_id": scenario_id, "stream_key": stream_key}


async def run_whatif_to_queue(
    analysis_id: str,
    scenario_id: str,
    config: AnalysisConfig,
    existing_analysis: dict,
    scenario: str,
    queue: asyncio.Queue,
    stream_key: str,
):
    try:
        async for event_str in run_what_if(config, existing_analysis, scenario):
            await queue.put(event_str)
            try:
                event = json.loads(event_str)
                if event.get("type") == "agent_complete":
                    try:
                        save_what_if(analysis_id, scenario_id, event.get("data", {}))
                        logger.info("[Firebase] Saved what-if scenario %s", scenario_id)
                    except Exception as e:
                        logger.warning("[Firebase] Failed to save what-if: %s", e)
            except Exception:
                pass

        await queue.put(None)
    except Exception as e:
        logger.error("[What-If] ERROR: %s: %s", type(e).__name__, e)
        await queue.put(json.dumps({"type": "error", "message": str(e)}))
        await queue.put(None)
    finally:
        active_streams.pop(stream_key, None)


@app.get("/api/analyze/{analysis_id}/what-if/{stream_key}/stream")
async def stream_what_if(analysis_id: str, stream_key: str):
    logger.info("[API] GET /api/analyze/%s/what-if/%s/stream", analysis_id, stream_key)
    queue = active_streams.get(stream_key)
    if not queue:
        return {"error": "What-if stream not found"}, 404

    async def event_generator():
        while True:
            event = await queue.get()
            if event is None:
                break
            yield event

    return EventSourceResponse(event_generator())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
