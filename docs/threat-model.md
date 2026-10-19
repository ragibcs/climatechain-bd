# Threat Model & Security Analysis

## 1. Scope & System Assets
ClimateChain BD registers commitments to climate intelligence reports on an EVM blockchain. Assets include:
1. **Raw Weather Data Snapshots:** Off-chain observations and rolling calculations.
2. **Prediction Reports:** Risk evaluations, scores, factors, and limitations.
3. **On-Chain Commitments:** Deterministic `reportId`, `dataHash`, and `reportHash` stored in `ClimateProvenance.sol`.
4. **Deployer Private Keys:** Testnet signer keys used by the backend.

---

## 2. Threat Scenarios & Mitigations

| Threat | Attack Vector | Potential Impact | Mitigation in ClimateChain BD |
|---|---|---|---|
| **Report Tampering** | Malicious actor modifies risk score or limitations in transit or database | User acts on falsified risk output | Canonical SHA-256 hash recalculation against on-chain `reportHash` immediately flags tampering as `MISMATCH`. |
| **Data Falsification** | Fabricating weather readings or inventing unmonitored river levels | Model outputs misleading emergency claims | River level and flood ground-truth are marked nullable (`null`). Unmonitored status is prominently disclosed; Open-Meteo source digests are hashed in manifests. |
| **Front-Running / Replay** | Attacker attempts to register someone else's report or re-register existing ID | Storage pollution or duplicate confusion | Contract strictly rejects duplicate `reportId` (`ReportAlreadyRegistered`). Report IDs are derived deterministically from `(location_id, as_of, model_version)`. |
| **RPC Outage / Denial of Service** | Testnet node or Infura/Alchemy endpoint becomes unreachable | App crashes or claims report is invalid | Verification engine explicitly distinguishes `UNAVAILABLE` from `MISMATCH`. Never converts network failure into false tampering alerts. |
| **Private Key Exposure** | Hardcoded private keys committed to repository or sent to browser | Theft of testnet funds or unauthorized contract interactions | Server-side execution only. Keys loaded strictly from `.env` (gitignored). Frontend never receives private keys. Read-only verification requires no keys. |
| **Floating-Point Non-Determinism** | Different platforms serialize JSON floats differently (e.g. `2.0` vs `2.000`) | Valid reports falsely fail hash verification | `canonicalize_value` normalizes floating point precision (4 decimal places) and serializes with fixed separators before hashing. |

---

## 3. Residual Risks & Non-Claims
- **No Scientific Correctness Claim:** A verified blockchain transaction proves byte-for-byte fidelity with the registered report; it does **not** prove that the underlying ECMWF weather forecast is 100% physically accurate.
- **Auditing Disclosure:** `ClimateProvenance.sol` is a hackathon prototype and has not undergone formal third-party economic security or invariant audits.
