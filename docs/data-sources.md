# Data Sources & Hydrological Metadata

## 1. Primary Weather Provider: Open-Meteo
- **APIs:** 
  - Historical Archive: `https://archive-api.open-meteo.com/v1/archive`
  - Forecast: `https://api.open-meteo.com/v1/forecast`
- **Models:** ECMWF (European Centre for Medium-Range Weather Forecasts) / ERA5 atmospheric reanalysis.
- **Variables Used:** `precipitation_sum` (24-hour total mm), `rain_sum` (mm).
- **Timezone:** Normalized to Bangladesh Standard Time (`Asia/Dhaka`, UTC+6).
- **Licence:** Creative Commons Attribution 4.0 International (CC BY 4.0) and Open Database Licence (ODbL).

---

## 2. Monitoring Stations & Basin Geography

| Station ID | Upazila / Metro | Latitude | Longitude | River System | Official Danger Level (m PWD) |
|---|---|---|---|---|---|
| `sylhet-sadar` | Sylhet Metropolitan | 24.8949 | 91.8687 | Surma River (Sylhet Station SW267) | 10.80 |
| `sunamganj` | Sunamganj Sadar | 25.0667 | 91.4000 | Surma River (Sunamganj Station SW268) | 7.80 |
| `kanaighat` | Kanaighat Upazila | 25.0000 | 92.2667 | Upper Surma (Kanaighat Station SW266) | 12.75 |
| `zakiganj` | Zakiganj Upazila | 24.8833 | 92.3667 | Kushiyara River (Sheola Station SW172) | 12.50 |

---

## 3. Bangladesh Water Development Board (BWDB) Context
- Official agency: Flood Forecasting and Warning Centre (FFWC), BWDB (`https://ffwc.gov.bd/`).
- Status: Station identifiers and published danger levels are incorporated as static reference constants for scientific grounding. Real-time gauge telemetry is marked `null` because no official open API is publicly exposed.
