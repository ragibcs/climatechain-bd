"""
Precipitation feature engineering and Sylhet Rainfall Risk Index (SRRI) computation.

Strict past-only rolling calculations without temporal leakage.
Transparent rule-based scoring calibrated to Bangladesh Meteorological Department (BMD)
and Sylhet/Surma basin monsoon hydro-meteorology.
"""

from typing import List, Dict, Any
from datetime import datetime, timedelta

def compute_rolling_precipitation(
    daily_records: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Computes trailing 3-day and 7-day cumulative rainfall for chronological records.
    Guarantee: strictly past-only, no future records are referenced.
    
    daily_records: list of dicts with 'date' (YYYY-MM-DD) and 'rainfall_mm' (float).
    """
    if not daily_records:
        return []
    
    # Sort chronologically by date
    sorted_records = sorted(daily_records, key=lambda r: r["date"])
    
    # Map date to rainfall_mm
    date_to_rain: Dict[str, float] = {
        r["date"]: float(r.get("rainfall_mm") or 0.0) for r in sorted_records
    }
    
    enriched_records = []
    for r in sorted_records:
        current_date = datetime.strptime(r["date"], "%Y-%m-%d").date()
        
        # 3-day trailing window: [current_date - 2 days, current_date]
        window_3d = [current_date - timedelta(days=d) for d in range(3)]
        rain_3d = sum(date_to_rain.get(d.strftime("%Y-%m-%d"), 0.0) for d in window_3d)
        
        # 7-day trailing window: [current_date - 6 days, current_date]
        window_7d = [current_date - timedelta(days=d) for d in range(7)]
        rain_7d = sum(date_to_rain.get(d.strftime("%Y-%m-%d"), 0.0) for d in window_7d)
        
        record_copy = dict(r)
        record_copy["rainfall_3d_mm"] = round(rain_3d, 2)
        record_copy["rainfall_7d_mm"] = round(rain_7d, 2)
        enriched_records.append(record_copy)
        
    return enriched_records

def compute_rainfall_risk_indicator(
    rainfall_1d_mm: float,
    rainfall_3d_mm: float,
    rainfall_7d_mm: float
) -> Dict[str, Any]:
    """
    Computes the Sylhet Rainfall Risk Index (SRRI) on a scale of 0 to 100.
    
    Calibrated against Bangladesh Meteorological Department (BMD) thresholds:
      - Light rain: 1-10 mm
      - Moderate: 11-22 mm
      - Moderately Heavy: 23-43 mm
      - Heavy: 44-88 mm
      - Very Heavy / Cloudburst: >88 mm
      
    Formulation:
      - 24h Rainfall: acute flash potential (weight 0.50, saturation threshold: 100 mm)
      - 3d Rainfall: drainage saturation & upstream runoff (weight 0.30, saturation threshold: 200 mm)
      - 7d Rainfall: antecedent haor basin storage fill (weight 0.20, saturation threshold: 350 mm)
      
    Categorical mappings:
      - LOW (0-24): Minimal hydrological stress
      - MODERATE (25-49): Moderate monsoon rainfall, localized waterlogging
      - HIGH (50-74): Heavy rainfall, significant urban/riverbank overflow risk
      - SEVERE (75-100): Extreme deluge, high probability of flash flooding
    """
    r1 = max(0.0, float(rainfall_1d_mm))
    r3 = max(0.0, float(rainfall_3d_mm))
    r7 = max(0.0, float(rainfall_7d_mm))
    
    # Acute component: 100mm in 24h reaches full 100 (BMD Very Heavy boundary: 88mm)
    acute_component = min(100.0, (r1 / 100.0) * 100.0)
    
    # 3-day component: 200mm in 3 days reaches full 100
    subacute_component = min(100.0, (r3 / 200.0) * 100.0)
    
    # 7-day component: 350mm in 7 days reaches full 100
    cumulative_component = min(100.0, (r7 / 350.0) * 100.0)
    
    raw_score = (0.50 * acute_component) + (0.30 * subacute_component) + (0.20 * cumulative_component)
    score = round(min(100.0, max(0.0, raw_score)), 1)
    
    if score >= 75.0:
        level = "SEVERE"
        severity_label = "Severe Rainfall & Flash Flood Alert"
    elif score >= 50.0:
        level = "HIGH"
        severity_label = "High Precipitation & Inundation Risk"
    elif score >= 25.0:
        level = "MODERATE"
        severity_label = "Moderate Seasonal Rainfall"
    else:
        level = "LOW"
        severity_label = "Low Rainfall Risk"
        
    factors = [
        {
            "name": "24h Precipitation",
            "value_mm": round(r1, 1),
            "contribution_pct": round((0.50 * acute_component / (raw_score or 1.0)) * 100, 1) if raw_score > 0 else 0.0,
            "interpretation": "Immediate flash flood / cloudburst potential (BMD Heavy >44mm, Very Heavy >88mm)"
        },
        {
            "name": "Trailing 3-Day Cumulative",
            "value_mm": round(r3, 1),
            "contribution_pct": round((0.30 * subacute_component / (raw_score or 1.0)) * 100, 1) if raw_score > 0 else 0.0,
            "interpretation": "Surma river catchment inflow & urban drainage congestion"
        },
        {
            "name": "Trailing 7-Day Cumulative",
            "value_mm": round(r7, 1),
            "contribution_pct": round((0.20 * cumulative_component / (raw_score or 1.0)) * 100, 1) if raw_score > 0 else 0.0,
            "interpretation": "Haor basin saturation and regional wetland absorption limit"
        }
    ]
    
    return {
        "score": score,
        "risk_level": level,
        "severity_label": severity_label,
        "factors": factors,
        "summary": (
            f"SRRI score is {score}/100 ({level}). "
            f"Observed 24h rainfall: {round(r1, 1)}mm; 3-day: {round(r3, 1)}mm; 7-day: {round(r7, 1)}mm."
        )
    }
