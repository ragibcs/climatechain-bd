# ClimateChain BD — Hackathon Playbook

> One-page strategy for the IEEE ClimateChain Global Hackathon.
> **Pitch:** *Climate risk you can prove.*

---

## 1. The 30-second pitch

> Sylhet's haor belt floods when monsoon cloudbursts hit the Meghalaya plateau and the
> Surma–Kushiyara rivers rise. Relief agencies and parametric insurers need two things
> that rarely arrive together: a **defensible risk signal** and **evidence that cannot
> be quietly rewritten**.
>
> ClimateChain BD builds both. We ingest real ECMWF/ERA5 rainfall, compute a transparent
> BMD-calibrated rainfall-risk index, and commit every report to a tamper-evident
> provenance registry — Sepolia when a signer is configured, otherwise a clearly labelled
> simulator. Change one byte and the verdict flips from `VERIFIED` to `MISMATCH` — in
> front of you.

---

## 2. Why this wins

| Judge question | ClimateChain BD answer |
| --- | --- |
| Is the climate problem real? | Surma–Kushiyara flash floods, haor wetlands, four exposed stations. |
| Is the data real? | Open-Meteo ECMWF/ERA5 rainfall data, SHA-256 manifests, no synthetic labels. |
| Is the model honest? | SRRI is a transparent, weighted indicator — not a fake flood classifier. |
| Is the blockchain necessary? | It solves post-hoc evidence tampering for insurance/relief audit; it is not decorative. |
| Can it fail safely? | `UNAVAILABLE`, `NOT_FOUND`, `PENDING` are explicit; no false `VERIFIED`. |
| Can I reproduce it? | Makefile, Docker, test suites, deterministic samples, one-click scenarios. |

---

## 3. Demo narrative (4 minutes)

| Time | Beat | What the audience sees |
| --- | --- | --- |
| 0:00–0:30 | Problem | Hero, prototype notice, basin pulse |
| 0:30–1:10 | Open rainfall data | Station cards, map, live source badges |
| 1:10–1:55 | Monsoon replay | Click **Load June 2024 monsoon** → all four SEVERE |
| 1:55–2:30 | Explainability | Factor bars, 1d/3d/7d metrics, BMD thresholds |
| 2:30–3:10 | Provenance | Register → auto-verify → `VERIFIED`, hashes |
| 3:10–3:45 | Tamper test | Toggle tamper, alter score, verify → `MISMATCH` |
| 3:45–4:00 | Impact | Insurance, relief audit, roadmap |

**Backup plan:** if the network drops, refresh shows the committed June 2024 cached
snapshot with an explicit **Offline demo snapshot** badge. Never claim a simulated
transaction is on-chain — the UI labels the registry mode.

---

## 4. Slide deck outline (6 slides)

1. **Title** — Climate risk you can prove. Sylhet, Bangladesh. Team + repo.
2. **Problem** — Two trust failures: uncalibrated models + mutable evidence.
3. **Solution** — Open rainfall data → transparent SRRI → canonical hash → EVM-ready commitment.
4. **Demo frames** — Basin map, station risk, tamper test before/after.
5. **Why it is credible** — No fabricated labels, SHA-256 manifests, five-state verification,
   graceful RPC failure.
6. **Impact & roadmap** — Parametric insurance, relief audit, civic planning; BWDB adapter,
   IPFS payloads, trigger contracts.

---

## 5. Judge Q&A prep

**“Why not train a flood classifier?”**
Machine-readable daily flood extent labels were unavailable as open REST data. Training on
fabricated masks would be scientifically dishonest. SRRI is a transparent meteorological
indicator with explicit limitations; if verified labels arrive, the evaluation path is
documented in the model card.

**“Why blockchain?”**
The value is not prediction — it is *evidence integrity*. A canonical report hash committed
to an EVM chain lets an insurer, donor, or auditor recompute the report and detect any
post-hoc edit. The chain proves byte-level consistency, not the truth of the underlying
science; we state that distinction explicitly.

**“What if the RPC is down?”**
Verification returns `UNAVAILABLE`, never a false `VERIFIED`. Registration falls back to a
clearly labelled simulator for demos. Both paths are tested.

**“How is this different from a dashboard?”**
The dashboard is the interface; the differentiator is the end-to-end evidence chain:
validated ingestion → past-only features → canonical serialization → on-chain commitment →
independent verification.

**“What is the business model?”**
Sell verification/audit rails to parametric insurers, relief programs, and climate-risk
analysts; the climate index is open-source, the provenance and integration layer is the
product.

---

## 6. Submission checklist

- [ ] Repository is public with an MIT licence.
- [ ] README has live URL, screenshots, quickstart, API table, and test results.
- [ ] 3–5 minute demo video uploaded with backup recording.
- [ ] All tests green (`make test`).
- [ ] Docker one-command run verified on a clean machine if possible.
- [ ] No secrets, private keys, or `.env` files committed.
- [ ] Prototype/non-official disclaimer visible in the UI and README.
- [ ] Contract address + explorer link included if a live deployment exists; otherwise say
      “simulator mode” clearly.
- [ ] Devpost/event submission fields completed before the deadline buffer.
