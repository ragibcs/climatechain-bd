"""
Weather and climate observation data ingestion for Sylhet, Bangladesh.
Fetches from Open-Meteo Historical Archive and Forecast APIs with full schema validation,
caching, offline fallback samples, and data provenance manifests.
"""

import os
import json
import time
import hashlib
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple

import requests

from ml.data.locations import SYLHET_LOCATIONS, get_location_by_id
from ml.features import compute_rolling_precipitation

logger = logging.getLogger("climatechain.ingestion")

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
SAMPLES_DIR = os.path.join(DATA_DIR, "samples")
MANIFESTS_DIR = os.path.join(DATA_DIR, "manifests")

OPEN_METEO_ARCHIVE_URL = os.getenv("OPEN_METEO_BASE_URL", "https://archive-api.open-meteo.com/v1/archive")
OPEN_METEO_FORECAST_URL = os.getenv("OPEN_METEO_FORECAST_URL", "https://api.open-meteo.com/v1/forecast")

# Small in-process response cache. Upstream reanalysis data changes slowly and the
# dashboard polls several stations per page view, so caching keeps the demo snappy
# while remaining fully reproducible when the cache is cold.
_CACHE: Dict[str, Tuple[float, Any]] = {}
CACHE_TTL_SECONDS = int(os.getenv("OPEN_METEO_CACHE_TTL", "600"))

# Lightweight, honest dependency status for /api/health. We only report what we
# have actually observed during this process; we never assume the upstream API
# is available just because a URL is configured.
_UPSTREAM_STATUS: Dict[str, Optional[str]] = {
    "open_meteo": "not_probed",
    "last_checked_at": None,
    "last_success_at": None,
    "last_error": None,
}


def _mark_upstream(success: bool, error: Optional[str] = None) -> None:
    now = datetime.now(timezone.utc).isoformat()
    _UPSTREAM_STATUS["open_meteo"] = "available" if success else "unavailable"
    _UPSTREAM_STATUS["last_checked_at"] = now
    if success:
        _UPSTREAM_STATUS["last_success_at"] = now
        _UPSTREAM_STATUS["last_error"] = None
    else:
        _UPSTREAM_STATUS["last_error"] = (error or "Unknown upstream error")[:240]


def get_upstream_status() -> Dict[str, Optional[str]]:
    """Returns the latest observed Open-Meteo status for health reporting."""
    return dict(_UPSTREAM_STATUS)


def _cache_get(key: str) -> Optional[Any]:
    entry = _CACHE.get(key)
    if not entry:
        return None
    created_at, value = entry
    if time.time() - created_at > CACHE_TTL_SECONDS:
        _CACHE.pop(key, None)
        return None
    return value


def _cache_set(key: str, value: Any) -> None:
    _CACHE[key] = (time.time(), value)


def _get_json(url: str, params: Dict[str, Any], timeout: int) -> Dict[str, Any]:
    """Fetch JSON with one polite retry when Open-Meteo rate-limits a request."""
    response = requests.get(url, params=params, timeout=timeout)
    if response.status_code == 429:
        retry_after = response.headers.get("Retry-After")
        try:
            delay = min(float(retry_after), 5.0) if retry_after else 1.5
        except ValueError:
            delay = 1.5
        time.sleep(delay)
        response = requests.get(url, params=params, timeout=timeout)
    response.raise_for_status()
    return response.json()


def clear_cache() -> None:
    """Exposed for tests and for the optional manual refresh endpoint."""
    _CACHE.clear()


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


def fetch_open_meteo_observations_with_status(
    location_id: str,
    start_date: str,
    end_date: str,
    timeout: int = 10,
    persist: bool = False
) -> Tuple[List[Dict[str, Any]], str]:
    """
    Fetches observations and returns ``(records, data_quality)``.

    ``data_quality`` is `VALID` for a successful, complete upstream response,
    `PARTIAL` when some values failed validation, and `DEGRADED_OFFLINE_CACHE`
    when the committed sample was used because the provider was unreachable or
    returned no usable rows. The dashboard surfaces this label instead of
    silently presenting cached June 2024 data as a live observation.

    `persist` is intentionally opt-in: serving a dashboard request should not
    rewrite the committed reproducibility snapshot. Use it from the seed script.
    """
    loc = get_location_by_id(location_id)
    lat = loc["latitude"]
    lon = loc["longitude"]

    cache_key = f"observations:{location_id}:{start_date}:{end_date}"
    cached = _cache_get(cache_key)
    if cached is not None:
        rows, quality = cached if isinstance(cached, tuple) else (cached, "VALID")
        return [dict(r) for r in rows], quality

    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "precipitation_sum,rain_sum",
        "timezone": "Asia/Dhaka"
    }

    # Check if querying past or near-present/future
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    url = OPEN_METEO_FORECAST_URL if end_date >= today_str else OPEN_METEO_ARCHIVE_URL

    try:
        data = _get_json(url, params, timeout)
        _mark_upstream(True)
    except Exception as e:
        logger.warning(f"Error fetching from {url} for {location_id}: {e}. Checking local sample.")
        _mark_upstream(False, str(e))
        return load_cached_samples(location_id), "DEGRADED_OFFLINE_CACHE"

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

    # Never cache an empty upstream response; fall back to the committed sample.
    if not enriched:
        _mark_upstream(False, "Upstream response contained no usable daily records")
        return load_cached_samples(location_id), "DEGRADED_OFFLINE_CACHE"

    quality = "VALID" if all(r["quality_flag"] == "VALID" for r in enriched) else "PARTIAL"
    _cache_set(cache_key, (enriched, quality))

    # Save local sample for offline reproducibility when explicitly requested.
    if persist:
        save_sample(location_id, enriched)

    return enriched, quality


def fetch_open_meteo_observations(
    location_id: str,
    start_date: str,
    end_date: str,
    timeout: int = 10,
    persist: bool = False
) -> List[Dict[str, Any]]:
    """Backwards-compatible list-only wrapper around the quality-aware fetch."""
    records, _ = fetch_open_meteo_observations_with_status(
        location_id=location_id,
        start_date=start_date,
        end_date=end_date,
        timeout=timeout,
        persist=persist,
    )
    return records


def fetch_open_meteo_forecast(
    location_id: str,
    days: int = 7,
    timeout: int = 10
) -> List[Dict[str, Any]]:
    """
    Fetches the upcoming daily precipitation forecast for a station.

    Returns an empty list when the upstream forecast service is unavailable so the
    UI can degrade gracefully instead of inventing forecast values.
    """
    loc = get_location_by_id(location_id)
    days = max(1, min(int(days), 16))
    cache_key = f"forecast:{location_id}:{days}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return [dict(r) for r in cached]

    params = {
        "latitude": loc["latitude"],
        "longitude": loc["longitude"],
        "daily": ",".join([
            "precipitation_sum",
            "precipitation_probability_max",
            "temperature_2m_max",
            "temperature_2m_min",
            "weather_code",
        ]),
        "forecast_days": days,
        "timezone": "Asia/Dhaka",
    }

    try:
        daily = _get_json(OPEN_METEO_FORECAST_URL, params, timeout).get("daily", {})
        _mark_upstream(True)
    except Exception as e:
        logger.warning(f"Forecast unavailable for {location_id}: {e}")
        _mark_upstream(False, str(e))
        return []

    times = daily.get("time", []) or []
    precip = daily.get("precipitation_sum", []) or []
    probability = daily.get("precipitation_probability_max", []) or []
    temp_max = daily.get("temperature_2m_max", []) or []
    temp_min = daily.get("temperature_2m_min", []) or []
    weather_code = daily.get("weather_code", []) or []

    def _at(seq: List[Any], idx: int) -> Optional[float]:
        return seq[idx] if idx < len(seq) else None

    records: List[Dict[str, Any]] = []
    for idx, dt in enumerate(times):
        rain = _at(precip, idx)
        records.append({
            "date": dt,
            "location_id": location_id,
            "rainfall_mm": round(float(rain), 2) if rain is not None else 0.0,
            "precipitation_probability_pct": int(probability[idx]) if idx < len(probability) and probability[idx] is not None else None,
            "temperature_max_c": round(float(temp_max[idx]), 1) if idx < len(temp_max) and temp_max[idx] is not None else None,
            "temperature_min_c": round(float(temp_min[idx]), 1) if idx < len(temp_min) and temp_min[idx] is not None else None,
            "weather_code": int(weather_code[idx]) if idx < len(weather_code) and weather_code[idx] is not None else None,
            "is_forecast": True,
            "source_id": "open-meteo-ecmwf-forecast",
        })

    if not records:
        return []

    _cache_set(cache_key, records)
    return records


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
        "sample_file": os.path.relpath(sample_file, DATA_DIR).replace(os.sep, "/"),
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
