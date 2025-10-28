const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Private Rental Matching - Deployment Script");
  console.log("========================================\n");

  // Get deployment information
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("📋 Deployment Information:");
  console.log("------------------------------------------");
  console.log(`Network Name: ${network.name}`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Deployer Address: ${deployer.address}`);
  console.log(`Deployer Balance: ${ethers.formatEther(balance)} ETH`);
  console.log("------------------------------------------\n");

  // Check balance
  if (balance === 0n) {
    throw new Error("❌ Insufficient balance. Please fund the deployer account.");
  }

  // Get Gateway configuration from environment
  const numPausers = parseInt(process.env.NUM_PAUSERS || "4");
  const pauserAddresses = [];

  console.log("🔐 Gateway Configuration:");
  console.log("------------------------------------------");
  console.log(`Number of Pausers: ${numPausers}`);

  for (let i = 0; i < numPausers; i++) {
    const pauserKey = `PAUSER_ADDRESS_${i}`;
    const pauserAddress = process.env[pauserKey] || ethers.ZeroAddress;
    pauserAddresses.push(pauserAddress);
    console.log(`Pauser ${i}: ${pauserAddress}`);
  }
  console.log("------------------------------------------\n");

  // Deploy the contract
  console.log("🚀 Deploying PrivateRentalMatching contract...\n");

  const PrivateRentalMatching = await ethers.getContractFactory("PrivateRentalMatching");

  console.log("⏳ Waiting for deployment transaction...");
  const contract = await PrivateRentalMatching.deploy(numPausers, pauserAddresses);

  console.log("⏳ Waiting for confirmation...");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("\n✅ Contract Deployed Successfully!");
  console.log("==========================================");
  console.log(`Contract Address: ${contractAddress}`);
  console.log("==========================================\n");

  // Get deployment transaction details
  const deploymentTx = contract.deploymentTransaction();
  if (deploymentTx) {
    console.log("📝 Deployment Transaction Details:");
    console.log("------------------------------------------");
    console.log(`Transaction Hash: ${deploymentTx.hash}`);
    console.log(`Block Number: ${deploymentTx.blockNumber}`);
    console.log(`Gas Used: ${deploymentTx.gasLimit.toString()}`);
    console.log("------------------------------------------\n");
  }

  // Wait for additional confirmations
  console.log("⏳ Waiting for 5 block confirmations...");
  await contract.deploymentTransaction()?.wait(5);
  console.log("✅ Confirmed!\n");

  // Verify contract state
  console.log("🔍 Verifying Contract State:");
  console.log("------------------------------------------");

  try {
    const owner = await contract.owner();
    console.log(`Contract Owner: ${owner}`);
    console.log(`Owner Matches Deployer: ${owner === deployer.address}`);
  } catch (error) {
    console.log("⚠️  Could not verify owner (this is normal for FHE contracts)");
  }

  console.log("------------------------------------------\n");

  // Save deployment information
  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: Number(network.chainId),
    },
    contract: {
      name: "PrivateRentalMatching",
      address: contractAddress,
      deployer: deployer.address,
      deploymentTxHash: deploymentTx?.hash || "",
      blockNumber: deploymentTx?.blockNumber || 0,
    },
    gateway: {
      numPausers: numPausers,
      pauserAddresses: pauserAddresses,
    },
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFilePath = path.join(
    deploymentsDir,
    `deployment-${network.name}-${Date.now()}.json`
  );

  fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment information saved to: ${deploymentFilePath}\n`);

  // Update latest deployment reference
  const latestFilePath = path.join(deploymentsDir, `latest-${network.name}.json`);
  fs.writeFileSync(latestFilePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Latest deployment updated: ${latestFilePath}\n`);

  // Generate environment variable updates
  console.log("📋 Environment Variables to Update:");
  console.log("==========================================");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("==========================================\n");

  // Display Etherscan link
  if (network.chainId === 11155111n) {
    console.log("🔗 View on Etherscan:");
    console.log(`https://sepolia.etherscan.io/address/${contractAddress}\n`);
  } else if (network.chainId === 1n) {
    console.log("🔗 View on Etherscan:");
    console.log(`https://etherscan.io/address/${contractAddress}\n`);
  }

  console.log("========================================");
  console.log("✅ Deployment Complete!");
  console.log("========================================\n");

  console.log("📝 Next Steps:");
  console.log("1. Update .env file with the contract address");
  console.log("2. Verify the contract on Etherscan: npm run verify");
  console.log("3. Test contract interaction: npm run interact");
  console.log("4. Run simulation tests: npm run simulate\n");

  return contractAddress;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Failed:");
    console.error(error);
    process.exit(1);
  });
