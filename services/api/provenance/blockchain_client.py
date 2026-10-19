"""
Blockchain client for ClimateChain BD provenance registry.
Interacts with the EVM ClimateProvenance smart contract on Sepolia testnet or local EVM network.
Supports offline simulation / graceful error handling matching the 5 verification states:
VERIFIED, MISMATCH, NOT_FOUND, UNAVAILABLE, PENDING.
"""

import os
import json
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timezone

from web3 import Web3
from web3.exceptions import Web3Exception

from services.api.provenance.canonical import (
    compute_report_hash,
    compute_data_hash,
    generate_deterministic_report_id,
    serialize_canonical_json
)

logger = logging.getLogger("climatechain.provenance")

ARTIFACT_PATH = os.path.join(os.path.dirname(__file__), "ClimateProvenance.json")


class ProvenanceVerificationState:
    VERIFIED = "VERIFIED"
    MISMATCH = "MISMATCH"
    NOT_FOUND = "NOT_FOUND"
    UNAVAILABLE = "UNAVAILABLE"
    PENDING = "PENDING"


class BlockchainClient:
    def __init__(
        self,
        rpc_url: Optional[str] = None,
        contract_address: Optional[str] = None,
        private_key: Optional[str] = None,
        chain_id: int = 11155111
    ):
        self.rpc_url = rpc_url or os.getenv("RPC_URL")
        self.contract_address = contract_address or os.getenv("CONTRACT_ADDRESS")
        self.private_key = private_key or os.getenv("DEPLOYER_PRIVATE_KEY")
        self.chain_id = int(os.getenv("CHAIN_ID", chain_id))
        
        self.w3: Optional[Web3] = None
        self.contract = None
        self.abi = self._load_abi()
        
        # In-memory local registry for testing & offline simulation
        self._local_registry: Dict[str, Dict[str, Any]] = {}
        self.simulate_rpc_failure = False

        self._init_web3()

    def _load_abi(self) -> list:
        if os.path.exists(ARTIFACT_PATH):
            try:
                with open(ARTIFACT_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("abi", [])
            except Exception as e:
                logger.error(f"Failed to load contract artifact: {e}")
        return []

    def _init_web3(self):
        if self.rpc_url and self.rpc_url.startswith(("http://", "https://")):
            try:
                self.w3 = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 5}))
                if self.w3.is_connected() and self.contract_address and self.abi:
                    checksum_addr = Web3.to_checksum_address(self.contract_address)
                    self.contract = self.w3.eth.contract(address=checksum_addr, abi=self.abi)
                    logger.info(f"Connected to EVM RPC at {self.rpc_url}, contract: {checksum_addr}")
            except Exception as e:
                logger.warning(f"Could not connect to EVM RPC ({self.rpc_url}): {e}. Using fallback simulator.")
                self.w3 = None
                self.contract = None

    def register_report(
        self,
        report: Dict[str, Any],
        observations_snapshot: Optional[Any] = None,
        metadata_uri: str = "ipfs://climatechain-bd-report-manifest"
    ) -> Dict[str, Any]:
        """
        Registers a report commitment on-chain.
        Calculates report_id, report_hash, data_hash, submits tx or stores in simulated registry.
        """
        if self.simulate_rpc_failure:
            raise ConnectionError("Simulated EVM RPC failure")

        loc_id = report["location_id"]
        as_of = report["as_of"]
        model_version = report["model_version"]

        report_id_hex = generate_deterministic_report_id(loc_id, as_of, model_version)
        report_hash_hex = compute_report_hash(report)
        data_hash_hex = compute_data_hash(observations_snapshot or report.get("metrics", {}))

        # Check if already registered
        if self.contract and self.w3 and self.w3.is_connected():
            try:
                report_id_bytes = bytes.fromhex(report_id_hex[2:])
                is_reg = self.contract.functions.isReportRegistered(report_id_bytes).call()
                if is_reg:
                    raise ValueError(f"Report {report_id_hex} is already registered on-chain.")
            except Exception as e:
                if "already registered" in str(e).lower():
                    raise
                logger.warning(f"Error querying on-chain existence: {e}")

        # If live private key and contract available, send real tx
        if self.contract and self.w3 and self.w3.is_connected() and self.private_key:
            try:
                account = self.w3.eth.account.from_key(self.private_key)
                report_id_bytes = bytes.fromhex(report_id_hex[2:])
                data_hash_bytes = bytes.fromhex(data_hash_hex[2:])
                report_hash_bytes = bytes.fromhex(report_hash_hex[2:])

                nonce = self.w3.eth.get_transaction_count(account.address)
                tx = self.contract.functions.registerReport(
                    report_id_bytes,
                    data_hash_bytes,
                    report_hash_bytes,
                    model_version,
                    metadata_uri
                ).build_transaction({
                    "from": account.address,
                    "nonce": nonce,
                    "chainId": self.chain_id,
                    "gas": 300000,
                    "maxFeePerGas": self.w3.to_wei("30", "gwei"),
                    "maxPriorityFeePerGas": self.w3.to_wei("2", "gwei")
                })

                signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
                tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
                receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

                if receipt.status != 1:
                    raise RuntimeError("Transaction reverted on-chain.")

                tx_hash_hex = receipt.transactionHash.hex()
                block_number = receipt.blockNumber
                submitter = account.address
                registered_at = datetime.now(timezone.utc).isoformat()
            except Exception as e:
                logger.error(f"Failed to submit on-chain tx: {e}")
                raise
        else:
            # Fallback simulator for testnet testing without spending gas
            if report_id_hex in self._local_registry:
                raise ValueError(f"Report {report_id_hex} is already registered.")

            tx_hash_hex = f"0xsimulated_{report_hash_hex[2:18]}_{report_id_hex[2:18]}"
            block_number = 1000 + len(self._local_registry)
            submitter = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
            registered_at = datetime.now(timezone.utc).isoformat()

        record = {
            "report_id": report_id_hex,
            "report_hash": report_hash_hex,
            "data_hash": data_hash_hex,
            "model_version": model_version,
            "metadata_uri": metadata_uri,
            "transaction_hash": tx_hash_hex,
            "block_number": block_number,
            "registered_at": registered_at,
            "submitter": submitter,
            "network": "Sepolia Testnet (Simulated / Local)" if not self.contract else "Sepolia Testnet"
        }

        self._local_registry[report_id_hex] = record
        return record

    def get_registered_record(self, report_id: str) -> Optional[Dict[str, Any]]:
        """Reads on-chain record or local simulator registry."""
        if self.simulate_rpc_failure:
            raise ConnectionError("RPC provider unreachable")

        # Try live contract first
        if self.contract and self.w3 and self.w3.is_connected():
            try:
                report_id_bytes = bytes.fromhex(report_id[2:] if report_id.startswith("0x") else report_id)
                rec = self.contract.functions.getReport(report_id_bytes).call()
                # rec is tuple (reportId, dataHash, reportHash, modelVersion, metadataUri, registeredAt, submitter)
                return {
                    "report_id": f"0x{rec[0].hex()}",
                    "data_hash": f"0x{rec[1].hex()}",
                    "report_hash": f"0x{rec[2].hex()}",
                    "model_version": rec[3],
                    "metadata_uri": rec[4],
                    "registered_at": rec[5],
                    "submitter": rec[6]
                }
            except Exception as e:
                logger.warning(f"Contract getReport failed or not found: {e}")

        # Fallback to local simulator
        return self._local_registry.get(report_id)

    def verify_report(self, report: Dict[str, Any], report_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Verifies report against on-chain registration.
        Returns one of: VERIFIED, MISMATCH, NOT_FOUND, UNAVAILABLE.
        """
        if self.simulate_rpc_failure:
            return {
                "status": ProvenanceVerificationState.UNAVAILABLE,
                "reason": "Blockchain RPC is unreachable or disconnected.",
                "computed_hash": None,
                "onchain_hash": None,
                "verified": False
            }

        # Calculate canonical hash from provided report
        computed_hash = compute_report_hash(report)
        rep_id = report_id or generate_deterministic_report_id(
            report["location_id"], report["as_of"], report["model_version"]
        )

        try:
            record = self.get_registered_record(rep_id)
        except ConnectionError as ce:
            return {
                "status": ProvenanceVerificationState.UNAVAILABLE,
                "reason": f"RPC outage: {str(ce)}",
                "computed_hash": computed_hash,
                "onchain_hash": None,
                "verified": False
            }
        except Exception as e:
            return {
                "status": ProvenanceVerificationState.UNAVAILABLE,
                "reason": f"Dependency error: {str(e)}",
                "computed_hash": computed_hash,
                "onchain_hash": None,
                "verified": False
            }

        if not record:
            return {
                "status": ProvenanceVerificationState.NOT_FOUND,
                "reason": f"No on-chain commitment found for report ID {rep_id}.",
                "computed_hash": computed_hash,
                "onchain_hash": None,
                "verified": False,
                "report_id": rep_id
            }

        onchain_hash = record["report_hash"]
        if computed_hash.lower() == onchain_hash.lower():
            return {
                "status": ProvenanceVerificationState.VERIFIED,
                "reason": "Report content matches the on-chain cryptographic commitment exactly.",
                "computed_hash": computed_hash,
                "onchain_hash": onchain_hash,
                "verified": True,
                "report_id": rep_id,
                "record": record
            }
        else:
            return {
                "status": ProvenanceVerificationState.MISMATCH,
                "reason": "Report content has been altered or tampered with! Computed hash does not match stored commitment.",
                "computed_hash": computed_hash,
                "onchain_hash": onchain_hash,
                "verified": False,
                "report_id": rep_id,
                "record": record
            }
