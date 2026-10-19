const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ClimateProvenance Smart Contract", function () {
  let contract;
  let owner;
  let addr1;

  // Sample bytes32 test vectors matching Python canonical hashing
  const testReportId = ethers.keccak256(ethers.toUtf8Bytes("REPORT_001"));
  const testDataHash = ethers.keccak256(ethers.toUtf8Bytes("DATA_HASH_001"));
  const testReportHash = ethers.keccak256(ethers.toUtf8Bytes("REPORT_HASH_001"));
  const alteredReportHash = ethers.keccak256(ethers.toUtf8Bytes("ALTERED_REPORT_HASH_001"));
  const modelVersion = "rainfall-indicator-v1";
  const metadataUri = "ipfs://QmTestClimateSnapshotMetadata";

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ClimateProvenance");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  it("should deploy with initial totalReports of zero", async function () {
    expect(await contract.totalReports()).to.equal(0);
  });

  it("should successfully register a valid report and emit ReportRegistered event", async function () {
    const tx = await contract.registerReport(
      testReportId,
      testDataHash,
      testReportHash,
      modelVersion,
      metadataUri
    );

    await expect(tx)
      .to.emit(contract, "ReportRegistered")
      .withArgs(
        testReportId,
        testReportHash,
        testDataHash,
        owner.address,
        await ethers.provider.getBlock("latest").then((b) => b.timestamp),
        modelVersion,
        metadataUri
      );

    expect(await contract.totalReports()).to.equal(1);
    expect(await contract.isReportRegistered(testReportId)).to.equal(true);

    const record = await contract.getReport(testReportId);
    expect(record.reportId).to.equal(testReportId);
    expect(record.dataHash).to.equal(testDataHash);
    expect(record.reportHash).to.equal(testReportHash);
    expect(record.modelVersion).to.equal(modelVersion);
    expect(record.metadataUri).to.equal(metadataUri);
    expect(record.submitter).to.equal(owner.address);
  });

  it("should reject registration with zero reportId", async function () {
    await expect(
      contract.registerReport(
        ethers.ZeroHash,
        testDataHash,
        testReportHash,
        modelVersion,
        metadataUri
      )
    ).to.be.revertedWithCustomError(contract, "ZeroReportId");
  });

  it("should reject registration with zero dataHash", async function () {
    await expect(
      contract.registerReport(
        testReportId,
        ethers.ZeroHash,
        testReportHash,
        modelVersion,
        metadataUri
      )
    ).to.be.revertedWithCustomError(contract, "ZeroDataHash");
  });

  it("should reject registration with zero reportHash", async function () {
    await expect(
      contract.registerReport(
        testReportId,
        testDataHash,
        ethers.ZeroHash,
        modelVersion,
        metadataUri
      )
    ).to.be.revertedWithCustomError(contract, "ZeroReportHash");
  });

  it("should reject registration with empty modelVersion", async function () {
    await expect(
      contract.registerReport(
        testReportId,
        testDataHash,
        testReportHash,
        "",
        metadataUri
      )
    ).to.be.revertedWithCustomError(contract, "EmptyModelVersion");
  });

  it("should reject duplicate registration with identical reportId", async function () {
    await contract.registerReport(
      testReportId,
      testDataHash,
      testReportHash,
      modelVersion,
      metadataUri
    );

    await expect(
      contract.registerReport(
        testReportId,
        testDataHash,
        testReportHash,
        modelVersion,
        metadataUri
      )
    ).to.be.revertedWithCustomError(contract, "ReportAlreadyRegistered");
  });

  it("should return false for unregistered report in verifyReport", async function () {
    const [isRegistered, isMatch] = await contract.verifyReport(
      testReportId,
      testReportHash
    );
    expect(isRegistered).to.equal(false);
    expect(isMatch).to.equal(false);
  });

  it("should verify matching hash and detect altered/tampered hash", async function () {
    await contract.registerReport(
      testReportId,
      testDataHash,
      testReportHash,
      modelVersion,
      metadataUri
    );

    // Exact match
    const [isReg1, isMatch1] = await contract.verifyReport(
      testReportId,
      testReportHash
    );
    expect(isReg1).to.equal(true);
    expect(isMatch1).to.equal(true);

    // Altered report hash (tamper detection)
    const [isReg2, isMatch2] = await contract.verifyReport(
      testReportId,
      alteredReportHash
    );
    expect(isReg2).to.equal(true);
    expect(isMatch2).to.equal(false);
  });

  it("should revert getReport when querying an unregistered report", async function () {
    await expect(
      contract.getReport(testReportId)
    ).to.be.revertedWithCustomError(contract, "ReportNotFound");
  });
});
