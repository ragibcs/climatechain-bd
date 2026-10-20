# ClimateChain BD — 3–5 Minute Hackathon Demonstration Script

**Target time:** 4 minutes
**Format:** Live browser + optional terminal backup
**Hackathon:** IEEE ClimateChain Global Hackathon — Climate Data & Environmental Monitoring

> Keep a second tab open on a screen recording. If the network drops, the dashboard
> falls back to the labelled June 2024 snapshot and the demo still works.

---

## 1. 0:00 – 0:30 — The Sylhet problem

**Visual:** Hero section, prototype notice, basin pulse card.

**Script:**
> "Sylhet's haor belt floods when monsoon cloudbursts hit the Meghalaya plateau and the
> Surma–Kushiyara rivers rise. Relief agencies and parametric insurers face two trust
> gaps. First, how do we index rainfall severity without inventing flood labels? Second,
> how do we prove that the evidence behind a payout was not quietly rewritten?
>
> ClimateChain BD answers both: real ECMWF/ERA5 rainfall data, a transparent rainfall-risk
> index, and a tamper-evident commitment for every report."

Point out the amber **research prototype** notice: not an official warning system.

---

## 2. 0:30 – 1:05 — Open rainfall data and the basin

**Visual:** Station cards; hover the basin map; point at river corridors and coordinates.

**Script:**
> "We monitor four stations along the Surma–Kushiyara system — Sylhet Sadar, Sunamganj,
> Kanaighat, and Zakiganj. The map uses real coordinates, and each marker is colour-coded
> by the same index you see in the cards.
>
> The data is real ERA5/ECMWF daily precipitation from Open-Meteo. Where a verified river
> gauge or flood-extent label is unavailable, we leave it null. We do not fabricate
> hydrology."

---

## 3. 1:05 – 1:50 — Replay the June 2024 monsoon

**Visual:** Click **Load June 2024 monsoon** (hero or scenario bar). Wait for all four
cards to turn red. Open the factor attribution.

**Script:**
> "Live October data is dry, which is honest but not dramatic. Let's replay a historical
> event: 19 June 2024.
>
> All four stations now jump to SEVERE. The basin aggregate is 84.4 out of 100. Look at
> the drivers: 24-hour rainfall carries 50% of the score, the trailing 3-day window 30%,
> and the 7-day window 20%.
>
> Every window is strictly past-only — no future leakage. The 24-hour component is
> calibrated to BMD intensity classes: heavy at 44 mm, very heavy above 88 mm."

Optional: toggle **Cumulative** in the observation chart to show the 3-day and 7-day
saturation thresholds.

---

## 4. 1:50 – 2:25 — Explainability and data integrity

**Visual:** Scroll to the methodology tabs → **Data pipeline** and **SRRI model**.

**Script:**
> "We do not hide behind a black box. The formula, weights, saturation thresholds, and
> BMD calibration are visible. The data-pipeline tab shows four committed manifests and a
> live SHA-256 integrity check — all four verify.
>
> The model card is explicit: this is an empirical meteorological indicator, not a
> validated flood probability. That honesty is the point."

---

## 5. 2:25 – 3:10 — Register and verify provenance

**Visual:** Provenance section → **Register report** → watch the status become
**VERIFIED**. Point at the registry-mode label, simulator receipt (or block, when a Sepolia
signer is configured), commitment ID, and the two matching hashes.

**Script:**
> "Now the differentiator. The backend normalizes the report into canonical JSON, sorts
> keys, normalizes floats, and hashes it with a domain-separated SHA-256.
>
> Registering commits the report ID, data hash, report hash, model version, and metadata
> URI to our ClimateProvenance contract. If no Sepolia key is configured, the UI clearly
> labels the deterministic simulator.
>
> Auto-verification recomputes the hash locally and compares it to the stored commitment.
> Green VERIFIED means a 100% byte-level match."

---

## 6. 3:10 – 3:40 — Tamper detection

**Visual:** Enable **Simulate report tampering**, choose **score → 0**, click **Verify
report**. The verdict flips to red **MISMATCH** with computed vs stored hashes.

**Script:**
> "Now imagine a bad actor edits the report to downplay rainfall before an insurance
> claim. We alter the score, re-verify — and the hash no longer matches.
>
> The contract does not need to know the science. It only needs to prove that the bytes
> changed. That is exactly the audit primitive climate finance needs.
>
> And if the RPC node is down, the system says UNAVAILABLE — it never guesses VERIFIED."

---

## 7. 3:40 – 4:00 — Impact and close

**Visual:** Impact section and footer.

**Script:**
> "ClimateChain BD gives parametric insurers, relief programs, and civic planners a shared
> evidence layer: transparent climate science on one side, tamper-evident provenance on
> the other.
>
> The code, tests, Docker setup, and data manifests are open source and reproducible.
> Thank you."

---

## Backup commands

```bash
make test                 # Python + Hardhat suites
make run-api              # FastAPI on :8000
make run-web              # Next.js on :3000
docker compose up --build # one-command stack
```
