// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ClimateProvenance
 * @dev Cryptographic provenance registry for Sylhet climate observations and risk prediction reports.
 * Developed for IEEE ClimateChain Global Hackathon (ClimateChain BD).
 */
contract ClimateProvenance {
    struct ReportRecord {
        bytes32 reportId;
        bytes32 dataHash;
        bytes32 reportHash;
        string modelVersion;
        string metadataUri;
        uint256 registeredAt;
        address submitter;
    }

    // Mapping from unique deterministic reportId to registered ReportRecord
    mapping(bytes32 => ReportRecord) private _reports;

    // Array of all registered report IDs for enumerable auditing
    bytes32[] private _allReportIds;

    // Event emitted upon successful registration
    event ReportRegistered(
        bytes32 indexed reportId,
        bytes32 indexed reportHash,
        bytes32 dataHash,
        address indexed submitter,
        uint256 registeredAt,
        string modelVersion,
        string metadataUri
    );

    // Custom errors for gas efficiency and clear reverts
    error ZeroReportId();
    error ZeroDataHash();
    error ZeroReportHash();
    error EmptyModelVersion();
    error ReportAlreadyRegistered(bytes32 reportId);
    error ReportNotFound(bytes32 reportId);

    /**
     * @notice Registers a cryptographic commitment to a climate prediction report and its underlying data snapshot.
     * @param reportId Unique deterministic identifier for the report
     * @param dataHash Cryptographic hash (bytes32) of the validated input observations
     * @param reportHash Cryptographic hash (bytes32) of the canonical prediction report
     * @param modelVersion Identifier of the risk model or indicator formulation (e.g. "rainfall-indicator-v1")
     * @param metadataUri URI/reference pointing to source manifest or IPFS/HTTP metadata
     */
    function registerReport(
        bytes32 reportId,
        bytes32 dataHash,
        bytes32 reportHash,
        string calldata modelVersion,
        string calldata metadataUri
    ) external {
        if (reportId == bytes32(0)) revert ZeroReportId();
        if (dataHash == bytes32(0)) revert ZeroDataHash();
        if (reportHash == bytes32(0)) revert ZeroReportHash();
        if (bytes(modelVersion).length == 0) revert EmptyModelVersion();
        if (_reports[reportId].registeredAt != 0) revert ReportAlreadyRegistered(reportId);

        ReportRecord memory record = ReportRecord({
            reportId: reportId,
            dataHash: dataHash,
            reportHash: reportHash,
            modelVersion: modelVersion,
            metadataUri: metadataUri,
            registeredAt: block.timestamp,
            submitter: msg.sender
        });

        _reports[reportId] = record;
        _allReportIds.push(reportId);

        emit ReportRegistered(
            reportId,
            reportHash,
            dataHash,
            msg.sender,
            block.timestamp,
            modelVersion,
            metadataUri
        );
    }

    /**
     * @notice Retrieves the full on-chain provenance record for a given reportId.
     * @param reportId The report identifier to query
     */
    function getReport(bytes32 reportId) external view returns (ReportRecord memory) {
        ReportRecord memory rec = _reports[reportId];
        if (rec.registeredAt == 0) revert ReportNotFound(reportId);
        return rec;
    }

    /**
     * @notice Checks if a report ID has been registered.
     */
    function isReportRegistered(bytes32 reportId) external view returns (bool) {
        return _reports[reportId].registeredAt != 0;
    }

    /**
     * @notice Verifies whether a given computed report hash matches the registered on-chain commitment.
     * @param reportId The registered report identifier
     * @param computedReportHash The hash computed locally from the report payload to verify
     * @return isRegistered True if report exists on-chain
     * @return isMatch True if computed hash matches on-chain commitment exactly
     */
    function verifyReport(
        bytes32 reportId,
        bytes32 computedReportHash
    ) external view returns (bool isRegistered, bool isMatch) {
        ReportRecord memory rec = _reports[reportId];
        if (rec.registeredAt == 0) {
            return (false, false);
        }
        return (true, rec.reportHash == computedReportHash);
    }

    /**
     * @notice Total number of registered reports.
     */
    function totalReports() external view returns (uint256) {
        return _allReportIds.length;
    }

    /**
     * @notice Returns reportId at index for enumerable audit.
     */
    function getReportIdByIndex(uint256 index) external view returns (bytes32) {
        require(index < _allReportIds.length, "Index out of bounds");
        return _allReportIds[index];
    }
}
