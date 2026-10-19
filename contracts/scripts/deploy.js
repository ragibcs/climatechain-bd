const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log(`Deploying ClimateProvenance to network: ${network.name}...`);
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);

  const ClimateProvenance = await ethers.getContractFactory("ClimateProvenance");
  const contract = await ClimateProvenance.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`ClimateProvenance successfully deployed to: ${contractAddress}`);

  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: network.name,
    chainId: network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
  };

  const outPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(outPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment metadata written to: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
