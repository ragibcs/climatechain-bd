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

    # 2. Register report on-chain
    res_reg = client.post("/api/provenance/register", json={
        "report": report,
        "metadata_uri": "ipfs://QmTestMetadataKanaighat"
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
    tampered["score"] = 0.0
    tampered["risk_level"] = "LOW"
    res_mismatch = client.post("/api/provenance/verify", json={"report": tampered})
    assert res_mismatch.status_code == 200
    mismatch_data = res_mismatch.json()
    assert mismatch_data["status"] == "MISMATCH"
    assert mismatch_data["verified"] is False

    # 7. Simulate RPC failure -> 503 UNAVAILABLE
    blockchain_client.simulate_rpc_failure = True
    res_fail = client.get(f"/api/provenance/{report_id}")
    assert res_fail.status_code == 503
