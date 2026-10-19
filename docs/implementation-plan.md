# ClimateChain BD — Implementation Plan & Prioritized Checklist

## 1. Project Overview & Objectives
**Project:** ClimateChain BD (Sylhet, Bangladesh Flood & Rainfall Risk with Blockchain Provenance)
**Focus:** Sylhet Division / Surma River Basin (Sylhet Sadar, Sunamganj, Kanaighat, Zakiganj)
**Core Mission:** AI/heuristic-assisted climate risk intelligence combined with independently verifiable report integrity registered cryptographically on an EVM blockchain.

## 2. Environment & Repository Baseline State
- **Branch:** `main` (clean initial commit needed, remote `origin` configured to `https://github.com/ragibcs/climatechain-bd`).
- **Python:** 3.14.8 with a dedicated `.venv` virtual environment.
- **Node.js:** v26.11.1, npm 12.2.1.
- **Docker / Docker Compose:** Docker 29.9.1, Compose 5.6.0 available.
- **Data Source Access:** Open-Meteo Historical & Forecast Weather APIs tested and functioning for Sylhet coordinates (Lat: 24.8949, Lon: 91.8687) without API keys.
- **Target Gate Decision:** Official daily flood ground-truth labels and real-time BWDB river gauge APIs are not publicly/programmatically accessible without manual scraping/government intranet. Following `CLAUDE.md` Section 5 decision tree, we will implement a defensible, transparent, and clearly labeled **Rainfall-Risk Indicator (`rainfall_risk_indicator`)** with rolling accumulation (1-day, 3-day, 7-day) and historical percentile thresholds, explicitly documenting that it is not an official flood warning system.

---

## 3. Prioritized Task Checklist

### Phase 0: Baseline Setup & Data Feasibility
- [x] Inspect existing repo, environment, Python, Node, Git status.
- [x] Test Open-Meteo real data retrieval for Sylhet coordinates.
- [x] Establish `.gitignore` to protect credentials, local artifacts, `.venv`, `node_modules`.
- [x] Create `docs/data-feasibility.md` documenting accessed data sources, variables, coverage, and target selection.
- [x] Initial commit: initialize monorepo structure and documentation baseline.

### Phase 1: Data Ingestion & Risk Engine (Vertical Slice Core)
- [ ] Implement data ingestion module (`ml/data/ingestion.py`):
  - Sylhet stations: Sylhet Sadar (`24.8949, 91.8687`), Sunamganj (`25.0667, 91.4000`), Kanaighat (`25.0000, 92.2667`), Zakiganj (`24.8833, 92.3667`).
  - Schema: `date, location_id, latitude, longitude, rainfall_mm, rainfall_3d_mm, rainfall_7d_mm, source_id, quality_flag`.
  - Range validation, missing value detection, rolling past-only window computation.
  - Source manifest and data validation logging (`data/samples/`, `data/manifests/`).
- [ ] Implement Risk Engine (`ml/features.py`, `ml/inference.py`):
  - Transparent Rainfall Risk Indicator calculation based on cumulative precipitation (extreme monsoon thresholds calibrated to Bangladesh Meteorological Department / Sylhet regional averages).
  - Risk classification (`LOW`, `MODERATE`, `HIGH`, `SEVERE`) with explicit score, factors, and limitation explanations.
  - Model Card (`docs/model-card.md`).
- [ ] Unit & data integrity tests (`tests/test_data_pipeline.py`, `tests/test_risk_engine.py`).

### Phase 2: Canonicalization & Blockchain Provenance
- [ ] Implement deterministic canonical JSON serialization and SHA-256 / `bytes32` hashing (`services/api/provenance/canonical.py`).
- [ ] Smart contract (`contracts/contracts/ClimateProvenance.sol`):
  - Store `reportId`, `dataHash`, `reportHash`, `modelVersion`, `metadataUri`, `timestamp`, `submitter`.
  - Prevent duplicate `reportId`, validate non-zero hashes.
  - Event emission: `ReportRegistered`.
  - Read function: `getReport(bytes32 reportId)`.
- [ ] Hardhat setup and contract unit tests (`contracts/test/ClimateProvenance.test.ts`):
  - Test valid registration, zero hash rejection, duplicate ID rejection, tamper simulation.
  - Export contract artifacts (ABI, Bytecode).
- [ ] Python contract client & local simulator / RPC connector (`services/api/provenance/client.py`) supporting:
  - EVM Web3 testnet interaction (Sepolia) or local EVM / mocked provider with full verification state machine (`VERIFIED`, `MISMATCH`, `NOT_FOUND`, `UNAVAILABLE`, `PENDING`).

### Phase 3: FastAPI Backend Implementation
- [ ] Build FastAPI application (`services/api/main.py`) with endpoints:
  - `GET /api/health`
  - `GET /api/locations`
  - `GET /api/observations`
  - `GET /api/risk`
  - `POST /api/predictions`
  - `POST /api/provenance/register`
  - `GET /api/provenance/{report_id}`
  - `POST /api/provenance/verify`
- [ ] API integration tests (`tests/test_api.py`) verifying all endpoints, error handling, tamper detection, and offline fallback.

### Phase 4: Frontend Intelligence Dashboard
- [ ] Build Next.js + TypeScript + Tailwind CSS application (`apps/web`):
  - **Overview:** Active station stats, current risk level, recent rainfall, prototype disclaimer.
  - **Interactive Map:** Sylhet regional stations with coordinates, risk color coding, coverage status.
  - **Observations:** Historical & forecast rainfall charts with past-only rolling trends.
  - **Explanation:** Factors driving risk level, percentile metrics, limitations.
  - **Provenance & Verification:** Register report on-chain, display tx hash/report ID, and interactive "Verify Report" tool demonstrating `VERIFIED` and `MISMATCH` tamper detection.
  - **Methodology:** Data sources, formulas, caveats, research prototype notices.

### Phase 5: Verification, Documentation & Hackathon Packaging
- [ ] Docker Compose (`docker-compose.yml`) for seamless one-command local startup.
- [ ] Complete documentation: `README.md`, `docs/architecture.md`, `docs/threat-model.md`, `docs/demo-script.md`, `docs/smart-contract.md`.
- [ ] Run complete test suite (backend tests, contract tests, frontend build).
- [ ] Final handoff report with actual test logs, deployment status, and submission checklist.
