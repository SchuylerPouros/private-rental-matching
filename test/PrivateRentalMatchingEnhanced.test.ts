import { expect } from "chai";
import { ethers } from "hardhat";
import { PrivateRentalMatchingEnhanced } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("PrivateRentalMatchingEnhanced - Complete Test Suite", function () {
  let contract: PrivateRentalMatchingEnhanced;
  let owner: HardhatEthersSigner;
  let landlord: HardhatEthersSigner;
  let tenant: HardhatEthersSigner;
  let pauser: HardhatEthersSigner;
  let oracle: HardhatEthersSigner;

  const DEPOSIT_AMOUNT = ethers.parseEther("0.01");
  const KMS_GENERATION = 1;

  beforeEach(async function () {
    [owner, landlord, tenant, pauser, oracle] = await ethers.getSigners();

    const PrivateRentalMatchingEnhancedFactory = await ethers.getContractFactory(
      "PrivateRentalMatchingEnhanced"
    );

    contract = await PrivateRentalMatchingEnhancedFactory.deploy(
      [pauser.address],
      KMS_GENERATION
    );

    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct KMS generation", async function () {
      expect(await contract.kmsGeneration()).to.equal(KMS_GENERATION);
    });

    it("Should not be paused initially", async function () {
      expect(await contract.isPaused()).to.equal(false);
    });

    it("Should add initial pauser", async function () {
      expect(await contract.isPauserAddress(pauser.address)).to.equal(true);
    });
  });

  describe("Security Features", function () {
    describe("Input Validation", function () {
      it("Should reject price below minimum", async function () {
        await expect(
          contract.connect(landlord).createListing(
            50, // Below MIN_PRICE (100)
            2,
            12345,
            1,
            { value: DEPOSIT_AMOUNT }
          )
        ).to.be.revertedWith("VALIDATION: Price too low");
      });

      it("Should reject price above maximum", async function () {
        await expect(
          contract.connect(landlord).createListing(
            2000000, // Above MAX_PRICE (1000000)
            2,
            12345,
            1,
            { value: DEPOSIT_AMOUNT }
          )
        ).to.be.revertedWith("VALIDATION: Price too high");
      });

      it("Should reject invalid bedroom count", async function () {
        await expect(
          contract.connect(landlord).createListing(
            1000,
            0, // Invalid: 0 bedrooms
            12345,
            1,
            { value: DEPOSIT_AMOUNT }
          )
        ).to.be.revertedWith("VALIDATION: Invalid bedroom count");

        await expect(
          contract.connect(landlord).createListing(
            1000,
            11, // Invalid: > 10 bedrooms
            12345,
            1,
            { value: DEPOSIT_AMOUNT }
          )
        ).to.be.revertedWith("VALIDATION: Invalid bedroom count");
      });

      it("Should reject invalid property type", async function () {
        await expect(
          contract.connect(landlord).createListing(
            1000,
            2,
            12345,
            0, // Invalid: type 0
            { value: DEPOSIT_AMOUNT }
          )
        ).to.be.revertedWith("VALIDATION: Invalid property type");

        await expect(
          contract.connect(landlord).createListing(
            1000,
            2,
            12345,
            4, // Invalid: type > 3
            { value: DEPOSIT_AMOUNT }
          )
        ).to.be.revertedWith("VALIDATION: Invalid property type");
      });

      it("Should reject insufficient deposit", async function () {
        await expect(
          contract.connect(landlord).createListing(
            1000,
            2,
            12345,
            1,
            { value: ethers.parseEther("0.005") } // Less than 0.01 ETH
          )
        ).to.be.revertedWith("VALIDATION: Insufficient deposit");
      });
    });

    describe("Access Control", function () {
      it("Should only allow owner to add pauser", async function () {
        await expect(
          contract.connect(landlord).addPauser(tenant.address)
        ).to.be.revertedWith("AUTH: Not authorized");

        await contract.connect(owner).addPauser(tenant.address);
        expect(await contract.isPauserAddress(tenant.address)).to.equal(true);
      });

      it("Should only allow owner to remove pauser", async function () {
        await expect(
          contract.connect(landlord).removePauser(pauser.address)
        ).to.be.revertedWith("AUTH: Not authorized");
      });

      it("Should only allow pausers to pause", async function () {
        await expect(
          contract.connect(landlord).pause()
        ).to.be.revertedWith("AUTH: Not a pauser");

        await contract.connect(pauser).pause();
        expect(await contract.isPaused()).to.equal(true);
      });

      it("Should only allow owner to unpause", async function () {
        await contract.connect(pauser).pause();

        await expect(
          contract.connect(pauser).unpause()
        ).to.be.revertedWith("AUTH: Not authorized");

        await contract.connect(owner).unpause();
        expect(await contract.isPaused()).to.equal(false);
      });
    });

    describe("Rate Limiting", function () {
      it("Should enforce rate limit cooldown", async function () {
        // First listing should succeed
        await contract.connect(landlord).createListing(
          1000,
          2,
          12345,
          1,
          { value: DEPOSIT_AMOUNT }
        );

        // Immediate second listing should fail
        await expect(
          contract.connect(landlord).createListing(
            1000,
            2,
            12345,
            1,
            { value: DEPOSIT_AMOUNT }
          )
        ).to.be.revertedWith("RATE_LIMIT: Too many requests");

        // Wait for cooldown (in production, wait 5 seconds)
        // In tests, we can increase block time
        await ethers.provider.send("evm_increaseTime", [6]);
        await ethers.provider.send("evm_mine", []);

        // Should succeed after cooldown
        await contract.connect(landlord).createListing(
          1000,
          2,
          12345,
          1,
          { value: DEPOSIT_AMOUNT }
        );
      });
    });

    describe("Pause Mechanism", function () {
      it("Should prevent operations when paused", async function () {
        await contract.connect(pauser).pause();

        await expect(
          contract.connect(landlord).createListing(
            1000,
            2,
            12345,
            1,
            { value: DEPOSIT_AMOUNT }
          )
        ).to.be.revertedWith("PAUSED: Contract is paused");

        await expect(
          contract.connect(tenant).createRequest(
            1200,
            2,
            12345,
            1,
            { value: DEPOSIT_AMOUNT }
          )
        ).to.be.revertedWith("PAUSED: Contract is paused");
      });

      it("Should allow operations after unpause", async function () {
        await contract.connect(pauser).pause();
        await contract.connect(owner).unpause();

        await expect(
          contract.connect(landlord).createListing(
            1000,
            2,
            12345,
            1,
            { value: DEPOSIT_AMOUNT }
          )
        ).to.not.be.reverted;
      });
    });
  });

  describe("Gateway Callback Pattern", function () {
    let listingId: bigint;
    let requestId: bigint;
    let matchId: bigint;

    beforeEach(async function () {
      // Create listing
      await contract.connect(landlord).createListing(
        1000,
        2,
        12345,
        1,
        { value: DEPOSIT_AMOUNT }
      );
      listingId = 1n;

      // Wait for rate limit
      await ethers.provider.send("evm_increaseTime", [6]);
      await ethers.provider.send("evm_mine", []);

      // Create request
      await contract.connect(tenant).createRequest(
        1200,
        2,
        12345,
        1,
        { value: DEPOSIT_AMOUNT }
      );
      requestId = 1n;

      // Wait for rate limit
      await ethers.provider.send("evm_increaseTime", [6]);
      await ethers.provider.send("evm_mine", []);
    });

    it("Should create match and request decryption", async function () {
      const tx = await contract.connect(landlord).createMatchWithGatewayCallback(
        listingId,
        requestId
      );

      const receipt = await tx.wait();
      matchId = 1n;

      // Check match was created
      const matchDetails = await contract.getMatchDetails(matchId);
      expect(matchDetails.landlord).to.equal(landlord.address);
      expect(matchDetails.tenant).to.equal(tenant.address);
      expect(matchDetails.status).to.equal(1); // DecryptionRequested

      // Check decryption request was created
      expect(receipt).to.emit(contract, "DecryptionRequested");
    });

    it("Should process successful decryption callback", async function () {
      await contract.connect(landlord).createMatchWithGatewayCallback(
        listingId,
        requestId
      );
      matchId = 1n;

      const decryptRequestId = 1n;

      // Simulate oracle callback with successful match
      await contract.connect(oracle).processMatchDecryptionCallback(
        decryptRequestId,
        true, // Price matches
        true, // Bedrooms match
        true  // Success
      );

      const matchDetails = await contract.getMatchDetails(matchId);
      expect(matchDetails.status).to.equal(2); // DecryptionCompleted
    });

    it("Should issue refund on failed decryption", async function () {
      await contract.connect(landlord).createMatchWithGatewayCallback(
        listingId,
        requestId
      );
      matchId = 1n;

      const decryptRequestId = 1n;

      const landlordBalanceBefore = await ethers.provider.getBalance(landlord.address);
      const tenantBalanceBefore = await ethers.provider.getBalance(tenant.address);

      // Simulate oracle callback with failed match
      await contract.connect(oracle).processMatchDecryptionCallback(
        decryptRequestId,
        false, // Price doesn't match
        true,  // Bedrooms match
        true   // Success (but match criteria not met)
      );

      const matchDetails = await contract.getMatchDetails(matchId);
      expect(matchDetails.status).to.equal(5); // RefundIssued

      // Check refunds were issued
      const landlordBalanceAfter = await ethers.provider.getBalance(landlord.address);
      const tenantBalanceAfter = await ethers.provider.getBalance(tenant.address);

      expect(landlordBalanceAfter).to.be.gt(landlordBalanceBefore);
      expect(tenantBalanceAfter).to.be.gt(tenantBalanceBefore);
    });
  });

  describe("Timeout Protection", function () {
    let listingId: bigint;
    let requestId: bigint;
    let matchId: bigint;

    beforeEach(async function () {
      // Create listing and request
      await contract.connect(landlord).createListing(
        1000,
        2,
        12345,
        1,
        { value: DEPOSIT_AMOUNT }
      );
      listingId = 1n;

      await ethers.provider.send("evm_increaseTime", [6]);
      await ethers.provider.send("evm_mine", []);

      await contract.connect(tenant).createRequest(
        1200,
        2,
        12345,
        1,
        { value: DEPOSIT_AMOUNT }
      );
      requestId = 1n;

      await ethers.provider.send("evm_increaseTime", [6]);
      await ethers.provider.send("evm_mine", []);

      await contract.connect(landlord).createMatchWithGatewayCallback(
        listingId,
        requestId
      );
      matchId = 1n;
    });

    it("Should prevent timeout claim before deadline", async function () {
      const decryptRequestId = 1n;

      await expect(
        contract.connect(tenant).claimTimeoutRefund(decryptRequestId)
      ).to.be.revertedWith("VALIDATION: Not yet timed out");
    });

    it("Should allow timeout claim after deadline", async function () {
      const decryptRequestId = 1n;

      // Fast forward past timeout (1 hour + 1 second)
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);

      const landlordBalanceBefore = await ethers.provider.getBalance(landlord.address);
      const tenantBalanceBefore = await ethers.provider.getBalance(tenant.address);

      await contract.connect(tenant).claimTimeoutRefund(decryptRequestId);

      // Check match status
      const matchDetails = await contract.getMatchDetails(matchId);
      expect(matchDetails.status).to.equal(4); // Expired

      // Check refunds were issued
      const landlordBalanceAfter = await ethers.provider.getBalance(landlord.address);
      const tenantBalanceAfter = await ethers.provider.getBalance(tenant.address);

      expect(landlordBalanceAfter).to.be.gt(landlordBalanceBefore);
      expect(tenantBalanceAfter).to.be.gt(tenantBalanceBefore);
    });

    it("Should prevent double timeout claim", async function () {
      const decryptRequestId = 1n;

      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);

      await contract.connect(tenant).claimTimeoutRefund(decryptRequestId);

      await expect(
        contract.connect(tenant).claimTimeoutRefund(decryptRequestId)
      ).to.be.revertedWith("VALIDATION: Already timed out");
    });
  });

  describe("Refund Mechanism", function () {
    it("Should refund deposit when deactivating listing", async function () {
      await contract.connect(landlord).createListing(
        1000,
        2,
        12345,
        1,
        { value: DEPOSIT_AMOUNT }
      );

      const balanceBefore = await ethers.provider.getBalance(landlord.address);

      const tx = await contract.connect(landlord).deactivateListing(1);
      const receipt = await tx.wait();

      // Calculate gas cost
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(landlord.address);

      // Balance should increase by deposit minus gas
      expect(balanceAfter).to.equal(balanceBefore + DEPOSIT_AMOUNT - gasCost);
    });

    it("Should refund deposit when deactivating request", async function () {
      await contract.connect(tenant).createRequest(
        1200,
        2,
        12345,
        1,
        { value: DEPOSIT_AMOUNT }
      );

      const balanceBefore = await ethers.provider.getBalance(tenant.address);

      const tx = await contract.connect(tenant).deactivateRequest(1);
      const receipt = await tx.wait();

      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(tenant.address);

      expect(balanceAfter).to.equal(balanceBefore + DEPOSIT_AMOUNT - gasCost);
    });

    it("Should prevent deactivating matched listing", async function () {
      await contract.connect(landlord).createListing(
        1000,
        2,
        12345,
        1,
        { value: DEPOSIT_AMOUNT }
      );

      await ethers.provider.send("evm_increaseTime", [6]);
      await ethers.provider.send("evm_mine", []);

      await contract.connect(tenant).createRequest(
        1200,
        2,
        12345,
        1,
        { value: DEPOSIT_AMOUNT }
      );

      await ethers.provider.send("evm_increaseTime", [6]);
      await ethers.provider.send("evm_mine", []);

      await contract.connect(landlord).createMatchWithGatewayCallback(1, 1);

      await expect(
        contract.connect(landlord).deactivateListing(1)
      ).to.be.revertedWith("VALIDATION: Cannot deactivate matched listing");
    });
  });

  describe("Match Confirmation", function () {
    let listingId: bigint;
    let requestId: bigint;
    let matchId: bigint;

    beforeEach(async function () {
      await contract.connect(landlord).createListing(
        1000,
        2,
        12345,
        1,
        { value: DEPOSIT_AMOUNT }
      );
      listingId = 1n;

      await ethers.provider.send("evm_increaseTime", [6]);
      await ethers.provider.send("evm_mine", []);

      await contract.connect(tenant).createRequest(
        1200,
        2,
        12345,
        1,
        { value: DEPOSIT_AMOUNT }
      );
      requestId = 1n;

      await ethers.provider.send("evm_increaseTime", [6]);
      await ethers.provider.send("evm_mine", []);

      await contract.connect(landlord).createMatchWithGatewayCallback(
        listingId,
        requestId
      );
      matchId = 1n;

      // Simulate successful decryption
      await contract.connect(oracle).processMatchDecryptionCallback(
        1n,
        true,
        true,
        true
      );
    });

    it("Should allow landlord to confirm match", async function () {
      await contract.connect(landlord).confirmMatch(matchId);

      const matchDetails = await contract.getMatchDetails(matchId);
      expect(matchDetails[6]).to.equal(true); // landlordConfirmed
    });

    it("Should allow tenant to confirm match", async function () {
      await contract.connect(tenant).confirmMatch(matchId);

      const matchDetails = await contract.getMatchDetails(matchId);
      expect(matchDetails[7]).to.equal(true); // tenantConfirmed
    });

    it("Should finalize match when both confirm", async function () {
      const landlordBalanceBefore = await ethers.provider.getBalance(landlord.address);
      const tenantBalanceBefore = await ethers.provider.getBalance(tenant.address);

      await contract.connect(landlord).confirmMatch(matchId);
      await contract.connect(tenant).confirmMatch(matchId);

      const matchDetails = await contract.getMatchDetails(matchId);
      expect(matchDetails.isConfirmed).to.equal(true);
      expect(matchDetails.status).to.equal(3); // ConfirmedByBoth

      // Check deposits were returned
      const landlordBalanceAfter = await ethers.provider.getBalance(landlord.address);
      const tenantBalanceAfter = await ethers.provider.getBalance(tenant.address);

      expect(landlordBalanceAfter).to.be.gt(landlordBalanceBefore);
      expect(tenantBalanceAfter).to.be.gt(tenantBalanceBefore);
    });

    it("Should prevent double confirmation by same party", async function () {
      await contract.connect(landlord).confirmMatch(matchId);

      await expect(
        contract.connect(landlord).confirmMatch(matchId)
      ).to.be.revertedWith("VALIDATION: Already confirmed by landlord");
    });

    it("Should prevent unauthorized confirmation", async function () {
      const [, , , , , unauthorized] = await ethers.getSigners();

      await expect(
        contract.connect(unauthorized).confirmMatch(matchId)
      ).to.be.revertedWith("AUTH: Not authorized");
    });
  });

  describe("View Functions", function () {
    it("Should return platform statistics", async function () {
      const stats = await contract.getPlatformStats();

      expect(stats.totalListings).to.equal(0);
      expect(stats.totalRequests).to.equal(0);
      expect(stats.totalMatches).to.equal(0);
      expect(stats.currentKmsGeneration).to.equal(KMS_GENERATION);
    });

    it("Should return gas estimate", async function () {
      const gasEstimate = await contract.getGasEstimate();
      expect(gasEstimate).to.equal(800000); // 4 comparisons * 200k gas
    });

    it("Should return user listings", async function () {
      await contract.connect(landlord).createListing(
        1000,
        2,
        12345,
        1,
        { value: DEPOSIT_AMOUNT }
      );

      const userListings = await contract.getUserListings(landlord.address);
      expect(userListings.length).to.equal(1);
      expect(userListings[0]).to.equal(1);
    });

    it("Should return user requests", async function () {
      await contract.connect(tenant).createRequest(
        1200,
        2,
        12345,
        1,
        { value: DEPOSIT_AMOUNT }
      );

      const userRequests = await contract.getUserRequests(tenant.address);
      expect(userRequests.length).to.equal(1);
      expect(userRequests[0]).to.equal(1);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow emergency pause by pauser", async function () {
      await contract.connect(pauser).emergencyPause();

      expect(await contract.isPaused()).to.equal(true);
    });

    it("Should emit security alert on emergency pause", async function () {
      await expect(contract.connect(pauser).emergencyPause())
        .to.emit(contract, "SecurityAlert")
        .withArgs("EMERGENCY_PAUSE", pauser.address, "Emergency pause activated");
    });
  });

  describe("KMS Generation Management", function () {
    it("Should update KMS generation", async function () {
      await expect(contract.connect(owner).updateKmsGeneration(2))
        .to.emit(contract, "KmsGenerationUpdated")
        .withArgs(KMS_GENERATION, 2);

      expect(await contract.kmsGeneration()).to.equal(2);
    });

    it("Should prevent non-owner from updating KMS generation", async function () {
      await expect(
        contract.connect(landlord).updateKmsGeneration(2)
      ).to.be.revertedWith("AUTH: Not authorized");
    });
  });
});
