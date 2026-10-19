"""
Canonicalization and cryptographic hashing specification for ClimateChain BD.
Implements domain-separated SHA-256 hashing to bytes32 format for EVM smart contracts.
"""

import json
import hashlib
from typing import Dict, Any, Union

CANONICAL_SCHEMA_VERSION = "climatechain-provenance-v1"

DOMAIN_DATA_BATCH = "CLIMATECHAIN_BD_DATA_BATCH_V1:"
DOMAIN_PREDICTION_REPORT = "CLIMATECHAIN_BD_PREDICTION_REPORT_V1:"
DOMAIN_REPORT_ID = "CLIMATECHAIN_BD_REPORT_ID_V1:"


def canonicalize_value(val: Any) -> Any:
    """Recursively normalizes Python types to deterministic representation."""
    if isinstance(val, dict):
        return {str(k): canonicalize_value(v) for k, v in sorted(val.items())}
    elif isinstance(val, (list, tuple)):
        return [canonicalize_value(x) for x in val]
    elif isinstance(val, float):
        # Round floats to 4 decimal places to ensure floating point determinism
        return round(val, 4)
    elif isinstance(val, (int, bool, type(None))):
        return val
    elif isinstance(val, str):
        return val.strip()
    else:
        return str(val)


def serialize_canonical_json(data: Dict[str, Any]) -> str:
    """
    Serializes data to canonical JSON:
    - Sorted keys
    - Minimal separators (no extra whitespace)
    - UTF-8 representation
    """
    normalized = canonicalize_value(data)
    return json.dumps(normalized, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def hash_canonical_json(prefix: str, data: Dict[str, Any]) -> str:
    """
    Computes domain-separated SHA-256 hash formatted as a 0x-prefixed 64-char hex string (bytes32).
    """
    canon_str = serialize_canonical_json(data)
    payload = (prefix + canon_str).encode("utf-8")
    digest = hashlib.sha256(payload).hexdigest()
    return f"0x{digest}"


def compute_data_hash(observations: Union[Dict[str, Any], list]) -> str:
    """Domain-separated hash for climate observations dataset/batch."""
    wrapper = {"schema_version": CANONICAL_SCHEMA_VERSION, "data": observations}
    return hash_canonical_json(DOMAIN_DATA_BATCH, wrapper)


def compute_report_hash(report: Dict[str, Any]) -> str:
    """
    Domain-separated hash for prediction risk report.
    Excludes ephemeral client state or blockchain receipt metadata to maintain purity.
    """
    # Core report fields that constitute the commitment
    commitment_fields = {
        "schema_version": CANONICAL_SCHEMA_VERSION,
        "location_id": report["location_id"],
        "as_of": report["as_of"],
        "target": report["target"],
        "model_version": report["model_version"],
        "risk_level": report["risk_level"],
        "score": report.get("score"),
        "metrics": report.get("metrics"),
        "explanation": report.get("explanation"),
        "limitations": report.get("limitations")
    }
    return hash_canonical_json(DOMAIN_PREDICTION_REPORT, commitment_fields)


def generate_deterministic_report_id(location_id: str, as_of: str, model_version: str) -> str:
    """
    Generates deterministic 32-byte report ID (bytes32 format):
    SHA-256(DOMAIN_REPORT_ID + location_id + ":" + as_of + ":" + model_version)
    """
    raw = f"{DOMAIN_REPORT_ID}{location_id.strip().lower()}:{as_of.strip()}:{model_version.strip()}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"0x{digest}"
