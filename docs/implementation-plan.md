# ClimateChain BD — Implementation Plan & Winning Roadmap

> **Status:** implemented vertical slice + polish pass (v1.1)
> **Deadline target:** 25 October 2026, 8:00 PM Bangladesh time (UTC+6)
> **Scope:** Sylhet Division / Surma–Kushiyara basin — Sylhet Sadar, Sunamganj, Kanaighat, Zakiganj

This plan is both a build checklist and a judge-facing narrative. It records what is
actually implemented, what is deliberately out of scope, and the highest-leverage work
that remains before submission.

---

## 1. Product thesis

Climate disasters create two separate trust problems:

1. **Uncertain science** — a risk score can be wrong, opaque, or trained on invented
   flood labels.
2. **Unstable evidence** — the report behind a payout, grant, or evacuation decision can
   be quietly edited after the fact.

ClimateChain BD addresses both with a deliberately narrow, defensible stack:

- **Open rainfall data:** ECMWF / ERA5 daily precipitation via Open-Meteo, ingested for
  four Surma–Kushiyara stations.
- **Transparent risk semantics:** the Sylhet Rainfall Risk Index (SRRI), an explicitly
  labelled rainfall-risk indicator calibrated to BMD intensity classes — never presented
  as a validated flood probability.
- **Tamper-evident provenance:** canonical JSON → domain-separated SHA-256 → `bytes32`
  commitment on `ClimateProvenance.sol` (Sepolia when a signer is configured, otherwise a
  labelled simulator) → five-state verification (`VERIFIED`, `MISMATCH`, `NOT_FOUND`,
  `UNAVAILABLE`, `PENDING`).
- **Honest failure:** missing flood labels and river gauges stay `null`; RPC failure is
  surfaced as `UNAVAILABLE` rather than a false success.

---

## 2. What is implemented (v1.1)

### Data & feature layer
- [x] Four-station metadata with real coordinates, rivers, BWDB station IDs, and danger levels.
- [x] Open-Meteo archive + forecast ingestion with timeouts, range validation, deduplication, and in-process TTL cache.
- [x] Strictly past-only rolling 3-day and 7-day precipitation windows.
- [x] Committed sample snapshots + SHA-256 manifests under `data/samples` and `data/manifests`.
- [x] Runtime integrity endpoint (`GET /api/datasets`) that recomputes each manifest hash.

### Risk engine
- [x] Weighted SRRI: 50% 24h, 30% 3-day, 20% 7-day rainfall.
- [x] LOW / MODERATE / HIGH / SEVERE bands with severity labels and factor contributions.
- [x] Natural-language summaries, peak-3-day metric, one-day delta, 14-day trend.
- [x] Basin overview and station ranking across all four nodes.
- [x] Explicit `data_mode` (`LIVE_OBSERVED`, `HISTORICAL_REANALYSIS`, `OFFLINE_CACHE`, `FORECAST`).
- [x] Explicit `data_quality` including `DEGRADED_OFFLINE_CACHE` when a committed sample
  is substituted for an unreachable provider.
- [x] Historical scenario support (`as_of=2024-06-19`) for repeatable monsoon demos.
- [x] Forecast outlook endpoint, kept separate from observations and rejected by the
  provenance register endpoint.

### Provenance
- [x] Canonical JSON serialization (sorted keys, normalized floats, compact UTF-8).
- [x] Domain-separated SHA-256 for data batches, prediction reports, and report IDs.
- [x] Solidity `ClimateProvenance.sol` with duplicate/zero-hash rejection, events, and enumeration.
- [x] Web3 client with Sepolia RPC support and a deterministic local fallback simulator.
- [x] Write-mode labels distinguish `ONCHAIN`, read-only RPC, and simulator records.
- [x] Environment aliases for hosted platforms (`RPC_URL`/`ETH_RPC_URL`, `DEPLOYER_PRIVATE_KEY`/`SIGNER_PRIVATE_KEY`).
- [x] Registry audit endpoint and UI trail.

### API surface
| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Service, provenance mode, uptime, dependency status |
| `GET /api/locations` | Four station metadata records |
| `GET /api/overview` | Basin aggregate + all-station risk snapshots |
| `GET /api/observations` | Live recent or historical rainfall window |
| `GET /api/risk` | Full SRRI report for one station (optional `as_of`) |
| `POST /api/predictions` | Structured prediction report |
| `GET /api/forecast` | 7-day precipitation + forecast outlook |
| `GET /api/datasets` | Manifest metadata + runtime SHA-256 integrity check |
| `POST /api/provenance/register` | Commit a report on-chain / simulator |
| `GET /api/provenance/registry` | Audit trail of commitments |
| `GET /api/provenance/{report_id}` | Lookup a single commitment |
| `POST /api/provenance/verify` | Five-state integrity verdict |
| `POST /api/cache/clear` | Operator cache reset |

### Dashboard
- [x] Hero with basin pulse, scenario CTA, and live/offline status.
- [x] Scenario bar: latest available data, 19 June 2024 monsoon replay, custom historical date.
- [x] Animated SRRI gauge, weighted factor attribution, and risk-driver bars.
- [x] Four-station comparison cards with sparklines and rainfall deltas.
- [x] Interactive basin map with risk-coded markers, hover detail, and river corridors.
- [x] Observation explorer with daily bars / cumulative lines, BMD thresholds, range toggles, and quality stats.
- [x] Seven-day forecast strip with probability, temperature, and outlook SRRI.
- [x] Provenance console with register/verify, three tamper modes, hash comparison, JSON export, and audit trail.
- [x] Tabbed methodology (data, model, protocol, ethics), dataset integrity table, and impact section.
- [x] Responsive layout, keyboard focus states, reduced-motion support, and toast feedback.

### Verification & packaging
- [x] Python pytest suite (22 tests) covering pipeline, risk, provenance, and API.
- [x] Hardhat contract suite (10 tests).
- [x] Next.js strict TypeScript production build.
- [x] Unified Dockerfile, Compose stack, Render blueprint, Makefile, GitHub Actions.
- [x] Documentation set: architecture, threat model, model card, data feasibility, demo script, pitch playbook.

---

## 3. Judging alignment

| Criterion | Evidence in the project | Demo beat |
| --- | --- | --- |
| **Climate relevance** | Four flood-prone Surma–Kushiyara stations; BMD-calibrated rainfall semantics; haor context | Open with the June 2024 monsoon scenario |
| **Data credibility** | Real Open-Meteo ECMWF/ERA5 rainfall; SHA-256 manifests; `GET /api/datasets` verifies live | Show manifest integrity table |
| **Technical depth** | Canonical JSON, domain separation, Solidity registry, five-state verification, RPC fallback | Register a report, then verify it |
| **Innovation** | Provenance layer attached to a *transparent* climate indicator, not a black box | Run tamper simulation → `MISMATCH` |
| **Usability** | Scenario bar, plain-language summaries, responsive dashboard, accessible states | Switch stations and historical dates live |
| **Honesty / safety** | Explicit prototype notice, nullable flood labels/gauges, `UNAVAILABLE` state | Read the disclosure in the UI |
| **Reproducibility** | Makefile, Docker, tests, committed samples, offline fallback | `make test` / `docker compose up --build` |

---

## 4. Demo runbook (4 minutes)

1. **0:00–0:35 — Problem + hero.** Sylhet haor floods, two trust gaps: uncalibrated
   models and mutable evidence.
2. **0:35–1:20 — Basin pulse + station network.** Point at the four stations, real
   coordinates, and the live basin aggregate.
3. **1:20–2:05 — Monsoon replay.** Click **Load June 2024 monsoon**. All four stations
   jump to SEVERE; open the factor attribution and the 24h/3d/7d windows.
4. **2:05–2:45 — Data integrity.** Scroll to the manifest table; show 4/4 SHA-256 checks
   and the Open-Meteo/ERA5 lineage.
5. **2:45–3:30 — Provenance.** Register the report, show the registry mode, simulator
   receipt (or block/tx when signer-configured), auto-verify → `VERIFIED`, and reveal the
   computed vs stored hashes.
6. **3:30–4:00 — Tamper test + impact.** Enable tampering, alter the score, verify again
   → `MISMATCH`. Close on parametric insurance, relief audit, and the `UNAVAILABLE`
   failure-honesty principle.

See [`docs/demo-script.md`](demo-script.md) for the word-for-word script.

---

## 5. Risks & mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Open-Meteo outage | Risk/report fetch fails | 10-minute TTL cache + committed sample fallback + `DEGRADED_OFFLINE_CACHE` label |
| No Sepolia key at demo time | No live tx | Deterministic local simulator is clearly labelled; UI never claims an on-chain tx when simulated |
| Judge asks about flood labels | Credibility risk | Explicit no-fabrication disclosure in UI, API limitations array, and model card |
| Historical scenario overwrites sample | Reproducibility drift | API reads no longer persist; only the seed script writes snapshots |
| Live demo network latency | Awkward pauses | Concurrent station fetches, overview cache, skeleton states, historical fallback |

---

## 6. Next 10 days (highest leverage first)

### P0 — submission blockers
- [ ] Record a 3–5 minute screen capture with a backup offline run.
- [ ] Deploy the Render blueprint and verify `/api/health`, `/api/overview`, and provenance flow.
- [ ] Replace simulator-only demo with a funded Sepolia key if available; otherwise keep the simulator label prominent.
- [x] Regenerate `docs/dashboard-preview.png` and `docs/dashboard-monsoon.png`.
- [ ] Final README screenshot, live URL, and tester instructions.

### P1 — credibility upgrades
- [ ] Add a small BWDB/FFWC gauge adapter behind a feature flag (only if a verified source is found).
- [ ] Pin full report payloads to IPFS and store the CID as `metadataUri`.
- [ ] Add signed data-source attestations (e.g. signed manifest from the ingestion job).
- [ ] Add end-to-end Playwright test for the tamper flow.

### P2 — research roadmap
- [ ] Evaluate SRRI against observed flood events using a chronological split if verified labels become available.
- [ ] Add upstream Meghalaya rainfall and Barak river features.
- [ ] Design a parametric trigger contract with oracle/attestation separation.

---

## 7. Definition of done

- [ ] `make test` passes (Python + Hardhat).
- [ ] `cd apps/web && npm run build` passes with zero TypeScript errors.
- [ ] `docker compose up --build` serves both services.
- [ ] The live demo works with Wi-Fi and without Wi-Fi (offline snapshot is visibly labelled).
- [ ] Every claim in the UI is either sourced, computed, or explicitly labelled as a prototype assumption.
