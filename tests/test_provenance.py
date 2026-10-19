"""
Tests for canonicalization, cryptographic hashing, blockchain provenance, and tamper detection.
"""

import pytest
from services.api.provenance.canonical import (
    canonicalize_value,
    serialize_canonical_json,
    compute_data_hash,
    compute_report_hash,
    generate_deterministic_report_id
)
from services.api.provenance.blockchain_client import (
    BlockchainClient,
    ProvenanceVerificationState
)
from ml.inference import generate_risk_report


def test_canonical_json_determinism():
    # Dict with keys in different orders and whitespace differences
    dict_a = {"b": 2.0, "a": "hello  ", "c": [3, 2, 1]}
    dict_b = {"a": "hello", "c": [3, 2, 1], "b": 2.0000}

    serialized_a = serialize_canonical_json(dict_a)
    serialized_b = serialize_canonical_json(dict_b)

    assert serialized_a == serialized_b
    assert serialized_a == '{"a":"hello","b":2.0,"c":[3,2,1]}'


def test_domain_separated_hashes():
    sample_payload = {"location_id": "sylhet-sadar", "as_of": "2024-06-20"}
    data_hash = compute_data_hash(sample_payload)
    report_hash = compute_report_hash({
        "location_id": "sylhet-sadar",
        "as_of": "2024-06-20",
        "target": "rainfall_risk_indicator",
        "model_version": "v1",
        "risk_level": "MODERATE"
    })

    assert data_hash.startswith("0x")
    assert len(data_hash) == 66  # 0x + 64 hex chars = bytes32
    assert report_hash.startswith("0x")
    assert len(report_hash) == 66
    assert data_hash != report_hash


def test_provenance_lifecycle_and_tamper_detection():
    client = BlockchainClient()
    report = generate_risk_report("sylhet-sadar", as_of="2024-06-20", use_live_api=False)

    # 1. Register report
    reg_record = client.register_report(report)
    assert reg_record["report_id"].startswith("0x")
    assert reg_record["transaction_hash"].startswith("0x")

    # 2. Verify unchanged report -> VERIFIED
    res_verified = client.verify_report(report)
    assert res_verified["status"] == ProvenanceVerificationState.VERIFIED
    assert res_verified["verified"] is True
    assert res_verified["computed_hash"] == reg_record["report_hash"]

    # 3. Duplicate registration should be rejected
    with pytest.raises(ValueError, match="already registered"):
        client.register_report(report)

    # 4. Modify one field (tampering simulation) -> MISMATCH
    tampered_report = dict(report)
    tampered_report["risk_level"] = "LOW"  # Altered severity
    tampered_report["score"] = 5.0

    res_tampered = client.verify_report(tampered_report)
    assert res_tampered["status"] == ProvenanceVerificationState.MISMATCH
    assert res_tampered["verified"] is False
    assert res_tampered["computed_hash"] != reg_record["report_hash"]

    # 5. Non-existent report -> NOT_FOUND
    fake_report = dict(report)
    fake_report["as_of"] = "1999-01-01"
    res_not_found = client.verify_report(fake_report)
    assert res_not_found["status"] == ProvenanceVerificationState.NOT_FOUND
    assert res_not_found["verified"] is False

    # 6. Simulated RPC failure -> UNAVAILABLE (never a false MISMATCH)
    client.simulate_rpc_failure = True
    res_unavailable = client.verify_report(report)
    assert res_unavailable["status"] == ProvenanceVerificationState.UNAVAILABLE
    assert res_unavailable["verified"] is False
    assert "RPC is unreachable" in res_unavailable["reason"]
