# ClimateChain BD 🌊⛓️

> **AI-Assisted Climate Risk Intelligence with Independently Verifiable Blockchain Provenance**  
> **Event:** IEEE ClimateChain Global Hackathon — Climate Data & Environmental Monitoring  
> **Geographic Focus:** Sylhet Division, Bangladesh (Surma & Kushiyara River Basin)  
> **Developer:** Solo ([ragibcs](https://github.com/ragibcs/climatechain-bd))  
> **Status:** Fully Functional Vertical Slice MVP  

---

## 1. Mission & Differentiator

Catastrophic monsoon rainfall and rapid transboundary runoff from the Meghalaya plateau regularly inundate the low-lying haor wetlands of Sylhet, Sunamganj, and Kanaighat. During climate disasters, relief agencies, parametric climate insurers, and civic planners face two critical vulnerabilities:
1. **Uncalibrated Model Claims:** Black-box flood models frequently hallucinate or rely on fabricated flood labels.
2. **Auditability & Disputed Reports:** Impact assessments and historical meteorological snapshots can be quietly modified or dispute-tampered after the fact.

**ClimateChain BD** solves this by uniting **empirically grounded meteorological risk indexing** with **cryptographic on-chain provenance registration**:
- **Real Climate Telemetry:** Automated ingestion of ECMWF / ERA5 reanalysis and high-resolution numerical weather forecasts via Open-Meteo for Sylhet Sadar, Sunamganj, Kanaighat, and Zakiganj.
- **Defensible Risk Semantics:** Implements the **Sylhet Rainfall Risk Index (SRRI)** calibrated directly against Bangladesh Meteorological Department (BMD) rainfall intensity thresholds, using strictly past-only rolling features (no future leakage).
- **Cryptographic Provenance:** Normalizes prediction reports into canonical deterministic JSON and commits domain-separated SHA-256 hashes (`bytes32`) to the `ClimateProvenance.sol` EVM smart contract on Sepolia testnet.
- **Instant Tamper Detection:** A 5-state verification engine (`VERIFIED`, `MISMATCH`, `NOT_FOUND`, `UNAVAILABLE`, `PENDING`) that immediately detects if a single byte in a historical report has been modified.

---

## 2. Research Prototype & Non-Official Disclaimer

> [!IMPORTANT]
> **Research Prototype Notice:** ClimateChain BD is an academic and technological proof-of-concept developed for the IEEE ClimateChain Global Hackathon. It is **NOT** an official flood forecasting or evacuation warning system. Machine-readable daily flood ground-truth polygons were unavailable in open public APIs; our scores represent empirical meteorological rainfall risk indicators rather than official hydrological warnings. Always consult the **Flood Forecasting and Warning Centre (FFWC)** and the **Bangladesh Meteorological Department (BMD)** for life-safety advisories.

---

## 3. Architecture

```text
climatechain-bd/
├── apps/
│   └── web/                         # Next.js 14 + TypeScript + Tailwind CSS UI
│       ├── src/app/                 # Layout, global styles, and page
│       └── src/components/          # Map, observation charts, risk gauge, provenance & tamper demo
├── services/
│   └── api/                         # FastAPI intelligence & blockchain service
│       ├── main.py                  # REST API endpoints (locations, risk, predictions, provenance)
│       └── provenance/              # Canonical JSON, SHA-256, Web3 client, ClimateProvenance ABI
├── ml/
│   ├── data/                        # Stations metadata, Open-Meteo ingestion, validation & caching
│   ├── features.py                  # BMD-calibrated SRRI formula & past-only rolling windows
│   └── inference.py                 # Structured prediction schema & report generator
├── contracts/
│   ├── contracts/                   # Solidity smart contract: ClimateProvenance.sol
│   ├── test/                        # Hardhat unit tests (10/10 passing)
│   ├── scripts/                     # Deployment scripts for EVM networks
│   └── hardhat.config.js            # Hardhat configuration (Solidity 0.8.24)
├── data/
│   ├── samples/                     # Real historical monsoon observation snapshots
│   └── manifests/                   # Cryptographic data provenance manifests with SHA-256
├── docs/                            # In-depth engineering documentation
│   ├── architecture.md              # System design & component interaction
│   ├── data-feasibility.md          # Sourcing feasibility & target gate decision
│   ├── model-card.md                # SRRI formula, factors, and limitations
│   ├── smart-contract.md            # ClimateProvenance.sol specifications
│   ├── threat-model.md              # Security analysis & failure modes
│   └── demo-script.md               # 3–5 minute presentation narrative
├── tests/                           # Complete test suite (data, ML, contract, API)
├── docker-compose.yml               # Multi-container orchestration
└── Makefile                         # One-command developer workflows
```

---

## 4. Quickstart: Running Locally

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ (tested on Node.js 20 & 26)
- npm 9+

### Option A: Standard Setup (Makefile)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ragibcs/climatechain-bd.git
   cd climatechain-bd
   ```

2. **Install dependencies:**
   ```bash
   make install
   ```

3. **Ingest real Sylhet climate data:**
   ```bash
   make seed-data
   ```

4. **Run the test suite:**
   ```bash
   make test
   ```
   *(Runs both Python pytest suite and Hardhat smart contract tests)*

5. **Start the API service (Port 8000):**
   ```bash
   make run-api
   ```

6. **Start the Web Dashboard (Port 3000):**
   ```bash
   make run-web
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Option B: Docker Compose

```bash
docker-compose up --build
```
- Web UI: [http://localhost:3000](http://localhost:3000)
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 5. Verification & Test Results

All test suites execute deterministically:

### Python Test Suite (`pytest tests/ -v`)
- `tests/test_data_pipeline.py`: Schema validation, range boundaries, past-only rolling window correctness, no-future-leakage guarantee.
- `tests/test_risk_engine.py`: Structured prediction schema, factor calculations, limitation disclosures.
- `tests/test_provenance.py`: Canonical JSON serialization determinism, domain-separated hashing, lifecycle registration, and tamper detection.
- `tests/test_api.py`: Full FastAPI integration tests for `/api/health`, `/api/locations`, `/api/observations`, `/api/risk`, `/api/predictions`, and `/api/provenance/*`.
- **Result:** **10/10 tests passed.**

### Smart Contract Test Suite (`npx hardhat test`)
- Rejection of zero report IDs and hashes (`ZeroReportId`, `ZeroDataHash`, `ZeroReportHash`).
- Rejection of duplicate report IDs (`ReportAlreadyRegistered`).
- Event emission (`ReportRegistered`).
- On-chain record retrieval and tamper detection verification.
- **Result:** **10/10 tests passed.**

### Frontend Production Build (`npm run build`)
- Next.js 14 optimized production build.
- Strict TypeScript type-checking and ESLint validation.
- **Result:** **Compiled successfully with zero errors.**

---

## 6. Smart Contract Details

- **Contract File:** [`contracts/contracts/ClimateProvenance.sol`](contracts/contracts/ClimateProvenance.sol)
- **Target Network:** Sepolia Testnet (Chain ID `11155111`)
- **Key Methods:**
  - `registerReport(bytes32 reportId, bytes32 dataHash, bytes32 reportHash, string modelVersion, string metadataUri)`
  - `getReport(bytes32 reportId) external view returns (ReportRecord memory)`
  - `verifyReport(bytes32 reportId, bytes32 computedReportHash) external view returns (bool, bool)`

---

## 7. Submission Checklist & Author

- [x] Functional end-to-end vertical slice (Data Ingestion → Risk Engine → FastAPI → Next.js Dashboard → Smart Contract Provenance).
- [x] Real meteorological data from Open-Meteo for Sylhet stations.
- [x] Honest data feasibility disclosure (no fabricated flood labels).
- [x] 100% passing automated tests across backend, contracts, and frontend.
- [x] Docker Compose and Makefile for immediate evaluator reproduction.
- [x] Complete technical documentation (Architecture, Threat Model, Model Card, Data Sources, Demo Script).
- [x] MIT Open Source License.

**Repository:** [https://github.com/ragibcs/climatechain-bd](https://github.com/ragibcs/climatechain-bd)  
**Developer:** Ragib ([ragibcs](https://github.com/ragibcs))
