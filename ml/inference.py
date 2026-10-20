"""
Risk assessment inference engine for ClimateChain BD.
Generates structured, validated prediction reports adhering to the prediction schema in CLAUDE.md.
"""

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

from ml.data.locations import get_location_by_id, list_locations
from ml.data.ingestion import (
    fetch_open_meteo_observations_with_status,
    load_cached_samples,
    fetch_open_meteo_forecast,
)
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
            observations, data_quality = fetch_open_meteo_observations_with_status(
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

    # Never substitute a future or unrelated record for a requested as_of date.
    records_matching = [r for r in observations if r["date"] <= as_of_str]
    if not records_matching:
        raise ValueError(
            f"No observation available on or before {as_of_str} for {location_id}."
        )
    latest_rec = records_matching[-1]
    
    r1 = float(latest_rec.get("rainfall_mm") or 0.0)
    r3 = float(latest_rec.get("rainfall_3d_mm") or r1)
    r7 = float(latest_rec.get("rainfall_7d_mm") or r3)
    
    risk_info = compute_rainfall_risk_indicator(r1, r3, r7)

    today_str = now_utc.strftime("%Y-%m-%d")
    if data_quality in {"DEGRADED_OFFLINE_CACHE", "CACHED_SAMPLE"}:
        data_mode = "OFFLINE_CACHE"
    else:
        data_mode = "HISTORICAL_REANALYSIS" if latest_rec["date"] < today_str else "LIVE_OBSERVED"

    # Compact, past-only trend used by the dashboard sparkline. It deliberately
    # reuses the same records that fed the score so the visual cannot disagree
    # with the reported index.
    recent = [r for r in observations if r["date"] <= latest_rec["date"]][-14:]
    trend = [
        {
            "date": r["date"],
            "rainfall_mm": round(float(r.get("rainfall_mm") or 0.0), 2),
            "rainfall_3d_mm": round(float(r.get("rainfall_3d_mm") or 0.0), 2),
            "rainfall_7d_mm": round(float(r.get("rainfall_7d_mm") or 0.0), 2),
        }
        for r in recent
    ]
    previous_rain = float(recent[-2].get("rainfall_mm") or 0.0) if len(recent) > 1 else 0.0
    peak_3d = max((float(r.get("rainfall_3d_mm") or 0.0) for r in recent), default=r3)

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
            "river_level_m": latest_rec.get("river_level_m"),
            "peak_3d_mm": round(peak_3d, 1),
            "rainfall_delta_1d_mm": round(r1 - previous_rain, 1)
        },
        "data_quality": data_quality,
        "data_mode": data_mode,
        "data_source": "Open-Meteo · ECMWF ERA5 reanalysis & numerical weather prediction",
        "station": {
            "river": location.get("river"),
            "district": location.get("district"),
            "elevation_m": location.get("elevation_m"),
            "bwdb_station_id": location.get("bwdb_station_id"),
            "danger_level_m": location.get("danger_level_m")
        },
        "explanation": {
            "summary": risk_info["summary"],
            "factors": risk_info["factors"]
        },
        "trend": trend,
        "limitations": DISCLAIMER_LIMITATIONS
    }
    
    return report


def generate_station_overview(
    as_of: Optional[str] = None,
    use_live_api: bool = True
) -> Dict[str, Any]:
    """
    Returns a lightweight risk snapshot for every supported station.

    This powers the station comparison cards and the basin map. Failures for a
    single station are isolated so one upstream timeout cannot blank the whole
    dashboard.
    """
    locations = list_locations()

    def _one(location: Dict[str, Any]) -> Dict[str, Any]:
        try:
            report = generate_risk_report(
                location["id"], as_of=as_of, use_live_api=use_live_api
            )
            trend = report.get("trend", [])
            return {
                "id": report["location_id"],
                "name": report["location_name"],
                "river": report["station"]["river"],
                "district": report["station"]["district"],
                "latitude": report["coordinates"]["latitude"],
                "longitude": report["coordinates"]["longitude"],
                "elevation_m": report["station"]["elevation_m"],
                "danger_level_m": report["station"]["danger_level_m"],
                "score": report["score"],
                "risk_level": report["risk_level"],
                "severity_label": report["severity_label"],
                "rainfall_1d_mm": report["metrics"]["rainfall_1d_mm"],
                "rainfall_3d_mm": report["metrics"]["rainfall_3d_mm"],
                "rainfall_7d_mm": report["metrics"]["rainfall_7d_mm"],
                "rainfall_delta_1d_mm": report["metrics"]["rainfall_delta_1d_mm"],
                "as_of": report["as_of"],
                "data_quality": report["data_quality"],
                "data_mode": report["data_mode"],
                "sparkline": [
                    {"date": p["date"], "rainfall_mm": p["rainfall_mm"]}
                    for p in trend[-10:]
                ],
            }
        except Exception as exc:  # pragma: no cover - defensive isolation
            return {
                "id": location["id"],
                "name": location["name"],
                "river": location.get("river"),
                "district": location.get("district"),
                "latitude": location["latitude"],
                "longitude": location["longitude"],
                "elevation_m": location.get("elevation_m"),
                "danger_level_m": location.get("danger_level_m"),
                "score": None,
                "risk_level": "UNKNOWN",
                "severity_label": "Risk unavailable",
                "rainfall_1d_mm": None,
                "rainfall_3d_mm": None,
                "rainfall_7d_mm": None,
                "rainfall_delta_1d_mm": None,
                "as_of": as_of,
                "data_quality": "UNAVAILABLE",
                "data_mode": "UNKNOWN",
                "sparkline": [],
                "error": str(exc),
            }

    # The four upstream calls are independent; fetch them concurrently so the
    # station overview stays comfortably inside a live-demo time budget.
    if use_live_api and len(locations) > 1:
        with ThreadPoolExecutor(max_workers=len(locations)) as pool:
            stations = list(pool.map(_one, locations))
    else:
        stations = [_one(location) for location in locations]

    ranked = sorted(
        [s for s in stations if s["score"] is not None],
        key=lambda s: s["score"],
        reverse=True,
    )
    basin_score = round(sum(s["score"] for s in ranked) / len(ranked), 1) if ranked else None
    basin_level = "UNKNOWN"
    if basin_score is not None:
        if basin_score >= 75:
            basin_level = "SEVERE"
        elif basin_score >= 50:
            basin_level = "HIGH"
        elif basin_score >= 25:
            basin_level = "MODERATE"
        else:
            basin_level = "LOW"

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "as_of": stations[0]["as_of"] if stations else as_of,
        "basin_score": basin_score,
        "basin_risk_level": basin_level,
        "highest_risk_station": ranked[0]["id"] if ranked else None,
        "station_count": len(stations),
        "stations": stations,
    }


def generate_forecast_outlook(location_id: str, days: int = 7) -> Dict[str, Any]:
    """
    Builds a clearly-labelled forecast outlook from Open-Meteo daily precipitation.

    The outlook reuses the exact SRRI formulation, but on forecast rainfall, and is
    therefore tagged `data_mode = FORECAST` so it can never be mistaken for an
    observed-risk report or be registered as historical provenance.
    """
    location = get_location_by_id(location_id)
    days = max(1, min(int(days), 16))
    records = fetch_open_meteo_forecast(location_id, days=days)
    if not records:
        return {
            "available": False,
            "location_id": location_id,
            "location_name": location["name"],
            "days": days,
            "reason": "Forecast provider unreachable. No forecast values are shown; the latest observation snapshot remains available.",
            "forecast": [],
        }

    rains = [float(r.get("rainfall_mm") or 0.0) for r in records]
    total = round(sum(rains), 1)
    peak = max(rains) if rains else 0.0
    peak_idx = rains.index(peak) if rains else 0

    # Maximum 3-day rainfall anywhere in the forecast horizon.
    max_3d = 0.0
    for idx in range(len(rains)):
        max_3d = max(max_3d, sum(rains[max(0, idx - 2): idx + 1]))

    outlook = compute_rainfall_risk_indicator(rains[0] if rains else 0.0, max_3d, total)
    wettest_day = records[peak_idx]["date"] if records else None

    return {
        "available": True,
        "location_id": location_id,
        "location_name": location["name"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "data_mode": "FORECAST",
        "source": "Open-Meteo 7-day numerical weather prediction (ECMWF)",
        "days": len(records),
        "total_mm": total,
        "peak_daily_mm": round(peak, 1),
        "peak_3d_mm": round(max_3d, 1),
        "wettest_day": wettest_day,
        "score": outlook["score"],
        "risk_level": outlook["risk_level"],
        "severity_label": outlook["severity_label"],
        "summary": outlook["summary"],
        "forecast": records,
    }
