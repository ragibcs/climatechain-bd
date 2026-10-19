"""
Tests for ML inference engine, prediction schema, and risk report generation.
"""

import pytest
from ml.inference import generate_risk_report, MODEL_VERSION, MODEL_TARGET, DISCLAIMER_LIMITATIONS


def test_generate_risk_report_schema():
    report = generate_risk_report(
        location_id="sylhet-sadar",
        as_of="2024-06-20",
        use_live_api=False
    )
    
    # Required top-level schema fields
    assert "report_id" in report
    assert report["location_id"] == "sylhet-sadar"
    assert report["location_name"] == "Sylhet Sadar"
    assert "coordinates" in report
    assert report["coordinates"]["latitude"] == 24.8949
    assert report["coordinates"]["longitude"] == 91.8687
    assert report["as_of"] == "2024-06-20"
    assert report["target"] == MODEL_TARGET
    assert report["model_version"] == MODEL_VERSION
    assert report["risk_level"] in ["LOW", "MODERATE", "HIGH", "SEVERE"]
    assert 0.0 <= report["score"] <= 100.0
    assert "data_quality" in report
    assert "explanation" in report
    assert "factors" in report["explanation"]
    assert len(report["explanation"]["factors"]) == 3
    assert "limitations" in report
    assert len(report["limitations"]) > 0


def test_report_limitations_content():
    report = generate_risk_report("sunamganj", as_of="2024-06-25", use_live_api=False)
    assert any("Research prototype" in lim for lim in report["limitations"])
    assert any("Not an official flood forecasting" in lim for lim in report["limitations"])
    assert report["target"] == "rainfall_risk_indicator"
