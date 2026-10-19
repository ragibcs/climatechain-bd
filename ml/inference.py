"""
Risk assessment inference engine for ClimateChain BD.
Generates structured, validated prediction reports adhering to the prediction schema in CLAUDE.md.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

from ml.data.locations import get_location_by_id
from ml.data.ingestion import fetch_open_meteo_observations, load_cached_samples
from ml.features import compute_rainfall_risk_indicator

MODEL_VERSION = "rainfall-indicator-v1"
MODEL_TARGET = "rainfall_risk_indicator"

DISCLAIMER_LIMITATIONS = [
    "Research prototype developed for the IEEE ClimateChain Global Hackathon.",
    "Not an official flood forecasting or evacuation warning system. Follow BMD and FFWC advisories.",
    "Calculated from ERA5/ECMWF numerical weather prediction and historical archive via Open-Meteo.",
    "Does not account for dam releases (e.g. upstream Barak river basin), river siltation, or embankment breaches.",
    "Verified ground-truth flood extent labels were unavailable; this score is an empirical meteorological indicator, not a calibrated statistical probability."
]


def generate_risk_report(
    location_id: str,
    as_of: Optional[str] = None,
    use_live_api: bool = True
) -> Dict[str, Any]:
    """
    Generates a deterministic risk report for a given Sylhet station.
    """
    location = get_location_by_id(location_id)
    
    now_utc = datetime.now(timezone.utc)
    as_of_str = as_of or now_utc.strftime("%Y-%m-%d")
    
    # Retrieve observations up to as_of
    observations: List[Dict[str, Any]] = []
    data_quality = "VALID"
    
    if use_live_api:
        try:
            # Query recent 14 days up to as_of to calculate rolling 7-day features
            start_date = (datetime.strptime(as_of_str, "%Y-%m-%d") - timedelta(days=14)).strftime("%Y-%m-%d")
            observations = fetch_open_meteo_observations(
                location_id=location_id,
                start_date=start_date,
                end_date=as_of_str
            )
        except Exception:
            observations = load_cached_samples(location_id)
            data_quality = "DEGRADED_OFFLINE_CACHE"
    else:
        observations = load_cached_samples(location_id)
        data_quality = "CACHED_SAMPLE"
        
    if not observations:
        # Fallback to cached samples if live returned empty
        observations = load_cached_samples(location_id)
        data_quality = "DEGRADED_OFFLINE_CACHE"
        
    if not observations:
        raise ValueError(f"No observations available for location: {location_id}")
        
    # Get latest record for as_of date or last available record
    records_matching = [r for r in observations if r["date"] <= as_of_str]
    latest_rec = records_matching[-1] if records_matching else observations[-1]
    
    r1 = float(latest_rec.get("rainfall_mm") or 0.0)
    r3 = float(latest_rec.get("rainfall_3d_mm") or r1)
    r7 = float(latest_rec.get("rainfall_7d_mm") or r3)
    
    risk_info = compute_rainfall_risk_indicator(r1, r3, r7)
    
    report = {
        "report_id": f"REP-{location_id.upper()}-{latest_rec['date']}",
        "location_id": location_id,
        "location_name": location["name"],
        "coordinates": {
            "latitude": location["latitude"],
            "longitude": location["longitude"]
        },
        "as_of": latest_rec["date"],
        "generated_at": now_utc.isoformat(),
        "target": MODEL_TARGET,
        "model_version": MODEL_VERSION,
        "risk_level": risk_info["risk_level"],
        "severity_label": risk_info["severity_label"],
        "score": risk_info["score"],
        "metrics": {
            "rainfall_1d_mm": r1,
            "rainfall_3d_mm": r3,
            "rainfall_7d_mm": r7,
            "danger_level_m": location.get("danger_level_m"),
            "river_level_m": latest_rec.get("river_level_m")
        },
        "data_quality": data_quality,
        "explanation": {
            "summary": risk_info["summary"],
            "factors": risk_info["factors"]
        },
        "limitations": DISCLAIMER_LIMITATIONS
    }
    
    return report
