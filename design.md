# Design: Early Warning Analyst (EWA)

## Overview

Early Warning Analyst is a full-stack application with a **Next.js 16 frontend** and **FastAPI Python backend** that orchestrates a 5-agent AI pipeline for country-level risk analysis. The system uses Claude Opus 4.6 with live web search to detect weak signals, validate them through adversarial multi-agent debate, and synthesize findings into actionable intelligence. Results stream in real-time via Server-Sent Events (SSE) and persist to Firebase Firestore.

---

## Architecture

### System Architecture Diagram

```
                                    EXTERNAL SERVICES
                                    ┌─────────────────────┐
                                    │  Anthropic Claude    │
                                    │  Opus 4.6 API       │
                                    │  + Web Search Tool   │
                                    └────────▲────────────┘
                                             │
┌──────────────────────┐            ┌────────┴────────────────────────┐
│    FRONTEND          │            │         BACKEND                 │
│    Next.js 16        │            │         FastAPI + Uvicorn       │
│    React 19          │            │                                 │
│    Port :3000        │            │    Port :8000                   │
│                      │            │                                 │
│  ┌────────────────┐  │   POST    │  ┌───────────────────────────┐  │
│  │ Home Page      │──┼──────────▶│  │ POST /api/analyze         │  │
│  │ - Globe Hero   │  │           │  │  → Generate analysis_id   │  │
│  │ - Config Form  │  │           │  │  → Spawn background task  │  │
│  │ - Country List │  │           │  └───────────┬───────────────┘  │
│  └────────────────┘  │           │              │                  │
│                      │           │              ▼                  │
│  ┌────────────────┐  │   SSE     │  ┌───────────────────────────┐  │
│  │ Analysis Page  │◀─┼──────────│  │ 5-Agent Pipeline           │  │
│  │ - Agent Debate │  │           │  │ (orchestrator.py)          │  │
│  │ - Signal Table │  │           │  │                            │  │
│  │ - Constellations│ │           │  │ Agent 0: Context Discovery │  │
│  │ - Fingerprints │  │           │  │ Agent 1: Signal Hunter     │  │
│  │ - What-If      │  │           │  │ Agent 2: Corroboration     │  │
│  └────────────────┘  │           │  │ Agent 3: Devil's Advocate  │  │
│                      │           │  │ Agent 4: Synthesis         │  │
│  ┌────────────────┐  │   GET     │  └───────────┬───────────────┘  │
│  │ Runs Sidebar   │──┼──────────▶│              │                  │
│  └────────────────┘  │           │              ▼                  │
│                      │           │  ┌───────────────────────────┐  │
└──────────────────────┘           │  │ Firebase Firestore        │  │
                                   │  │ - analyses/{id}           │  │
                                   │  │ - what_if_scenarios/{id}  │  │
                                   │  └───────────────────────────┘  │
                                   └─────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js (App Router) | 16.1.6 |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | 4.x |
| 3D Visualization | COBE (globe), react-force-graph-2d | 0.6.5, 1.29.1 |
| Backend Framework | FastAPI | 0.115.0 |
| ASGI Server | Uvicorn | 0.30.6 |
| AI Model | Claude Opus 4.6 (Anthropic SDK) | 0.42.0 |
| Database | Firebase Firestore (Admin SDK) | 6.6.0 |
| Streaming | SSE (sse-starlette) | 2.1.3 |
| Validation | Pydantic | 2.9.2 |
| Deployment | Docker -> Railway | Python 3.11 |

---

## Agent Pipeline Design

### Sequential 5-Agent Flow

```
User Config
    │
    ▼
┌─────────────────────────────────────────────────────┐
│ Agent 0: COUNTRY CONTEXT DISCOVERY                  │
│ - Web search: ENABLED (5 searches max)              │
│ - Input: country, scope, horizon, domains           │
│ - Output: Structured country baseline profile       │
│ - Persona: Elite intelligence analyst               │
└──────────────────────┬──────────────────────────────┘
                       │ country_context (raw text)
                       ▼
┌─────────────────────────────────────────────────────┐
│ Agent 1: SIGNAL HUNTER                              │
│ - Web search: ENABLED (5 searches max)              │
│ - Input: country_context + config                   │
│ - Output: Array of 10-40 weak signals with scores   │
│ - Persona: Pattern-obsessed anomaly detector        │
│ - Focus: Tier 1 (deep) & Tier 2 (intermediate)     │
└──────────────────────┬──────────────────────────────┘
                       │ signal_hunter_output (raw text)
                       ▼
┌─────────────────────────────────────────────────────┐
│ Agent 2: CORROBORATION AGENT                        │
│ - Web search: ENABLED (5 searches max)              │
│ - Input: country_context + signal_hunter_output     │
│ - Output: Corroboration results per signal          │
│ - Persona: Methodical cross-modal triangulator      │
│ - Hierarchy: 3+ modalities = STRONG, 2 = MODERATE   │
└──────────────────────┬──────────────────────────────┘
                       │ corroboration_output (raw text)
                       ▼
┌─────────────────────────────────────────────────────┐
│ Agent 3: DEVIL'S ADVOCATE                           │
│ - Web search: DISABLED (pure reasoning)             │
│ - Input: all previous outputs                       │
│ - Output: Debunking results with verdicts           │
│ - Persona: Smartest skeptic in the room             │
│ - Verdicts: debunked | partially_debunked | survives│
└──────────────────────┬──────────────────────────────┘
                       │ devils_advocate_output (raw text)
                       ▼
┌─────────────────────────────────────────────────────┐
│ Agent 4: SYNTHESIS AGENT                            │
│ - Web search: DISABLED (pure reasoning)             │
│ - Input: ALL previous agent outputs                 │
│ - Output: Scored signals + constellations +         │
│           fingerprint matches + overall assessment  │
│ - Persona: Forest-from-trees strategic analyst      │
│ - Historical fingerprints: Sri Lanka, Lebanon,      │
│   Arab Spring, Argentina, Venezuela, Turkey         │
└─────────────────────────────────────────────────────┘
```

**Design Decision — Raw Text Passing:** Each agent receives the full verbose text output of all previous agents (not just parsed JSON). This preserves analytical nuance and reasoning chains but increases token usage progressively. The synthesis agent receives the most context (~50K+ tokens of accumulated output).

**Design Decision — Deterministic Score Override:** The Synthesis agent is given the scoring formula in its prompt, but the orchestrator re-computes all scores deterministically using Python code after the agent responds. This prevents LLM arithmetic errors from affecting the final output.

---

## Components and Interfaces

### Frontend TypeScript Interfaces

```typescript
interface AnalysisConfig {
  country: string;
  country_code: string;
  scope: "national" | "department";
  department_name?: string;
  horizon: number;          // 1-10 years
  signal_count: number;     // 10-40
  domains: string[];        // from 13 available domains
  custom_indicators: string[];
}

interface Signal {
  signal_id: string;
  name: string;
  domain: string;
  description: string;
  why_looks_like_noise: string;
  why_actually_meaningful: string;
  evidence_chain: string;
  agent_perspectives: {
    signal_hunter: string;
    corroboration: string;
    devils_advocate: string;
  };
  scores: {
    impact: number;        // 0-100
    lead_time: number;     // 0-100
    reliability: number;   // 0-100
    near_term: number;     // computed
    structural: number;    // computed
    overall: number;       // computed
  };
  risk_band: "green" | "amber" | "red_watch" | "red_action";
  constellation_id: string | null;
  monitoring_triggers: string[];
  no_regret_actions: string[];
}

interface Constellation {
  id: string;
  name: string;
  signal_ids: string[];
  category: "isolated" | "correlated_cluster" | "fingerprint_match";
  description: string;
  cascade_paths: {
    path: string[];
    description: string;
  }[];
  fingerprint_match: {
    historical_case: string | null;
    match_strength: string | null;
    matching_signals: string[];
    divergences: string[];
    historical_timeline: string;
    current_stage_estimate: string;
  } | null;
}

interface OverallAssessment {
  headline: string;
  risk_level: string;
  key_concern: string;
  confidence: string;
  what_to_watch: string[];
  timeline_estimate: string;
}

interface SynthesisData {
  scored_signals: Signal[];
  constellations: Constellation[];
  overall_assessment: OverallAssessment;
}

interface SSEEvent {
  type: "agent_start" | "agent_chunk" | "agent_complete" | "analysis_complete" | "error";
  agent?: string;
  content?: string;
  data?: Record<string, unknown>;
  status?: string;
  message?: string;
}

interface WhatIfResult {
  scenario: string;
  cascade: { root: string; first_order: CascadeNode[]; };
  amplified_signals: { signal_id: string; original_overall_score: number; new_overall_score: number; reason: string; }[];
  diminished_signals: { signal_id: string; original_overall_score: number; new_overall_score: number; reason: string; }[];
  new_signals: { name: string; domain: string; description: string; scores: { impact: number; lead_time: number; reliability: number; overall: number }; risk_band: string; }[];
  new_overall_risk_level: string;
  key_insight: string;
}

interface CascadeNode {
  effect: string;
  domain: string;
  children?: CascadeNode[];
}
```

### Backend Python Models

```python
class AnalysisConfig(BaseModel):
    country: str
    country_code: str = ""
    scope: AnalysisScope = AnalysisScope.NATIONAL  # "national" | "department"
    department_name: Optional[str] = None
    horizon: int = Field(default=5, ge=1, le=10)
    signal_count: int = Field(default=20, ge=10, le=40)
    domains: list[str] = Field(default_factory=lambda: [
        "economy", "infrastructure", "health", "climate",
        "food_water", "social_cohesion", "security", "energy"
    ])
    custom_indicators: list[str] = Field(default_factory=list)

class SignalScores(BaseModel):
    impact: float = 0
    lead_time: float = 0
    reliability: float = 0
    near_term: float = 0
    structural: float = 0
    overall: float = 0
    risk_band: RiskBand = RiskBand.GREEN

class RiskBand(str, Enum):
    GREEN = "green"         # 0-39
    AMBER = "amber"         # 40-59
    RED_WATCH = "red_watch"  # 60-74
    RED_ACTION = "red_action" # 75+

class SSEEvent(BaseModel):
    type: str       # agent_start | agent_chunk | agent_complete | analysis_complete | error
    agent: Optional[str] = None
    content: Optional[str] = None
    data: Optional[Union[Dict, List]] = None
    status: Optional[str] = None
    message: Optional[str] = None
```

---

## Data Models

### Firebase Firestore Schema

```
Collection: analyses
Document: {analysis_id}  (8-char UUID)
│
├── config: {                          # AnalysisConfig
│     country: "India",
│     country_code: "IN",
│     scope: "national",
│     horizon: 5,
│     signal_count: 20,
│     domains: ["economy", "health", ...],
│     custom_indicators: []
│   }
│
├── status: "running" | "completed" | "failed"
│
├── created_at: Timestamp
├── updated_at: Timestamp
│
├── final_data: {
│     config: {...},
│     country_context: {               # Agent 0 output
│       country: "India",
│       economic_structure: { gdp_usd_billions, gdp_growth_pct, ... },
│       demographics: { population_millions, median_age, ... },
│       governance: { government_type, ... },
│       climate_geography: { disaster_risk_profile, water_stress_level, ... },
│       logistics: { key_chokepoints, ... },
│       baseline_normal: "..."
│     },
│     agents: {
│       signal_hunter: { signals: [...] },         # Agent 1 output
│       corroboration: { corroborated_signals: [...] },  # Agent 2 output
│       devils_advocate: { debunking_results: [...] },   # Agent 3 output
│       synthesis: {                                     # Agent 4 output
│         scored_signals: [...],
│         constellations: [...],
│         overall_assessment: {...}
│       }
│     }
│   }
│
└── Subcollection: what_if_scenarios
    └── Document: {scenario_id}
        ├── result: { cascade, amplified_signals, diminished_signals, new_signals, ... }
        └── created_at: Timestamp
```

### SSE Event Stream Protocol

```
Event Types and Payloads:

1. agent_start    → { type, agent, status }
2. agent_chunk    → { type, agent, content }     // streaming text delta
3. agent_complete → { type, agent, data }         // structured JSON result
4. analysis_complete → { type, data }             // full final_data object
5. error          → { type, message }             // error description

Stream Lifecycle:
  Client connects via EventSource → receives events → stream ends with analysis_complete or error
  Queue sentinel (null) terminates the SSE connection
```

---

## API Design

### Endpoints

| Method | Path | Request | Response | Description |
|--------|------|---------|----------|-------------|
| GET | `/api/health` | — | `{ status: "ok" }` | Health check |
| POST | `/api/analyze` | `AnalysisConfig` (JSON body) | `{ analysis_id: string }` | Start new analysis pipeline |
| GET | `/api/analyze/{id}/stream` | — | `EventSourceResponse` (SSE) | Stream real-time agent progress |
| GET | `/api/runs` | — | `{ runs: AnalysisRun[] }` | List 50 most recent analyses |
| GET | `/api/analyze/{id}` | — | Full analysis document | Get completed analysis |
| POST | `/api/analyze/{id}/what-if` | `{ scenario: string }` | `{ scenario_id, stream_key }` | Start what-if scenario |
| GET | `/api/analyze/{id}/what-if/{key}/stream` | — | `EventSourceResponse` (SSE) | Stream what-if progress |

### Request/Response Examples

**POST /api/analyze**
```json
// Request
{
  "country": "India",
  "country_code": "IN",
  "scope": "national",
  "horizon": 5,
  "signal_count": 20,
  "domains": ["economy", "infrastructure", "health", "climate", "food_water", "social_cohesion", "security", "energy"],
  "custom_indicators": ["monsoon pattern shifts", "UPI transaction anomalies"]
}

// Response
{ "analysis_id": "a3f7b2c1" }
```

**POST /api/analyze/{id}/what-if**
```json
// Request
{ "scenario": "Oil prices spike to $120/barrel sustained for 12 months" }

// Response
{ "scenario_id": "e4d8c9a2", "stream_key": "a3f7b2c1_whatif_e4d8c9a2" }
```

---

## Scoring Algorithm

### Formula

```
near_term_score  = 0.35 * Impact + 0.45 * Lead_time + 0.20 * Reliability
structural_score = 0.55 * Impact + 0.20 * Lead_time + 0.25 * Reliability
overall_score    = 0.25 * near_term + 0.50 * Impact + 0.25 * structural
```

### Effective Weights (expanded overall)

```
overall = 0.725 * Impact + 0.1625 * Lead_time + 0.1125 * Reliability
```

Impact dominates at 72.5% effective weight, reflecting the system's design priority: high-impact signals matter most regardless of timing or data confidence.

### Risk Band Classification

| Band | Range | Label | Color |
|------|-------|-------|-------|
| GREEN | 0-39 | Monitor | #22c55e |
| AMBER | 40-59 | Watch | #eab308 |
| RED_WATCH | 60-74 | Emerging | #f97316 |
| RED_ACTION | 75+ | Critical | #ef4444 |

---

## Error Handling

### Claude API Response Parsing

Three-tier JSON extraction strategy:

1. **Markdown code blocks** — Regex match for ` ```json ... ``` ` blocks (most common)
2. **Full text parse** — Attempt to parse entire response as JSON
3. **Embedded JSON scan** — Depth-counting bracket matching to find embedded `{...}` or `[...]`

If all three tiers fail, the extraction returns `null` and the agent output is logged as a JSON extraction failure. The pipeline continues with `null` data for that agent.

### Pipeline Error Recovery

- Each Claude API call is wrapped in try/catch
- On pipeline-level failure: error event emitted to SSE stream, analysis status set to "failed" in Firebase
- Firebase persistence is best-effort (non-blocking) — Firebase failures don't crash the pipeline
- No retry logic for individual agent failures (pipeline fails fast)

---

## Testing Strategy

### End-to-End Verification

1. **Start Analysis:** POST to `/api/analyze` with a test config (e.g., India, national, 5-year horizon, 10 signals)
2. **Stream Verification:** Connect to SSE stream and verify all 5 agent stages emit `agent_start`, `agent_chunk`, `agent_complete` events in order
3. **Data Integrity:** Verify `analysis_complete` event contains valid `scored_signals`, `constellations`, and `overall_assessment`
4. **Score Consistency:** Verify computed scores match the deterministic formula (not LLM-generated values)
5. **Persistence:** Verify analysis is retrievable from GET `/api/analyze/{id}` after completion
6. **History:** Verify analysis appears in GET `/api/runs` response
7. **What-If:** Submit a scenario and verify SSE stream produces valid cascade tree and signal modifications

### Component Testing

- **Scoring function:** Unit test `compute_scores()` with known inputs to verify formula correctness
- **JSON extraction:** Unit test `extract_json_from_response()` with code blocks, raw JSON, and embedded JSON
- **Firebase CRUD:** Integration test save/retrieve cycle on Firestore

---

## File Structure

```
early_warning_analyst/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx                    # Home page (globe, config form)
│       │   ├── layout.tsx                  # Root layout (dark theme, fonts)
│       │   ├── globals.css                 # Theme variables, animations
│       │   └── analysis/[id]/page.tsx      # Analysis dashboard
│       ├── components/
│       │   ├── GlobeHero.tsx               # 3D interactive globe (COBE)
│       │   ├── RunsSidebar.tsx             # Analysis history sidebar
│       │   ├── agents/
│       │   │   ├── AgentDebatePanel.tsx    # Agent streaming container
│       │   │   └── AgentCard.tsx           # Individual agent display
│       │   └── dashboard/
│       │       ├── RiskSignalTable.tsx     # Sortable signals table
│       │       ├── SignalDetailModal.tsx   # Signal deep-dive modal
│       │       ├── ConstellationGraph.tsx  # Force-directed graph
│       │       ├── FingerprintPanel.tsx    # Historical pattern matches
│       │       └── WhatIfPanel.tsx         # Scenario simulation
│       ├── hooks/
│       │   └── useAnalysisStream.ts        # SSE streaming hook
│       └── lib/
│           ├── api.ts                      # Backend API client
│           ├── types.ts                    # TypeScript interfaces
│           └── countries.ts                # 195 countries dataset
├── backend/
│   ├── main.py                             # FastAPI app, routes, SSE
│   ├── agents/
│   │   ├── orchestrator.py                 # 5-agent pipeline execution
│   │   ├── prompts.py                      # 6 agent system prompts
│   │   └── schemas.py                      # SSEEvent model
│   ├── models/
│   │   └── analysis.py                     # Pydantic models
│   └── services/
│       ├── claude_client.py                # Anthropic API wrapper
│       ├── firebase_service.py             # Firestore CRUD
│       └── scoring.py                      # Deterministic scoring
├── Dockerfile                              # Backend container (Railway)
├── requirements.md                         # This requirements spec
└── design.md                               # This design spec
```
