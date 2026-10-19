"""
Weather and climate observation data ingestion for Sylhet, Bangladesh.
Fetches from Open-Meteo Historical Archive and Forecast APIs with full schema validation,
caching, offline fallback samples, and data provenance manifests.
"""

import os
import json
import hashlib
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

import requests

from ml.data.locations import SYLHET_LOCATIONS, get_location_by_id
from ml.features import compute_rolling_precipitation

logger = logging.getLogger("climatechain.ingestion")

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
SAMPLES_DIR = os.path.join(DATA_DIR, "samples")
MANIFESTS_DIR = os.path.join(DATA_DIR, "manifests")

OPEN_METEO_ARCHIVE_URL = os.getenv("OPEN_METEO_BASE_URL", "https://archive-api.open-meteo.com/v1/archive")
OPEN_METEO_FORECAST_URL = os.getenv("OPEN_METEO_FORECAST_URL", "https://api.open-meteo.com/v1/forecast")


def ensure_directories():
    os.makedirs(SAMPLES_DIR, exist_ok=True)
    os.makedirs(MANIFESTS_DIR, exist_ok=True)


def validate_observation(record: Dict[str, Any]) -> str:
    """
    Validates observation record.
    Returns quality_flag: 'VALID', 'SUSPICIOUS_HIGH', 'INVALID_NEGATIVE', 'MISSING_DATE'.
    """
    if not record.get("date"):
        return "MISSING_DATE"
    
    val = record.get("rainfall_mm")
    if val is None:
        return "MISSING"
    
    try:
        val_float = float(val)
        if val_float < 0:
            return "INVALID_NEGATIVE"
        if val_float > 500.0:
            return "SUSPICIOUS_HIGH"
    except (ValueError, TypeError):
        return "INVALID_TYPE"
        
    return "VALID"


def fetch_open_meteo_observations(
    location_id: str,
    start_date: str,
    end_date: str,
    timeout: int = 10
) -> List[Dict[str, Any]]:
    """
    Fetches historical or recent daily precipitation for a specified location from Open-Meteo.
    Falls back cleanly if API is unavailable.
    """
    loc = get_location_by_id(location_id)
    lat = loc["latitude"]
    lon = loc["longitude"]
    
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": ["precipitation_sum", "rain_sum"],
        "timezone": "Asia/Dhaka"
    }
    
    # Check if querying past or near-present/future
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    url = OPEN_METEO_FORECAST_URL if end_date >= today_str else OPEN_METEO_ARCHIVE_URL
    if url == OPEN_METEO_FORECAST_URL:
        # Forecast API uses past_days and forecast_days or start/end
        params["start_date"] = start_date
        params["end_date"] = end_date
    
    try:
        resp = requests.get(url, params=params, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        logger.warning(f"Error fetching from {url} for {location_id}: {e}. Checking local sample.")
        return load_cached_samples(location_id)
        
    daily = data.get("daily", {})
    times = daily.get("time", [])
    precip = daily.get("precipitation_sum", [])
    
    records: List[Dict[str, Any]] = []
    seen_dates = set()
    
    for dt, p in zip(times, precip):
        if dt in seen_dates:
            continue
        seen_dates.add(dt)
        
        rain_val = float(p) if p is not None else 0.0
        
        rec = {
            "date": dt,
            "location_id": location_id,
            "latitude": lat,
            "longitude": lon,
            "rainfall_mm": round(rain_val, 2),
            "river_level_m": None,  # BWDB gauge reading (nullable, not fabricated)
            "danger_level_m": loc.get("danger_level_m"),
            "flood_label": None,     # ground truth label (nullable, not fabricated)
            "source_id": "open-meteo-ecmwf",
            "quality_flag": "VALID"
        }
        rec["quality_flag"] = validate_observation(rec)
        records.append(rec)
        
    # Enrich with past-only rolling 3d and 7d rainfall
    enriched = compute_rolling_precipitation(records)
    
    # Save local sample for offline reproducibility
    save_sample(location_id, enriched)
    
    return enriched


def save_sample(location_id: str, records: List[Dict[str, Any]]) -> str:
    ensure_directories()
    sample_file = os.path.join(SAMPLES_DIR, f"{location_id}_sample.json")
    with open(sample_file, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
        
    # Generate manifest
    raw_content = json.dumps(records, sort_keys=True).encode("utf-8")
    data_hash = hashlib.sha256(raw_content).hexdigest()
    
    manifest = {
        "location_id": location_id,
        "sample_file": sample_file,
        "record_count": len(records),
        "sha256": data_hash,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "source": "Open-Meteo Historical / Forecast API",
        "citation": "ERA5 / ECMWF reanalysis & numerical weather prediction via Open-Meteo (CC BY 4.0)"
    }
    
    manifest_file = os.path.join(MANIFESTS_DIR, f"{location_id}_manifest.json")
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        
    return sample_file


def load_cached_samples(location_id: str) -> List[Dict[str, Any]]:
    sample_file = os.path.join(SAMPLES_DIR, f"{location_id}_sample.json")
    if os.path.exists(sample_file):
        with open(sample_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return []
