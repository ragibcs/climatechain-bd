# ClimateChain BD — 3–5 Minute Hackathon Demonstration Script

**Target Time:** 4 minutes  
**Presenter:** Developer / Solo Presenter  
**Hackathon:** IEEE ClimateChain Global Hackathon — Climate Data & Environmental Monitoring  

---

## 1. 0:00 – 0:30: The Sylhet Flash Flood Challenge
- **Visual:** Landing page showing the **Prototype Disclaimer** and **Sylhet Basin Scope**.
- **Script:**
  > "Welcome to ClimateChain BD. Northeastern Bangladesh, particularly the Sylhet and Sunamganj haor basin, experiences catastrophic flash floods driven by extreme cloudbursts and transboundary runoff from the Meghalaya hills. 
  > However, in climate crisis management, disaster relief organizations and insurers face two acute challenges: 
  > First, how do we responsibly index rainfall severity without fabricating unverified flood predictions? 
  > Second, how do we guarantee that historical climate impact reports cannot be silently altered or tampered with after the fact?
  > ClimateChain BD solves this with AI-assisted meteorological risk intelligence backed by cryptographic smart-contract provenance."

---

## 2. 0:30 – 1:15: Real Telemetry & Geographic Spatial Awareness
- **Visual:** Switch between station tabs (**Sylhet Sadar**, **Sunamganj**, **Kanaighat**, **Zakiganj**). Point out the **Interactive Basin Map** and real coordinates.
- **Script:**
  > "Notice our geographic layout. We track four key stations along the Surma and Kushiyara rivers using real coordinates.
  > On the map, you can trace the Surma river corridor flowing down from Kanaighat into Sylhet Sadar and the Sunamganj lowlands.
  > In the observation charts, we pull real ECMWF/ERA5 daily precipitation from Open-Meteo.
  > Crucially, our pipeline enforces strict past-only rolling features: we calculate trailing 3-day and 7-day cumulative rainfall without any future temporal leakage."

---

## 3. 1:15 – 2:10: Sylhet Rainfall Risk Index (SRRI) & Transparent Explainability
- **Visual:** Hover over the **SRRI Risk Gauge (Score / 100)** and factor cards.
- **Script:**
  > "Instead of inventing a black-box model trained on fake flood masks, we implement the transparent Sylhet Rainfall Risk Index (SRRI), calibrated directly against Bangladesh Meteorological Department rainfall definitions:
  > - 24-hour acute rainfall captures cloudburst and flash potential (BMD Heavy Rain >44mm, Very Heavy >88mm).
  > - 3-day trailing rainfall captures upstream river catchment inflow.
  > - 7-day cumulative rainfall represents haor wetland saturation.
  > Every assessment generates a natural language summary and factor breakdown, accompanied by persistent disclosures that this is a research prototype."

---

## 4. 2:10 – 3:15: Cryptographic Blockchain Commitment
- **Visual:** Click **"Register Report On-Chain"**. Watch transaction hash and block confirmation appear.
- **Script:**
  > "Now let's examine our core differentiator: verifiable integrity.
  > When an assessment is generated, our backend normalizes all fields into deterministic canonical JSON and computes a domain-separated SHA-256 hash.
  > Clicking 'Register Report On-Chain' broadcasts a transaction to our ClimateProvenance smart contract on Sepolia testnet.
  > The contract verifies that the report ID is unique, non-zero, and permanently stores the report hash, data hash, model version, and timestamp.
  > Notice the confirmed transaction hash and the green 'VERIFIED' status badge: the locally computed hash matches the on-chain commitment 100%."

---

## 5. 3:15 – 3:45: Live Tamper Detection Demonstration
- **Visual:** Check the **"Simulate Report Tampering"** box (which sets score to 0) and click **"Verify Report Hash"**. Watch the status badge switch to red **"MISMATCH (Tampering Detected!)"**.
- **Script:**
  > "Now, what if a bad actor attempts to retroactively alter the report to dispute insurance claims or downplay rainfall severity?
  > Let's simulate tampering by modifying the score.
  > When we re-verify against the blockchain, the contract instantly flags a MISMATCH. The local hash no longer matches the immutable on-chain commitment.
  > Furthermore, if an RPC node drops offline, our system gracefully returns UNAVAILABLE rather than falsely reporting a mismatch."

---

## 6. 3:45 – 4:00: Impact & Future Roadmap
- **Visual:** Scroll to the **Scientific Methodology** and **Model Card** section.
- **Script:**
  > "By bridging transparent climate science with verifiable blockchain provenance, ClimateChain BD establishes an immutable audit trail for environmental monitoring, disaster grants, and parametric relief in Bangladesh.
  > Thank you!"
