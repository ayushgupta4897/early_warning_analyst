# Requirements: Early Warning Analyst (EWA)

## Introduction

Early Warning Analyst (EWA) is an AI-powered multi-agent intelligence system that detects weak signals of emerging crises in countries before they compound into full-blown disasters. Using a 5-agent adversarial pipeline powered by Claude AI with live web search, EWA hunts for subtle, non-obvious indicators across 13 domains (economy, health, climate, security, energy, etc.), cross-validates them through independent data modalities, subjects them to adversarial debunking, and synthesizes surviving signals into risk constellations matched against historical pre-crisis fingerprints.

The system serves government analysts, NGOs, multilateral organizations, and risk consultancies who need early warning capabilities that go beyond headline news and obvious indicators.

---

## Requirements

### Requirement 1: Country Analysis Configuration

**User Story:** As an analyst, I want to configure a country-level risk analysis with specific parameters, so that I can tailor the assessment to my intelligence needs.

#### Acceptance Criteria

1. WHEN the analyst selects a country from the country selector THE SYSTEM SHALL accept any of the 195 recognized sovereign nations and populate the corresponding country code.
2. WHEN the analyst sets the analysis scope THE SYSTEM SHALL support both "national" (country-wide) and "department" (sub-national/state-level) scope options.
3. WHEN the analyst selects "department" scope THE SYSTEM SHALL require a department/state name to be provided.
4. WHEN the analyst sets the time horizon THE SYSTEM SHALL accept a value between 1 and 10 years (default: 5 years).
5. WHEN the analyst sets the signal count THE SYSTEM SHALL accept a value between 10 and 40 weak signals to hunt for (default: 20).
6. WHEN the analyst selects analysis domains THE SYSTEM SHALL allow selection from 13 available domains: Economy, Labor, Infrastructure, Health, Climate, Food & Water, Cyber, Logistics, Social Cohesion, Security, Energy, Education, and Demographics.
7. WHEN the analyst provides custom indicators THE SYSTEM SHALL include them as additional weak signal hypotheses for the Signal Hunter agent to investigate.

---

### Requirement 2: Real-Time Analysis Streaming

**User Story:** As an analyst, I want to watch the multi-agent pipeline work in real-time, so that I can understand the analytical reasoning as it unfolds rather than waiting for a final report.

#### Acceptance Criteria

1. WHEN an analysis is started THE SYSTEM SHALL return an analysis ID immediately and begin processing in the background.
2. WHEN the analyst connects to the analysis stream THE SYSTEM SHALL deliver Server-Sent Events (SSE) with the following event types: `agent_start`, `agent_chunk`, `agent_complete`, `analysis_complete`, and `error`.
3. WHEN an agent begins processing THE SYSTEM SHALL emit an `agent_start` event with the agent name and current status.
4. WHEN an agent produces text output THE SYSTEM SHALL stream it as `agent_chunk` events in real-time, allowing the analyst to read the agent's reasoning as it is generated.
5. WHEN an agent completes THE SYSTEM SHALL emit an `agent_complete` event containing the structured JSON output of that agent.
6. WHEN all agents complete THE SYSTEM SHALL emit an `analysis_complete` event containing the full final dataset.
7. WHEN a stream connection is established for a previously completed analysis THE SYSTEM SHALL serve the cached result from the database immediately.

---

### Requirement 3: Country Context Baseline (Agent 0)

**User Story:** As a risk analyst, I want an automated baseline profile of the target country's current state, so that deviations (weak signals) can be detected against an established "normal."

#### Acceptance Criteria

1. WHEN the Country Context Discovery agent runs THE SYSTEM SHALL use live web search to gather current, real data about the target country.
2. WHEN the agent completes THE SYSTEM SHALL produce a structured JSON profile covering: economic structure (GDP, growth, composition, debt, inflation), demographics (population, median age, urbanization, youth bulge), governance (type, institutional quality, corruption, risks), climate/geography (disaster risk, water stress, food import dependency), logistics (chokepoints, port dependencies, energy imports), and a baseline-normal narrative.
3. WHEN the profile is generated THE SYSTEM SHALL include specific numbers and dates rather than generic qualitative assessments.

---

### Requirement 4: Weak Signal Detection (Agent 1)

**User Story:** As an intelligence analyst, I want the system to hunt for non-obvious, cross-domain weak signals, so that I can detect emerging risks before they become visible to conventional analysis.

#### Acceptance Criteria

1. WHEN the Signal Hunter agent runs THE SYSTEM SHALL search for the configured number of weak signals (10-40) using live web search across the specified priority domains.
2. WHEN identifying signals THE SYSTEM SHALL focus on Tier 1 (deep weak signals) and Tier 2 (intermediate signals), explicitly avoiding strong/obvious signals that conventional analysts already track.
3. WHEN a signal is identified THE SYSTEM SHALL provide: a descriptive name, the domain it belongs to, a description, why it looks like noise, why it is actually meaningful, the data source, specific evidence with numbers and dates, a signal tier (1 or 2), and preliminary scores for impact, lead_time, and reliability (each 0-100).
4. WHEN custom indicators are provided THE SYSTEM SHALL investigate them alongside its autonomous signal hunting.
5. WHEN searching for signals THE SYSTEM SHALL look for cross-domain indicators such as procurement anomalies, migration micro-patterns, satellite-derived proxies, social media sentiment drift, supply chain shifts, health system edge indicators, agricultural leading indicators, informal economy proxies, and financial micro-indicators.

---

### Requirement 5: Multi-Modal Corroboration (Agent 2)

**User Story:** As a risk analyst, I want each weak signal to be independently cross-validated through different data modalities, so that I can trust the reliability of the findings.

#### Acceptance Criteria

1. WHEN the Corroboration Agent runs THE SYSTEM SHALL use live web search to find independent evidence for each signal from different data modalities (satellite imagery, social media, procurement data, economic statistics, news, academic research, government communications, supply chain data, migration data, health data, financial data, local sources).
2. WHEN evaluating corroboration strength THE SYSTEM SHALL classify as: STRONG (3+ independent modalities agreeing), MODERATE (2 independent modalities), WEAK (same modality, different sources), or UNCORROBORATED (single source only).
3. WHEN corroboration is assessed THE SYSTEM SHALL update the reliability score for each signal based on corroboration strength.
4. WHEN a signal cannot be corroborated THE SYSTEM SHALL clearly identify what evidence is missing (gaps).

---

### Requirement 6: Adversarial Debunking (Agent 3)

**User Story:** As a decision-maker, I want every detected signal to survive rigorous skeptical scrutiny, so that I can be confident the warnings are not false alarms.

#### Acceptance Criteria

1. WHEN the Devil's Advocate agent runs THE SYSTEM SHALL construct the strongest possible mundane explanation for each signal.
2. WHEN debunking THE SYSTEM SHALL apply: mundane explanations (seasonal patterns, regulation changes, measurement artifacts), base rate analysis (how often does this signal appear without a subsequent crisis), cognitive bias checks (availability bias, confirmation bias, anchoring, narrative bias), alternative causation analysis, and data quality assessment.
3. WHEN a verdict is reached THE SYSTEM SHALL classify each signal as: `debunked` (mundane explanation is convincing), `partially_debunked` (some aspects explained away but core concern remains), or `survives` (cannot be explained away).
4. WHEN a signal survives THE SYSTEM SHALL honestly acknowledge it cannot be explained away.
5. WHEN a verdict is reached THE SYSTEM SHALL provide adjusted impact, lead_time, and reliability scores reflecting the debunking analysis.

---

### Requirement 7: Synthesis, Constellations & Fingerprint Matching (Agent 4)

**User Story:** As a strategic analyst, I want surviving signals mapped into meaningful clusters and compared against historical pre-crisis patterns, so that I can identify systemic risks that no individual signal reveals alone.

#### Acceptance Criteria

1. WHEN the Synthesis Agent runs THE SYSTEM SHALL group surviving signals into constellations (clusters of related signals that together tell a story no individual signal tells alone).
2. WHEN forming constellations THE SYSTEM SHALL categorize each as: (a) Isolated — interesting but not yet concerning, (b) Correlated Cluster — multiple weak signals from different domains pointing in the same direction, or (c) Fingerprint Match — constellation matches a known pre-crisis pattern.
3. WHEN a fingerprint match is detected THE SYSTEM SHALL identify the historical case (e.g., Sri Lanka 2020-2021, Lebanon 2018-2019, Arab Spring 2010), match strength, which current signals match the historical pattern, divergences from the historical case, the historical timeline, and the estimated current stage within that pattern.
4. WHEN cascade paths are identified THE SYSTEM SHALL map how weakness propagates from one domain to another (e.g., energy crisis -> water scarcity -> food insecurity -> social unrest).
5. WHEN the synthesis is complete THE SYSTEM SHALL produce an overall assessment with: a headline summary, overall risk level, key concern, confidence level, top 3 things to watch, and a timeline estimate.

---

### Requirement 8: Deterministic Risk Scoring

**User Story:** As a risk analyst, I want consistent, reproducible risk scores for every signal, so that I can compare and prioritize signals objectively.

#### Acceptance Criteria

1. WHEN scoring a signal THE SYSTEM SHALL compute composite scores using a deterministic formula: near_term = 0.35 x Impact + 0.45 x Lead-time + 0.20 x Reliability; structural = 0.55 x Impact + 0.20 x Lead-time + 0.25 x Reliability; overall = 0.25 x near_term + 0.50 x Impact + 0.25 x structural.
2. WHEN scores are computed THE SYSTEM SHALL override any LLM-generated scores with the deterministic code-computed values to ensure mathematical consistency.
3. WHEN the overall score is computed THE SYSTEM SHALL assign a risk band: GREEN (0-39), AMBER (40-59), RED_WATCH (60-74), or RED_ACTION (75+).
4. WHEN displaying scores THE SYSTEM SHALL round all values to one decimal place.

---

### Requirement 9: What-If Scenario Simulation

**User Story:** As a strategic planner, I want to test how hypothetical scenarios would change the risk landscape, so that I can prepare contingency plans for different futures.

#### Acceptance Criteria

1. WHEN a what-if scenario is submitted for an existing completed analysis THE SYSTEM SHALL evaluate how the hypothetical scenario changes the risk landscape.
2. WHEN evaluating a scenario THE SYSTEM SHALL identify: which existing signals are amplified (with before/after scores), which are diminished (with before/after scores), what new signals would emerge, and the cascade propagation tree showing how the shock propagates through interconnected domains.
3. WHEN the what-if analysis completes THE SYSTEM SHALL provide a new overall risk level and a key insight summarizing the most important takeaway.
4. WHEN streaming what-if results THE SYSTEM SHALL use the same SSE protocol as the main analysis pipeline.

---

### Requirement 10: Analysis Persistence & History

**User Story:** As a returning analyst, I want to access my previous analyses, so that I can track how risk landscapes evolve over time.

#### Acceptance Criteria

1. WHEN an analysis completes THE SYSTEM SHALL persist the full results (config, country context, all agent outputs, final synthesis) to Firebase Firestore.
2. WHEN the analyst requests the run history THE SYSTEM SHALL return the 50 most recent analyses ordered by creation time, merging in-memory running analyses with persisted completed analyses.
3. WHEN a previous analysis is selected THE SYSTEM SHALL display the full results including all signals, constellations, assessment, and allow what-if scenarios to be run against it.
4. WHEN a what-if scenario completes THE SYSTEM SHALL persist it as a subcollection under the parent analysis document.

---

### Requirement 11: Interactive Analysis Dashboard

**User Story:** As an analyst, I want a rich interactive dashboard to explore analysis results, so that I can drill into individual signals, visualize connections, and identify patterns.

#### Acceptance Criteria

1. WHEN the analysis dashboard loads THE SYSTEM SHALL display an Agent Debate panel showing the real-time streaming output of each agent with status indicators (searching, hunting, cross-validating, challenging, synthesizing, concluded).
2. WHEN analysis completes THE SYSTEM SHALL display a Risk Signal Table with sortable columns for: signal name, domain, overall score, risk band, impact, lead-time, and reliability, with color-coded score cells.
3. WHEN the analyst clicks a signal row THE SYSTEM SHALL open a detail modal showing: all scores with visual bars, description, why-noise vs why-meaningful, evidence chain, agent perspectives (Signal Hunter, Corroboration, Devil's Advocate), monitoring triggers, and no-regret actions.
4. WHEN the Constellation Map tab is selected THE SYSTEM SHALL render a force-directed graph where node size represents the overall risk score, node color represents the risk band, and links connect signals within the same constellation.
5. WHEN the Fingerprints tab is selected THE SYSTEM SHALL display historical pre-crisis pattern matches with: historical case name, match strength, matching signals, divergences, timeline, and current stage estimate.
6. WHEN the What-If tab is selected THE SYSTEM SHALL provide a scenario input and display results as a cascade tree with amplified signals, diminished signals, new signals, and the updated risk level.
