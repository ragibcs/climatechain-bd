# Model Card: Sylhet Rainfall Risk Index (SRRI)

## Model Overview
- **Model Name:** Sylhet Rainfall Risk Indicator Engine
- **Model Version:** `rainfall-indicator-v1`
- **Model Type:** Deterministic rule-based meteorological risk engine with past-only rolling feature engineering
- **Target Variable:** `rainfall_risk_indicator` (Continuous score 0–100, Categorical: `LOW`, `MODERATE`, `HIGH`, `SEVERE`)
- **Primary Geographies:** Sylhet Sadar, Sunamganj Sadar, Kanaighat, Zakiganj (Surma & Kushiyara river basins, Sylhet Division, Bangladesh)
- **Developer:** ClimateChain BD Team (Solo)
- **Event:** IEEE ClimateChain Global Hackathon (October 2026)

---

## Intended Use & Scope
### Intended Use
- Educational, research, and provenance-verification prototype for assessing rainfall severity and flash-inundation potential in northeastern Bangladesh.
- Enabling verifiable audit trails for climate risk assessments registered on EVM blockchains.

### Out-of-Scope & Misuse
- **DO NOT USE** as an official disaster management, life-safety evacuation, or flood early warning system.
- Not calibrated to model dam water discharges, transboundary river releases from Assam/Meghalaya, or dyke failures.
- Not a substitute for official advisories issued by the Bangladesh Meteorological Department (BMD) or the Flood Forecasting and Warning Centre (FFWC).

---

## Sourcing & Input Features
All input weather variables are sourced from ERA5 / ECMWF reanalysis and numerical weather prediction via the Open-Meteo API.

| Feature | Window | Source | Interpretation |
|---|---|---|---|
| `rainfall_1d_mm` | 24-hour total | Open-Meteo / ECMWF | Immediate flash rainfall & cloudburst intensity |
| `rainfall_3d_mm` | Trailing 3 days (past-only) | Derived rolling sum | Catchment runoff volume & urban drainage saturation |
| `rainfall_7d_mm` | Trailing 7 days (past-only) | Derived rolling sum | Antecedent soil moisture & haor wetland fill |
| `danger_level_m` | Reference constant | BWDB hydrologic survey | Official station danger level for contextual reference |

---

## Mathematical Formulation

$$SRRI = \min\left(100, \, 0.50 \cdot \min\left(100, \frac{R_{1d}}{100} \cdot 100\right) + 0.30 \cdot \min\left(100, \frac{R_{3d}}{200} \cdot 100\right) + 0.20 \cdot \min\left(100, \frac{R_{7d}}{350} \cdot 100\right)\right)$$

### Calibrated Thresholds (BMD Standards)
- **`LOW` (0–24.9):** Minimal precipitation (< 25 mm).
- **`MODERATE` (25.0–49.9):** Typical monsoon rain; minor drainage ponding.
- **`HIGH` (50.0–74.9):** Heavy continuous precipitation (BMD Heavy Rain > 44 mm/day); substantial inundation hazard.
- **`SEVERE` (75.0–100.0):** Extreme deluge / cloudburst (> 88 mm/day); high danger of flash flooding.

---

## Evaluation & Honest Scientific Disclosure
1. **Absence of Ground Truth Flood Masks:** Verified daily spatial flood masks or high-frequency water level time series were not available as open APIs for the target stations. In accordance with Section 5 of the project specification, a transparent rainfall indicator is provided rather than fabricating a machine learning classifier with synthetic or fake labels.
2. **Data Leakage Prevention:** All rolling windows are strictly past-only $[t - k, t]$. Future forecasts are never incorporated into historical feature calculations.
3. **Reproducibility:** Sample data snapshots and hash manifests are generated in `data/samples/` and `data/manifests/` to ensure end-to-end auditability.
