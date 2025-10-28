const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Etherscan Contract Verification");
  console.log("========================================\n");

  // Get network information
  const network = await hre.ethers.provider.getNetwork();
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.chainId}\n`);

  // Try to load latest deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const latestFilePath = path.join(deploymentsDir, `latest-${network.name}.json`);

  let contractAddress;
  let constructorArgs;

  if (fs.existsSync(latestFilePath)) {
    console.log("📂 Loading deployment information...\n");
    const deploymentInfo = JSON.parse(fs.readFileSync(latestFilePath, "utf8"));

    contractAddress = deploymentInfo.contract.address;
    constructorArgs = [
      deploymentInfo.gateway.numPausers,
      deploymentInfo.gateway.pauserAddresses,
    ];

    console.log("📋 Deployment Details:");
    console.log("------------------------------------------");
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Deployer: ${deploymentInfo.contract.deployer}`);
    console.log(`Deployment Time: ${deploymentInfo.timestamp}`);
    console.log("------------------------------------------\n");
  } else {
    // Fallback to environment variables
    console.log("⚠️  No deployment file found. Using environment variables...\n");

    contractAddress = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    if (!contractAddress) {
      throw new Error(
        "❌ Contract address not found. Please provide CONTRACT_ADDRESS in .env or deploy first."
      );
    }

    const numPausers = parseInt(process.env.NUM_PAUSERS || "4");
    const pauserAddresses = [];

    for (let i = 0; i < numPausers; i++) {
      const pauserKey = `PAUSER_ADDRESS_${i}`;
      const pauserAddress = process.env[pauserKey] || hre.ethers.ZeroAddress;
      pauserAddresses.push(pauserAddress);
    }

    constructorArgs = [numPausers, pauserAddresses];

    console.log("📋 Verification Details:");
    console.log("------------------------------------------");
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Number of Pausers: ${numPausers}`);
    console.log("------------------------------------------\n");
  }

  // Check if Etherscan API key is configured
  if (!process.env.ETHERSCAN_API_KEY) {
    console.log("⚠️  Warning: ETHERSCAN_API_KEY not found in .env file");
    console.log("Please add your Etherscan API key to proceed with verification.\n");
    return;
  }

  console.log("🔍 Starting contract verification...\n");

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArgs,
      contract: "contracts/PrivateRentalMatching.sol:PrivateRentalMatching",
    });

    console.log("\n✅ Contract Verified Successfully!");
    console.log("==========================================\n");

    // Display Etherscan link
    if (network.chainId === 11155111n) {
      console.log("🔗 View Verified Contract:");
      console.log(`https://sepolia.etherscan.io/address/${contractAddress}#code\n`);
    } else if (network.chainId === 1n) {
      console.log("🔗 View Verified Contract:");
      console.log(`https://etherscan.io/address/${contractAddress}#code\n`);
    }

    // Save verification info
    if (fs.existsSync(latestFilePath)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(latestFilePath, "utf8"));
      deploymentInfo.verified = true;
      deploymentInfo.verificationTime = new Date().toISOString();
      fs.writeFileSync(latestFilePath, JSON.stringify(deploymentInfo, null, 2));
      console.log("💾 Verification status saved to deployment file\n");
    }
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("\n✅ Contract Already Verified!");
      console.log("==========================================\n");

      // Display Etherscan link
      if (network.chainId === 11155111n) {
        console.log("🔗 View Verified Contract:");
        console.log(`https://sepolia.etherscan.io/address/${contractAddress}#code\n`);
      } else if (network.chainId === 1n) {
        console.log("🔗 View Verified Contract:");
        console.log(`https://etherscan.io/address/${contractAddress}#code\n`);
      }
    } else {
      throw error;
    }
  }

  console.log("========================================");
  console.log("✅ Verification Complete!");
  console.log("========================================\n");
}

// Execute verification
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification Failed:");
    console.error(error);
    process.exit(1);
  });
