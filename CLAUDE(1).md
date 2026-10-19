# ClimateChain BD --- Agentic Implementation Guide

> **Primary coding environment:** Google Antigravity\
> **Preferred agent model:** Gemini 3.8 High (select the available
> matching model in Antigravity; model names and availability may vary
> by account)\
> **Project:** IEEE ClimateChain Global Hackathon --- Climate Data &
> Environmental Monitoring\
> **Geographic scope:** Sylhet, Bangladesh, focused initially on the
> Surma River/Sylhet-area flood context\
> **Developer:** Solo\
> **Target submission deadline:** 25 October 2026, 8:00 PM Bangladesh
> time (UTC+6)\
> **Repository name:** `climatechain-bd`

This file is the implementation contract for the coding agent. Read it
before changing code. Work in the existing repository rather than
blindly replacing it. Inspect the current files, preserve useful work,
and implement the project incrementally with tests and meaningful Git
commits.

------------------------------------------------------------------------

## 1. Mission

Build a polished, reproducible climate-intelligence web application
that:

1.  Collects and validates climate observations relevant to Sylhet.
2.  Produces a defensible flood-risk output using either:
    -   a supervised model trained and evaluated on verified flood
        labels, **only if suitable labels can be obtained**, or
    -   a clearly labelled rainfall-risk indicator when verified labels
        are unavailable.
3.  Explains the output and communicates source freshness, uncertainty,
    and limitations.
4.  Registers cryptographic commitments to data snapshots and prediction
    reports on an EVM-compatible testnet.
5.  Allows users to verify an unchanged report and detect changes to a
    committed report.
6.  Includes complete documentation, tests, deployment configuration,
    and a hackathon-ready demo.

The core differentiator is **AI-assisted climate-risk analysis plus
independently verifiable report integrity**. Do not add blockchain
merely as decoration.

## 2. Non-negotiable engineering and safety rules

-   Never claim that the application is an official flood-warning
    system. Clearly label it a research prototype.
-   Never fabricate weather observations, river-gauge readings, flood
    labels, model metrics, blockchain transactions, or data-source
    availability.
-   Never describe a rainfall heuristic as a validated flood
    probability.
-   Never show hard-coded demo scores as live model predictions. Any
    fixture or mock data must be visibly marked as demo data.
-   A blockchain hash proves a byte-level match to a commitment; it does
    **not** prove that source data is truthful or that a prediction is
    scientifically correct.
-   Keep raw climate data, reports, model artifacts, and secrets
    off-chain. Store only compact hashes and non-sensitive provenance
    metadata on-chain.
-   Do not commit `.env`, private keys, RPC credentials, API tokens, or
    other secrets.
-   Never put a deployer private key in browser code or client-visible
    environment variables.
-   Use a dedicated testnet wallet only. Do not deploy to mainnet.
-   Do not add a token, NFT, financial transaction, or wallet-connect
    flow unless essential to the verified MVP.
-   Use UTC/ISO-8601 timestamps internally, retain source timestamps and
    timezone metadata, and display Bangladesh local time where useful.
-   Validate external API responses and handle timeouts, missing data,
    stale data, rate limits, and RPC outages explicitly.
-   Do not silently replace missing measurements with zero.
-   Use chronological train/validation/test splits for time-dependent
    model evaluation. Prevent leakage from rolling windows and
    overlapping records.
-   Never claim model performance unless it was computed by a
    reproducible test command against documented labels.
-   Pin dependencies where practical and use secure, maintained
    libraries.
-   Keep the app useful when the blockchain RPC is down. Verification
    must return `UNAVAILABLE`, not a false `MISMATCH`, when it cannot
    reach the chain or retrieve the report.
-   Do not make destructive changes, delete user work, rewrite Git
    history, or force-push without explicit approval.
-   Never claim a command or test succeeded unless you ran it and
    observed the result.

## 3. Scope and definition of done

### Required MVP

1.  **Data pipeline**
    -   Download historical weather for selected Sylhet-area
        coordinates.
    -   Record source, retrieval time, source period, coordinates,
        units, and relevant metadata.
    -   Validate schema, duplicates, missingness, and plausible value
        ranges.
    -   Compute past-only rolling precipitation features.
    -   Provide a documented method to add verified gauge data later.
2.  **Risk engine**
    -   Inspect label availability before choosing a modelling approach.
    -   If verified event labels or suitable gauge-threshold targets are
        available, train a baseline classifier and evaluate it
        chronologically.
    -   If they are unavailable, use a transparent, documented
        rainfall-risk index and label it as an indicator, not a flood
        probability.
    -   Return a stable prediction schema with target definition,
        model/version, `as_of` time, data quality, explanation, and
        limitations.
    -   Include a model card and evaluation report.
3.  **Dashboard**
    -   Responsive, polished web UI.
    -   Sylhet-area map using real geographic coordinates and actual
        data.
    -   Observation/source details and data freshness.
    -   Risk overview, historical charts, and prediction explanation.
    -   Visible limitations and non-official-warning notice.
    -   Provenance registration and report verification states.
4.  **Blockchain provenance**
    -   Solidity contract on a local development chain first; public
        testnet deployment only after tests pass.
    -   Register deterministic report ID, data hash, report hash, model
        version, metadata URI, block timestamp, and submitter.
    -   Read stored records and verify hashes.
    -   Detect changed report content.
    -   Handle duplicate registration, missing report, transaction
        pending/reverted, and RPC outage.
5.  **Quality and submission**
    -   Automated tests, linting, type checking, and production build.
    -   `.env.example` with placeholders only.
    -   Docker Compose for local development where practical.
    -   Public README, architecture diagram, data-source documentation,
        model card, threat model, contract instructions, and demo
        script.
    -   A 3--5 minute demo flow and final submission checklist.

### Explicitly out of scope

-   National-scale operational flood forecasting.
-   Custom deep-learning satellite segmentation.
-   Mobile apps.
-   Kubernetes, microservices, Redis, Celery, or other infrastructure
    not required for the MVP.
-   Production emergency alerts.
-   Mainnet deployment, tokens, NFTs, or financial features.

## 4. Required stack

Use these choices unless the repository already contains a working,
justified alternative. Do not migrate frameworks merely for preference.

-   Frontend: Next.js + TypeScript + Tailwind CSS.
-   Map: MapLibre GL JS.
-   API: Python + FastAPI + Pydantic.
-   Data processing: Pandas + NumPy.
-   ML: scikit-learn plus XGBoost or LightGBM if suitable.
-   Explainability: SHAP for supported trained models; transparent rule
    explanations for a heuristic index.
-   Database: PostgreSQL for deployment; SQLite may be used for a
    lightweight local-only prototype if it reduces risk.
-   Smart contracts: Solidity `^0.8.24`, Hardhat, and OpenZeppelin where
    useful.
-   Chain: Sepolia testnet, after local tests pass.
-   Testing: pytest, frontend tests/lint/type-check, Hardhat tests.
-   Packaging: Docker Compose where it helps reproducibility.
-   CI: GitHub Actions.

Use a single API service and a scheduled/manual ingestion script. Avoid
unnecessary services.

## 5. Data sourcing and target-selection gate

### Candidate sources

-   Open-Meteo Historical Weather API:
    `https://open-meteo.com/en/docs/historical-weather-api`
-   NASA GPM IMERG: `https://gpm.nasa.gov/data/imerg`
-   Bangladesh Flood Forecasting and Warning Centre:
    `https://ffwc.gov.bd/`
-   Bangladesh Water Development Board, where relevant data is
    accessible.
-   Suitable dated flood-extent products or other documented flood-event
    labels, if access and licensing permit.

These are candidate sources, not guarantees that every desired variable,
API, historical period, or redistribution permission is available.
Verify actual responses, metadata, access requirements, licensing, and
source attribution. Do not invent an API endpoint for an official
source.

### First task: a data feasibility report

Before training a model, create `docs/data-feasibility.md` documenting:

-   Which sources were actually accessed.
-   Variables, spatial coverage, temporal coverage, units, and
    missingness.
-   Whether flood labels exist and their exact definition.
-   Whether gauge station identifiers and danger levels are documented.
-   Licences, attribution requirements, and redistribution limitations.
-   Which target can honestly be evaluated before the deadline.

### Decision tree

1.  If verified flood-event labels are available, use a documented
    event-classification target.
2.  If historical gauge observations and a documented danger threshold
    are available in sufficient quantity, consider predicting future
    threshold exceedance at an explicit horizon.
3.  Otherwise, build a transparent rainfall-risk indicator and label it
    accurately. Do not manufacture labels to make a classifier appear to
    work.

The initial dataset schema should support:

-   `date`
-   `location_id`
-   `latitude`
-   `longitude`
-   `rainfall_mm`
-   `rainfall_3d_mm`
-   `rainfall_7d_mm`
-   `river_level_m` (nullable)
-   `danger_level_m` (nullable)
-   `flood_label` (nullable)
-   `source_id`
-   `quality_flag`

Use a consistent location/date grain. Derived rolling features must use
only information available at the prediction cutoff. Missing data
remains missing until a documented strategy is applied.

A single approximate Sylhet coordinate is acceptable for a pipeline
smoke test, but it is not sufficient by itself to claim spatial flood
prediction. Start with a small set of locations with consistent data; do
not invent readings for locations without coverage.

## 6. AI model and evaluation contract

### Baseline model

Prefer a gradient-boosted tree classifier or a simple scikit-learn
baseline. Do not begin with LSTM/deep learning. Candidate features
include:

-   Daily precipitation.
-   Trailing 3-day and 7-day precipitation.
-   Seasonal rainfall anomaly calculated from training-period statistics
    only.
-   Observed river level relative to a verified station danger level, if
    available.
-   Recent river-level change, if observations are sufficiently
    reliable.
-   Seasonality variables, if justified by validation.

Do not use future observations or features that would not exist at the
prediction time. If using forecast weather, train and evaluate with the
same forecast-input setup.

### Evaluation requirements

-   Chronological train/validation/test splits.
-   Explicit date ranges and positive-event counts in every split.
-   Fit preprocessing only on training data.
-   Compare against a simple baseline.
-   Report precision, recall, F1, and PR-AUC for classification when
    appropriate.
-   Report MAE/RMSE only for a suitable continuous target.
-   Disclose small sample sizes and inconclusive results.
-   Save evaluation metrics and configuration to a reproducible
    artifact.
-   Do not overstate generalization from one station or one event.

### Prediction schema

Use a validated API response containing at least:

-   `location_id`
-   `as_of`
-   `target`
-   `risk_level`
-   `score` (nullable; only populate when its meaning is defined)
-   `model_version`
-   `data_quality`
-   `explanation`
-   `limitations`

If the engine is heuristic, include an explicit target/type such as
`rainfall_risk_indicator`; do not call the score a calibrated
probability.

## 7. Blockchain design contract

### Canonical hashing

Create one documented canonicalization implementation used by both
registration and verification.

-   Define a versioned schema.
-   Normalize timestamp representation, units, strings, numeric
    precision, nulls, and field ordering.
-   Serialize deterministically.
-   Use domain-separated hashes for data batches and prediction reports.
-   Use SHA-256 off-chain and convert to `bytes32` consistently for
    Solidity.
-   Create deterministic report IDs from a documented stable input or
    secure random identifier stored with the report. Do not let users
    submit arbitrary hashes as proof of validity.
-   Include the canonicalization/schema version in metadata.

Do not hash arbitrary pretty-printed JSON strings. Equivalent JSON
objects can differ at the byte level.

### Contract behavior

The contract must:

-   Reject zero IDs/hashes and empty required metadata.
-   Reject duplicate report IDs.
-   Store data hash, report hash, model version, metadata URI,
    registration timestamp, and submitter.
-   Emit an indexed event for registration.
-   Expose a read function for the report.
-   Have unit tests for valid registration, invalid input, duplicate
    IDs, event contents, and record retrieval.

Do not add complex access control unless required by the design. Explain
who can register records. Registration should be permissionless for the
MVP unless a justified restriction is implemented.

### Verification states

-   `VERIFIED`: report was retrieved, canonicalized, and its computed
    hash equals the stored on-chain hash.
-   `MISMATCH`: the report was successfully retrieved and its computed
    hash differs from the stored hash.
-   `NOT_FOUND`: no corresponding on-chain record exists.
-   `UNAVAILABLE`: RPC, report storage, or another required dependency
    could not be reached.
-   `PENDING`: transaction has been submitted but not confirmed.

Never translate a network failure into `MISMATCH`. Never report success
merely because a transaction was submitted; wait for receipt
confirmation and handle reverted transactions.

### Security

-   Test locally before testnet deployment.
-   Use environment variables for RPC URL and deployer private key.
-   Keep private keys server-side and out of Git and logs.
-   Use a dedicated testnet wallet.
-   Never put sensitive or personal data on-chain.
-   Do not claim the contract has been professionally audited.
-   Store contract address, chain ID, ABI/version, deployment
    transaction, and explorer URL in documented deployment metadata.

## 8. API contract

Implement and document the following endpoints, adjusting only if the
existing architecture has a good reason:

-   `GET /api/health`
-   `GET /api/locations`
-   `GET /api/observations?location_id=...`
-   `GET /api/risk?location_id=...`
-   `POST /api/predictions`
-   `POST /api/provenance/register`
-   `GET /api/provenance/{report_id}`
-   `POST /api/provenance/verify`

Requirements:

-   Pydantic validation and clear HTTP status codes.
-   Bounded timeouts for external APIs and RPC.
-   Safe error messages without leaking secrets.
-   Input validation for location IDs and report IDs.
-   Rate limiting or reasonable protection for public write endpoints.
-   CORS restricted to configured frontend origins in deployment.
-   Health endpoint distinguishes application health from external
    dependency status.
-   No endpoint returns hard-coded success for unimplemented behavior.

## 9. Frontend UX requirements

Create an environmental intelligence interface, not a generic admin
dashboard.

Required pages or sections:

1.  Overview: current data status, selected area, risk output, last
    update.
2.  Map: real coordinates, location selection, visible data-coverage
    gaps.
3.  Observations: rainfall time series and optional river gauge series.
4.  Explanation: actual model-derived factors or explicit heuristic
    rules.
5.  Provenance: report ID, data/report hashes, chain/network,
    transaction link, verification state.
6.  Methodology: data sources, model target, evaluation, uncertainty,
    and limitations.

Design expectations:

-   Responsive and accessible; keyboard navigation and readable
    contrast.
-   Clear loading, empty, stale, error, and unavailable states.
-   Use labels and units consistently.
-   Show timestamps in a clear timezone.
-   Avoid fabricated risk scores or decorative fake map data.
-   Clearly mark demo fixtures.
-   Do not imply official endorsement.
-   Include a persistent prototype disclaimer near risk results.

## 10. Repository structure

Prefer this structure, adapting to existing files instead of replacing a
working repository:

``` text
climatechain-bd/
├── apps/
│   └── web/
├── services/
│   └── api/
├── ml/
│   ├── data/
│   ├── features.py
│   ├── train.py
│   ├── evaluate.py
│   └── inference.py
├── contracts/
│   ├── contracts/
│   │   └── ClimateProvenance.sol
│   ├── test/
│   ├── scripts/
│   └── hardhat.config.ts
├── data/
│   ├── samples/
│   └── manifests/
├── docs/
│   ├── architecture.md
│   ├── data-feasibility.md
│   ├── data-sources.md
│   ├── model-card.md
│   ├── smart-contract.md
│   ├── threat-model.md
│   └── demo-script.md
├── tests/
├── .github/workflows/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── Makefile
├── README.md
└── LICENSE
```

Do not commit large datasets, secrets, local databases, build outputs,
caches, or model artifacts unless intentionally versioned and permitted
by the source licence.

## 11. Environment variables

Create `.env.example` containing placeholders only. Names may be adapted
consistently to the implementation:

``` dotenv
DATABASE_URL=
OPEN_METEO_BASE_URL=https://archive-api.open-meteo.com/v1/archive
MODEL_PATH=ml/artifacts/model.joblib
MODEL_VERSION=baseline-v1

CHAIN_ID=11155111
RPC_URL=
DEPLOYER_PRIVATE_KEY=
CONTRACT_ADDRESS=

FRONTEND_ORIGIN=
```

Do not assume these variables are configured. Validate required settings
at startup and give actionable errors. `DEPLOYER_PRIVATE_KEY` must only
be available to the deployment process or a protected server-side
component that needs it; a read-only verifier should not require it.

## 12. Tests and acceptance criteria

### Data tests

-   Schema and required-column validation.
-   Duplicate location/date detection.
-   Missingness and invalid-range handling.
-   Rolling-window correctness.
-   No future-data leakage.
-   Source timestamp and unit consistency.
-   Stale-data detection.
-   Repeat ingestion does not corrupt or duplicate records.

### ML tests

-   Training and evaluation commands run reproducibly.
-   Temporal splits are respected.
-   Preprocessing is fit on training data only.
-   Output schema is valid.
-   Missing required features produce a safe error or documented
    fallback.
-   Heuristic output is not represented as a probability.
-   Metrics are generated from real labels only.

### Contract tests

-   Valid record registration.
-   Zero/empty input rejection.
-   Duplicate report ID rejection.
-   Event fields are correct.
-   Read function returns the stored values.
-   Hash conversion/canonicalization test vectors match the Python
    implementation.

### Integration tests

1.  Register a report and verify the unchanged report.
2.  Verify the same report again without an unnecessary duplicate
    transaction.
3.  Modify one report field and verify it returns `MISMATCH`.
4.  Request an unknown report and get `NOT_FOUND`.
5.  Simulate RPC failure and get `UNAVAILABLE`.
6.  Submit a transaction that reverts and ensure the UI does not claim
    success.
7.  Load the dashboard with missing/stale observations.
8.  Run the application from a clean checkout using documented setup
    instructions.

### Release gate

Do not call the MVP done until:

-   Backend tests pass.
-   Contract tests pass.
-   Frontend lint/type checks and production build pass.
-   No secrets are present in the repository.
-   The demo flow works end-to-end.
-   Public links work in a fresh browser session.
-   README setup instructions have been tested.
-   Model limitations and data licences are documented.

If any check cannot be run, report it explicitly in the final handoff.

## 13. Implementation schedule

Target completion before the final deadline day. Prioritize a working
vertical slice over feature count.

### Phase 0 --- Inspect and plan (first session; maximum 30--45 minutes)

-   Inspect the repository, current branch, files, package managers, and
    existing implementation.
-   Read any existing README and project notes.
-   Create or update `docs/implementation-plan.md`.
-   Identify the shortest path to a working data → risk output →
    provenance → dashboard flow.
-   Do not spend hours writing plans instead of building.

### Phase 1 --- Data feasibility and vertical slice

-   Implement weather data download for Sylhet-area coordinates.
-   Save a source manifest and validation report.
-   Confirm access to flood labels/gauge observations.
-   Implement either the justified baseline model or the clearly
    labelled risk indicator.
-   Add the first API endpoint and a minimal UI showing actual data.

### Phase 2 --- Provenance

-   Implement canonicalization and hash test vectors.
-   Implement the contract and local-chain tests.
-   Implement API registration and verification.
-   Demonstrate valid verification and tampering detection.
-   Deploy to Sepolia only when local tests pass and credentials are
    configured.

### Phase 3 --- Dashboard and integration

-   Build map, observations, risk explanation, data freshness and
    provenance sections.
-   Add error and unavailable states.
-   Connect all UI actions to real endpoints.
-   Remove placeholders or visibly label demo fixtures.

### Phase 4 --- Hardening and release

-   Run all tests, lint, type checks and production builds.
-   Verify deployment and public URLs.
-   Complete README, model card, data-source notes, threat model, and
    demo script.
-   Record a 3--5 minute demonstration.
-   Complete the submission checklist.

### Deadline rule

The target deadline is **25 October 2026, 8:00 PM Bangladesh time
(UTC+6)**. Treat the official organizer/Devpost deadline as
authoritative and verify it because event listings can change or
conflict. Aim to submit by **2:00 PM Bangladesh time on 25 October**. Do
not schedule risky architecture changes on the final day.

## 14. Git workflow

Use small, meaningful commits and keep the main branch runnable.

Suggested commits:

``` text
chore: initialize ClimateChain BD monorepo
data: add reproducible Sylhet weather ingestion
ml: add baseline risk engine and temporal evaluation
contracts: implement climate report provenance
api: add prediction and verification endpoints
ui: build Sylhet climate intelligence dashboard
test: add data integrity and failure-path coverage
docs: add setup guide, model card, and demo script
release: prepare hackathon submission
```

Before committing:

1.  Inspect `git status` and the diff.
2.  Run the relevant tests.
3.  Ensure no secrets or prohibited datasets are staged.
4.  Commit only coherent, reviewable changes.
5.  Do not force-push, rewrite history, or overwrite user changes
    without permission.
6.  Do not claim a push succeeded unless the command confirms it. If
    authentication or network access fails, provide the exact remaining
    command and explain the blocker.

## 15. Demo narrative

Target 4 minutes, within the requested 3--5 minute window:

-   `0:00–0:30` --- Explain the Sylhet flood-risk problem and project
    goal.
-   `0:30–1:15` --- Show real observations, timestamps, source metadata,
    and map.
-   `1:15–2:10` --- Generate or inspect a risk output and explain its
    actual factors.
-   `2:10–3:15` --- Register a report and show its confirmed testnet
    transaction and verification.
-   `3:15–3:40` --- Change the report and demonstrate hash mismatch
    detection.
-   `3:40–4:00` --- Explain impact, limitations, and next steps.

Keep a backup recording in case an external API or testnet is
unavailable. Clearly label prerecorded results and never describe an
earlier transaction as a live one.

## 16. Required final handoff from the coding agent

At the end, provide a concise but complete handoff containing:

1.  Features actually implemented.
2.  Architecture and key file paths.
3.  Commands executed and their actual test/build results.
4.  Data sources accessed, coverage, and label feasibility.
5.  Model target and real evaluation metrics, or a clear statement that
    the output is a heuristic.
6.  Contract address, chain ID, deployment transaction, and explorer URL
    if deployed; otherwise state why not.
7.  Local run and deployment instructions.
8.  Environment variables the developer must supply.
9.  Known bugs, limitations, and remaining risks.
10. Exact remaining hackathon submission steps.
11. Git commit hashes and push status, if commits/pushes were performed.

Do not hide failed tests or unfinished features. Do not report a green
status unless the relevant checks were actually run.

------------------------------------------------------------------------

## 17. First instruction to the agent

Start now. Inspect the current repository and environment before
editing. Then:

1.  Summarize the existing state in a few bullets.
2.  Identify any blocker that genuinely prevents the MVP.
3.  Create a short task checklist with the highest-risk work first.
4.  Implement the first end-to-end vertical slice immediately.
5.  Run tests after each meaningful change.
6.  Update the README and progress checklist as the implementation
    changes.
7.  Make a meaningful Git commit when a coherent, tested milestone is
    complete.

Work autonomously within this scope. Ask the developer only when a
decision requires credentials, irreversible action, a paid service, an
unresolved product choice, or a real-world claim that cannot be
verified. Never fabricate credentials or external service results.

**Success means a real, testable climate-data workflow with honest risk
semantics and working tamper-evident report verification---not merely a
visually impressive prototype.**
