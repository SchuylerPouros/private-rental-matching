const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("========================================");
  console.log("Contract Interaction Script");
  console.log("========================================\n");

  // Get signer
  const [signer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("📋 Connection Information:");
  console.log("------------------------------------------");
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.chainId}`);
  console.log(`Signer Address: ${signer.address}`);
  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log("------------------------------------------\n");

  // Load contract address
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const latestFilePath = path.join(deploymentsDir, `latest-${network.name}.json`);

  let contractAddress;

  if (fs.existsSync(latestFilePath)) {
    const deploymentInfo = JSON.parse(fs.readFileSync(latestFilePath, "utf8"));
    contractAddress = deploymentInfo.contract.address;
    console.log(`📂 Loaded contract address from deployment file`);
  } else {
    contractAddress = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    console.log(`📂 Loaded contract address from environment`);
  }

  if (!contractAddress) {
    throw new Error("❌ Contract address not found. Please deploy first or set CONTRACT_ADDRESS in .env");
  }

  console.log(`📍 Contract Address: ${contractAddress}\n`);

  // Connect to contract
  const PrivateRentalMatching = await ethers.getContractFactory("PrivateRentalMatching");
  const contract = PrivateRentalMatching.attach(contractAddress);

  console.log("🔗 Connected to PrivateRentalMatching contract\n");

  // Display menu
  console.log("========================================");
  console.log("Available Interactions:");
  console.log("========================================");
  console.log("1. Get Platform Statistics");
  console.log("2. Get User Listings");
  console.log("3. Get User Requests");
  console.log("4. Get Contract Owner");
  console.log("5. Check Listing Count");
  console.log("6. Check Request Count");
  console.log("7. Check Match Count");
  console.log("========================================\n");

  // Execute interactions
  try {
    // 1. Get Platform Statistics
    console.log("1️⃣  Fetching Platform Statistics...");
    console.log("------------------------------------------");
    try {
      const stats = await contract.getPlatformStats();
      console.log(`Total Listings: ${stats[0].toString()}`);
      console.log(`Total Requests: ${stats[1].toString()}`);
      console.log(`Total Matches: ${stats[2].toString()}`);
      console.log(`Confirmed Matches: ${stats[3].toString()}`);
    } catch (error) {
      console.log(`⚠️  Could not fetch stats: ${error.message}`);
    }
    console.log("------------------------------------------\n");

    // 2. Get User Listings
    console.log("2️⃣  Fetching User Listings...");
    console.log("------------------------------------------");
    try {
      const userListings = await contract.getUserListings(signer.address);
      console.log(`Number of Listings: ${userListings.length}`);
      if (userListings.length > 0) {
        userListings.forEach((listingId, index) => {
          console.log(`  ${index + 1}. Listing ID: ${listingId.toString()}`);
        });
      } else {
        console.log("No listings found for this address");
      }
    } catch (error) {
      console.log(`⚠️  Could not fetch listings: ${error.message}`);
    }
    console.log("------------------------------------------\n");

    // 3. Get User Requests
    console.log("3️⃣  Fetching User Requests...");
    console.log("------------------------------------------");
    try {
      const userRequests = await contract.getUserRequests(signer.address);
      console.log(`Number of Requests: ${userRequests.length}`);
      if (userRequests.length > 0) {
        userRequests.forEach((requestId, index) => {
          console.log(`  ${index + 1}. Request ID: ${requestId.toString()}`);
        });
      } else {
        console.log("No requests found for this address");
      }
    } catch (error) {
      console.log(`⚠️  Could not fetch requests: ${error.message}`);
    }
    console.log("------------------------------------------\n");

    // 4. Get Contract Owner
    console.log("4️⃣  Fetching Contract Owner...");
    console.log("------------------------------------------");
    try {
      const owner = await contract.owner();
      console.log(`Owner Address: ${owner}`);
      console.log(`Is Current Signer Owner: ${owner.toLowerCase() === signer.address.toLowerCase()}`);
    } catch (error) {
      console.log(`⚠️  Could not fetch owner: ${error.message}`);
    }
    console.log("------------------------------------------\n");

    // 5. Check Listing Counter
    console.log("5️⃣  Checking Listing Counter...");
    console.log("------------------------------------------");
    try {
      const listingCounter = await contract.listingCounter();
      console.log(`Next Listing ID: ${listingCounter.toString()}`);
      console.log(`Total Listings Created: ${(Number(listingCounter) - 1)}`);
    } catch (error) {
      console.log(`⚠️  Could not fetch listing counter: ${error.message}`);
    }
    console.log("------------------------------------------\n");

    // 6. Check Request Counter
    console.log("6️⃣  Checking Request Counter...");
    console.log("------------------------------------------");
    try {
      const requestCounter = await contract.requestCounter();
      console.log(`Next Request ID: ${requestCounter.toString()}`);
      console.log(`Total Requests Created: ${(Number(requestCounter) - 1)}`);
    } catch (error) {
      console.log(`⚠️  Could not fetch request counter: ${error.message}`);
    }
    console.log("------------------------------------------\n");

    // 7. Check Match Counter
    console.log("7️⃣  Checking Match Counter...");
    console.log("------------------------------------------");
    try {
      const matchCounter = await contract.matchCounter();
      console.log(`Next Match ID: ${matchCounter.toString()}`);
      console.log(`Total Matches Created: ${(Number(matchCounter) - 1)}`);
    } catch (error) {
      console.log(`⚠️  Could not fetch match counter: ${error.message}`);
    }
    console.log("------------------------------------------\n");

    // Additional Information
    console.log("========================================");
    console.log("📊 Contract Information Summary");
    console.log("========================================");
    console.log(`Contract: PrivateRentalMatching`);
    console.log(`Address: ${contractAddress}`);
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);

    if (network.chainId === 11155111n) {
      console.log(`\n🔗 View on Etherscan:`);
      console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
    }

    console.log("========================================\n");

  } catch (error) {
    console.error("❌ Error during interaction:");
    console.error(error);
    throw error;
  }

  console.log("✅ Interaction Complete!\n");

  // Usage Examples
  console.log("========================================");
  console.log("📝 Usage Examples");
  console.log("========================================");
  console.log("\nTo create a listing (requires FHE encryption):");
  console.log("Use the frontend application or write a custom script\n");

  console.log("To create a rental request (requires FHE encryption):");
  console.log("Use the frontend application or write a custom script\n");

  console.log("To check specific listing/request details:");
  console.log("Modify this script to query specific IDs\n");

  console.log("========================================\n");
}

// Execute interactions
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Interaction Failed:");
    console.error(error);
    process.exit(1);
  });
