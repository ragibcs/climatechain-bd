# Smart Contract Architecture: ClimateProvenance.sol

## 1. Overview
The `ClimateProvenance` smart contract serves as an immutable, tamper-evident registry for climate data observations and risk prediction reports generated for the Sylhet / Surma River Basin in Bangladesh.

- **Solidity Version:** `^0.8.24`
- **Standard:** EVM Compatible (deployed targeting Sepolia testnet)
- **Primary Design Principle:** Off-chain computations and large observation batches remain off-chain; only cryptographic domain-separated commitments (`bytes32` hashes) and provenance metadata are registered on-chain.

---

## 2. Data Structures

```solidity
struct ReportRecord {
    bytes32 reportId;       // Deterministic unique hash of (location_id, as_of, model_version)
    bytes32 dataHash;       // SHA-256 commitment of the underlying observation snapshot
    bytes32 reportHash;     // SHA-256 commitment of canonical report fields
    string modelVersion;    // e.g. "rainfall-indicator-v1"
    string metadataUri;     // IPFS or HTTP reference to data manifest
    uint256 registeredAt;   // Block timestamp of registration
    address submitter;      // Address that broadcasted the registration transaction
}
```

---

## 3. Core Contract Functions

### `registerReport`
```solidity
function registerReport(
    bytes32 reportId,
    bytes32 dataHash,
    bytes32 reportHash,
    string calldata modelVersion,
    string calldata metadataUri
) external;
```
- **Access:** Permissionless for the hackathon MVP.
- **Validations:**
  - `reportId != bytes32(0)` (Reverts with `ZeroReportId()`)
  - `dataHash != bytes32(0)` (Reverts with `ZeroDataHash()`)
  - `reportHash != bytes32(0)` (Reverts with `ZeroReportHash()`)
  - `bytes(modelVersion).length > 0` (Reverts with `EmptyModelVersion()`)
  - Duplicate check: verifies `registeredAt == 0` (Reverts with `ReportAlreadyRegistered(reportId)`)
- **Event:** Emits `ReportRegistered(reportId, reportHash, dataHash, msg.sender, block.timestamp, modelVersion, metadataUri)`

### `getReport`
```solidity
function getReport(bytes32 reportId) external view returns (ReportRecord memory);
```
- Retrieves stored provenance record. Reverts with `ReportNotFound(reportId)` if unregistered.

### `verifyReport`
```solidity
function verifyReport(
    bytes32 reportId,
    bytes32 computedReportHash
) external view returns (bool isRegistered, bool isMatch);
```
- Performs constant-gas on-chain verification comparison between the stored `reportHash` and a client-provided `computedReportHash`.

---

## 4. Verification State Machine

The client and API map on-chain responses to 5 definitive states:

1. **`VERIFIED`**: Report retrieved, canonicalized, and local hash strictly equals on-chain commitment.
2. **`MISMATCH`**: Local hash differs from on-chain commitment (tampering / modification detected).
3. **`NOT_FOUND`**: Report ID does not exist in contract storage.
4. **`UNAVAILABLE`**: EVM RPC node is offline, network timed out, or connection failed. (Never reported as `MISMATCH`).
5. **`PENDING`**: Transaction submitted to mempool, waiting for block inclusion receipt.

---

## 5. Security & Gas Considerations
- Uses custom errors instead of verbose revert strings to minimize bytecode and deployment gas.
- Optimizer runs: 200.
- All unit tests verified in Hardhat test suite (10/10 passing).
