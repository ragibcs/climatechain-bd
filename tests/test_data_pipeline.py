"""
Tests for data ingestion, schema integrity, rolling windows, and validation rules.
"""

import pytest
from datetime import datetime, date, timedelta
from ml.data.locations import SYLHET_LOCATIONS, get_location_by_id
from ml.data.ingestion import validate_observation, load_cached_samples
from ml.features import compute_rolling_precipitation, compute_rainfall_risk_indicator


def test_location_metadata():
    assert "sylhet-sadar" in SYLHET_LOCATIONS
    assert "sunamganj" in SYLHET_LOCATIONS
    sylhet = get_location_by_id("sylhet-sadar")
    assert sylhet["latitude"] == 24.8949
    assert sylhet["longitude"] == 91.8687
    assert sylhet["danger_level_m"] == 10.80

    with pytest.raises(KeyError):
        get_location_by_id("unknown-station")


def test_validate_observation_ranges():
    # Valid record
    rec_valid = {"date": "2024-06-15", "rainfall_mm": 45.2}
    assert validate_observation(rec_valid) == "VALID"

    # Missing date
    rec_no_date = {"rainfall_mm": 10.0}
    assert validate_observation(rec_no_date) == "MISSING_DATE"

    # Missing rainfall value
    rec_null = {"date": "2024-06-15", "rainfall_mm": None}
    assert validate_observation(rec_null) == "MISSING"

    # Negative rainfall is physically impossible
    rec_neg = {"date": "2024-06-15", "rainfall_mm": -5.0}
    assert validate_observation(rec_neg) == "INVALID_NEGATIVE"

    # Suspiciously high rainfall (> 500mm in 24h)
    rec_extreme = {"date": "2024-06-15", "rainfall_mm": 650.0}
    assert validate_observation(rec_extreme) == "SUSPICIOUS_HIGH"


def test_rolling_window_correctness_and_no_future_leakage():
    # Create 10 days of synthetic test records
    base_date = date(2024, 6, 1)
    # Rainfall: day 0: 10, day 1: 20, day 2: 30, day 3: 40, day 4: 50...
    records = []
    for i in range(10):
        dt = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        records.append({
            "date": dt,
            "rainfall_mm": float((i + 1) * 10)
        })

    # Shuffle records to verify chronological sorting inside computation
    shuffled = list(reversed(records))
    enriched = compute_rolling_precipitation(shuffled)

    assert len(enriched) == 10
    # Day 0 (2024-06-01): rain = 10 -> 3d = 10, 7d = 10
    assert enriched[0]["date"] == "2024-06-01"
    assert enriched[0]["rainfall_3d_mm"] == 10.0
    assert enriched[0]["rainfall_7d_mm"] == 10.0

    # Day 2 (2024-06-03): rain = 30 -> 3d = 10 + 20 + 30 = 60
    assert enriched[2]["date"] == "2024-06-03"
    assert enriched[2]["rainfall_3d_mm"] == 60.0
    assert enriched[2]["rainfall_7d_mm"] == 60.0

    # Day 6 (2024-06-07): rain = 70 -> 7d = 10 + 20 + 30 + 40 + 50 + 60 + 70 = 280
    # 3d = 50 + 60 + 70 = 180
    assert enriched[6]["date"] == "2024-06-07"
    assert enriched[6]["rainfall_3d_mm"] == 180.0
    assert enriched[6]["rainfall_7d_mm"] == 280.0

    # Day 9 (2024-06-10): rain = 100 -> 3d = 80 + 90 + 100 = 270
    # 7d = 40 + 50 + 60 + 70 + 80 + 90 + 100 = 490
    assert enriched[9]["date"] == "2024-06-10"
    assert enriched[9]["rainfall_3d_mm"] == 270.0
    assert enriched[9]["rainfall_7d_mm"] == 490.0


def test_cached_samples_integrity():
    for loc_id in ["sylhet-sadar", "sunamganj", "kanaighat", "zakiganj"]:
        samples = load_cached_samples(loc_id)
        assert len(samples) > 0, f"Sample for {loc_id} should not be empty"
        seen_dates = set()
        for s in samples:
            assert s["location_id"] == loc_id
            assert "rainfall_mm" in s
            assert "rainfall_3d_mm" in s
            assert "rainfall_7d_mm" in s
            assert s["rainfall_mm"] >= 0.0
            # Ensure no duplicate dates
            assert s["date"] not in seen_dates
            seen_dates.add(s["date"])


def test_risk_indicator_monotonicity_and_bounds():
    # Dry weather -> score near 0, LOW
    dry = compute_rainfall_risk_indicator(0.0, 0.0, 0.0)
    assert dry["score"] == 0.0
    assert dry["risk_level"] == "LOW"

    # Moderate rainfall -> MODERATE
    mod = compute_rainfall_risk_indicator(30.0, 60.0, 100.0)
    assert 25.0 <= mod["score"] < 50.0
    assert mod["risk_level"] == "MODERATE"

    # Extreme monsoon downpour -> SEVERE
    severe = compute_rainfall_risk_indicator(180.0, 300.0, 500.0)
    assert severe["score"] == 100.0
    assert severe["risk_level"] == "SEVERE"
