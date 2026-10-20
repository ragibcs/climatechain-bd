"""
FastAPI integration tests for all API contract endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from services.api.main import app, blockchain_client


@pytest.fixture
def client():
    # Reset simulator registry and failure flags before test
    blockchain_client._local_registry.clear()
    blockchain_client.simulate_rpc_failure = False
    with TestClient(app) as test_client:
        yield test_client


def test_api_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "environment" in data
    assert "dependencies" in data
    assert data["environment"]["provenance_mode"] in [
        "ONCHAIN",
        "ONCHAIN_READ_ONLY",
        "SIMULATED_FALLBACK",
        "LOCAL_SIMULATOR",
    ]
    assert data["environment"]["provenance_write_enabled"] is False
    assert data["dependencies"]["open_meteo_api"] in [
        "not_probed",
        "available",
        "unavailable",
    ]


def test_api_locations(client):
    res = client.get("/api/locations")
    assert res.status_code == 200
    locations = res.json()
    assert len(locations) >= 4
    ids = [loc["id"] for loc in locations]
    assert "sylhet-sadar" in ids
    assert "sunamganj" in ids


def test_api_observations(client):
    res = client.get("/api/observations?location_id=sylhet-sadar&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["location"]["id"] == "sylhet-sadar"
    assert len(data["observations"]) > 0

    # 404 on invalid location
    res_err = client.get("/api/observations?location_id=non-existent-area")
    assert res_err.status_code == 404


def test_api_risk_and_predictions(client):
    # GET /api/risk
    res_risk = client.get("/api/risk?location_id=sylhet-sadar&as_of=2024-06-20")
    assert res_risk.status_code == 200
    report = res_risk.json()
    assert report["location_id"] == "sylhet-sadar"
    assert report["target"] == "rainfall_risk_indicator"
    assert "score" in report
    assert "explanation" in report

    # POST /api/predictions
    res_pred = client.post("/api/predictions", json={
        "location_id": "sunamganj",
        "as_of": "2024-06-20",
        "use_live_api": False
    })
    assert res_pred.status_code == 200
    pred_data = res_pred.json()
    assert pred_data["location_id"] == "sunamganj"
    assert pred_data["score"] >= 0.0


def test_api_provenance_full_cycle(client):
    # 1. Generate report
    res_pred = client.post("/api/predictions", json={
        "location_id": "kanaighat",
        "as_of": "2024-06-20",
        "use_live_api": False
    })
    report = res_pred.json()

    # 2. Register the report commitment (simulator in the test environment)
    res_reg = client.post("/api/provenance/register", json={
        "report": report,
        "metadata_uri": "urn:climatechain:test:kanaighat"
    })
    assert res_reg.status_code == 200
    reg_data = res_reg.json()
    assert reg_data["status"] == "SUCCESS"
    report_id = reg_data["record"]["report_id"]

    # 3. Lookup report
    res_get = client.get(f"/api/provenance/{report_id}")
    assert res_get.status_code == 200
    assert res_get.json()["report_id"] == report_id

    # 4. Duplicate registration -> 409 Conflict
    res_dup = client.post("/api/provenance/register", json={"report": report})
    assert res_dup.status_code == 409

    # 5. Verify unchanged report -> VERIFIED
    res_ver = client.post("/api/provenance/verify", json={"report": report})
    assert res_ver.status_code == 200
    ver_data = res_ver.json()
    assert ver_data["status"] == "VERIFIED"
    assert ver_data["verified"] is True

    # 6. Tamper report -> MISMATCH
    tampered = dict(report)
    tampered["score"] = 99.9
    tampered["risk_level"] = "SEVERE"
    res_mismatch = client.post("/api/provenance/verify", json={"report": tampered})
    assert res_mismatch.status_code == 200
    mismatch_data = res_mismatch.json()
    assert mismatch_data["status"] == "MISMATCH"
    assert mismatch_data["verified"] is False

    # 7. Simulate RPC failure -> 503 UNAVAILABLE
    blockchain_client.simulate_rpc_failure = True
    res_fail = client.get(f"/api/provenance/{report_id}")
    assert res_fail.status_code == 503


def test_api_overview_snapshot(client):
    res = client.get("/api/overview?live=false")
    assert res.status_code == 200
    data = res.json()
    assert data["station_count"] == 4
    assert len(data["stations"]) == 4
    assert data["basin_score"] is not None
    assert data["basin_risk_level"] in ["LOW", "MODERATE", "HIGH", "SEVERE"]
    assert data["data_mode"] == "OFFLINE_CACHE"
    assert data["highest_risk_station"] in [station["id"] for station in data["stations"]]
    for station in data["stations"]:
        assert station["score"] is not None
        assert station["risk_level"] in ["LOW", "MODERATE", "HIGH", "SEVERE", "UNKNOWN"]
        assert isinstance(station["sparkline"], list)


def test_api_overview_historical_scenario(client):
    res = client.get("/api/overview?as_of=2024-06-19&live=false")
    assert res.status_code == 200
    data = res.json()
    assert data["as_of"] == "2024-06-19"
    assert data["data_mode"] == "HISTORICAL_REANALYSIS"
    assert all(station["as_of"] <= "2024-06-19" for station in data["stations"])

    bad = client.get("/api/overview?as_of=not-a-date")
    assert bad.status_code == 422


def test_api_forecast_contract(client):
    res = client.get("/api/forecast?location_id=sylhet-sadar&days=7")
    assert res.status_code == 200
    data = res.json()
    assert data["location_id"] == "sylhet-sadar"
    assert "available" in data
    assert isinstance(data["forecast"], list)
    if data["available"]:
        assert data["data_mode"] == "FORECAST"
        assert data["days"] == len(data["forecast"])
        assert data["risk_level"] in ["LOW", "MODERATE", "HIGH", "SEVERE"]

    bad = client.get("/api/forecast?location_id=non-existent-area")
    assert bad.status_code == 404


def test_api_dataset_manifest_integrity(client):
    res = client.get("/api/datasets")
    assert res.status_code == 200
    data = res.json()
    assert data["dataset_count"] >= 4
    assert data["integrity_verified_count"] == data["dataset_count"]
    for dataset in data["datasets"]:
        assert dataset["integrity_verified"] is True
        assert dataset["sha256"] == dataset["computed_sha256"]
        assert dataset["record_count"] > 0


def test_api_rejects_invalid_date_and_forecast_registration(client):
    assert client.get("/api/risk?location_id=sylhet-sadar&as_of=2024-13-40").status_code == 422
    assert client.get("/api/observations?location_id=sylhet-sadar&start_date=bad").status_code == 422

    forecast_report = {
        "location_id": "sylhet-sadar",
        "as_of": "2026-10-20",
        "target": "rainfall_risk_indicator",
        "model_version": "rainfall-indicator-v1",
        "risk_level": "HIGH",
        "data_mode": "FORECAST",
    }
    res = client.post("/api/provenance/register", json={"report": forecast_report})
    assert res.status_code == 422
    assert "Forecast" in res.json()["detail"]


def test_api_provenance_validation_and_registry(client):
    # Incomplete report payloads are rejected before hashing.
    invalid = client.post("/api/provenance/register", json={"report": {"location_id": "sylhet-sadar"}})
    assert invalid.status_code == 422

    invalid_verify = client.post("/api/provenance/verify", json={"report": {}})
    assert invalid_verify.status_code == 422

    invalid_id = client.get("/api/provenance/0x1234")
    assert invalid_id.status_code == 422

    # Registry starts empty, then reflects a successful registration.
    empty = client.get("/api/provenance/registry")
    assert empty.status_code == 200
    assert empty.json()["count"] == 0

    report = client.post(
        "/api/predictions",
        json={"location_id": "zakiganj", "as_of": "2024-06-20", "use_live_api": False},
    ).json()
    registered = client.post("/api/provenance/register", json={"report": report})
    assert registered.status_code == 200

    registry = client.get("/api/provenance/registry")
    assert registry.status_code == 200
    payload = registry.json()
    assert payload["count"] == 1
    assert payload["mode"] in ["LOCAL_SIMULATOR", "SIMULATED_FALLBACK"]
    assert payload["write_enabled"] is False
    assert payload["records"][0]["report_id"] == registered.json()["record"]["report_id"]
    assert payload["records"][0]["network"].startswith(("Local Simulator", "Sepolia Testnet"))
