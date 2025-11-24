import { ethers } from "hardhat";

/**
 * Enhanced Private Rental Matching Deployment Script
 *
 * Deploys the enhanced contract with:
 * - Gateway callback pattern
 * - Refund mechanisms
 * - Timeout protection
 * - Security features
 */
async function main() {
  console.log("\n🚀 Starting Enhanced Private Rental Matching Deployment...\n");

  // Get deployment account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log("📋 Deployment Configuration:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Deployer Address: ${deployerAddress}`);
  console.log(`Account Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployerAddress))} ETH`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log("");

  // Configuration Parameters
  const PAUSER_ADDRESSES = [
    deployerAddress, // Deployer as default pauser
    // Add additional pauser addresses here if needed
  ];

  const KMS_GENERATION = 1; // Initial KMS generation

  console.log("⚙️  Contract Parameters:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Pauser Addresses: ${PAUSER_ADDRESSES.join(", ")}`);
  console.log(`KMS Generation: ${KMS_GENERATION}`);
  console.log("");

  // Deploy Contract
  console.log("📦 Deploying PrivateRentalMatchingEnhanced...");

  const PrivateRentalMatchingEnhancedFactory = await ethers.getContractFactory(
    "PrivateRentalMatchingEnhanced"
  );

  const contract = await PrivateRentalMatchingEnhancedFactory.deploy(
    PAUSER_ADDRESSES,
    KMS_GENERATION
  );

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log(`Contract Address: ${contractAddress}`);
  console.log("");

  // Verify deployment
  console.log("🔍 Verifying Deployment...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const owner = await contract.owner();
  const kmsGeneration = await contract.kmsGeneration();
  const isPaused = await contract.isPaused();
  const stats = await contract.getPlatformStats();

  console.log(`Owner: ${owner}`);
  console.log(`KMS Generation: ${kmsGeneration}`);
  console.log(`Is Paused: ${isPaused}`);
  console.log(`Total Listings: ${stats.totalListings}`);
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Total Matches: ${stats.totalMatches}`);
  console.log("");

  // Verify pausers
  console.log("👮 Verifying Pausers:");
  for (const pauserAddr of PAUSER_ADDRESSES) {
    const isPauser = await contract.isPauserAddress(pauserAddr);
    console.log(`  ${pauserAddr}: ${isPauser ? "✓ Pauser" : "✗ Not a pauser"}`);
  }
  console.log("");

  // Display important constants
  console.log("📊 Contract Constants:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Decryption Timeout: ${await contract.DECRYPTION_TIMEOUT()} seconds (${await contract.DECRYPTION_TIMEOUT() / 3600} hour)`);
  console.log(`Match Timeout: ${await contract.MATCH_TIMEOUT()} seconds (${await contract.MATCH_TIMEOUT() / 86400} days)`);
  console.log(`Min Price: ${await contract.MIN_PRICE()}`);
  console.log(`Max Price: ${await contract.MAX_PRICE()}`);
  console.log(`Price Obfuscation Range: ${await contract.PRICE_OBFUSCATION_RANGE()}`);
  console.log(`Rate Limit Cooldown: ${await contract.RATE_LIMIT_COOLDOWN()} seconds`);
  console.log(`Gas Estimate (per match): ${await contract.getGasEstimate()} gas`);
  console.log("");

  // Display security features
  console.log("🔒 Security Features Enabled:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ✓ Gateway Callback Pattern");
  console.log("  ✓ Refund Mechanism");
  console.log("  ✓ Timeout Protection");
  console.log("  ✓ Division Protection (Random Multipliers)");
  console.log("  ✓ Price Obfuscation");
  console.log("  ✓ Input Validation");
  console.log("  ✓ Access Control");
  console.log("  ✓ Overflow Protection");
  console.log("  ✓ Rate Limiting");
  console.log("  ✓ Emergency Pause");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    contractAddress: contractAddress,
    deployer: deployerAddress,
    pausers: PAUSER_ADDRESSES,
    kmsGeneration: KMS_GENERATION,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    constants: {
      decryptionTimeout: Number(await contract.DECRYPTION_TIMEOUT()),
      matchTimeout: Number(await contract.MATCH_TIMEOUT()),
      minPrice: Number(await contract.MIN_PRICE()),
      maxPrice: Number(await contract.MAX_PRICE()),
      priceObfuscationRange: Number(await contract.PRICE_OBFUSCATION_RANGE()),
      rateLimitCooldown: Number(await contract.RATE_LIMIT_COOLDOWN()),
      gasEstimate: Number(await contract.getGasEstimate()),
    },
  };

  console.log("💾 Deployment Information (save this):");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("");

  // Post-deployment instructions
  console.log("📝 Next Steps:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. Verify contract on block explorer:");
  console.log(`   npx hardhat verify --network <network> ${contractAddress} '${JSON.stringify(PAUSER_ADDRESSES)}' ${KMS_GENERATION}`);
  console.log("");
  console.log("2. Configure Gateway Oracle address (if needed):");
  console.log(`   Update the processMatchDecryptionCallback modifier with oracle address`);
  console.log("");
  console.log("3. Add additional pausers (optional):");
  console.log(`   contract.addPauser(address)`);
  console.log("");
  console.log("4. Update frontend configuration with contract address:");
  console.log(`   VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("");
  console.log("5. Test the deployment:");
  console.log(`   npx hardhat test --network <network>`);
  console.log("");

  console.log("✨ Deployment Complete! ✨\n");

  return {
    contract,
    contractAddress,
    deploymentInfo,
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

export default main;
