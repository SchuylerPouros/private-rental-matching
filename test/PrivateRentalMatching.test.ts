import { expect } from "chai";
import { ethers } from "hardhat";
import { PrivateRentalMatching } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PrivateRentalMatching", function () {
  let contract: PrivateRentalMatching;
  let owner: SignerWithAddress;
  let landlord1: SignerWithAddress;
  let landlord2: SignerWithAddress;
  let tenant1: SignerWithAddress;
  let tenant2: SignerWithAddress;
  let gatewayAddress: string;

  beforeEach(async function () {
    [owner, landlord1, landlord2, tenant1, tenant2] = await ethers.getSigners();

    // Mock gateway address (in production, this would be the actual Gateway contract)
    gatewayAddress = "0x0000000000000000000000000000000000000001";

    const PrivateRentalMatchingFactory = await ethers.getContractFactory("PrivateRentalMatching");
    contract = await PrivateRentalMatchingFactory.deploy(gatewayAddress);
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should initialize counters correctly", async function () {
      expect(await contract.listingIdCounter()).to.equal(1);
      expect(await contract.requestIdCounter()).to.equal(1);
      expect(await contract.matchCounter()).to.equal(1);
    });

    it("Should set the gateway address", async function () {
      expect(await contract.gateway()).to.equal(gatewayAddress);
    });
  });

  describe("Property Listings", function () {
    it("Should create a new listing", async function () {
      // Note: In actual tests with fhEVM, you would encrypt the data properly
      // For now, we're testing the structure
      const price = 1500;
      const bedrooms = 2;
      const postalCode = 10001;
      const propertyType = 1; // APARTMENT

      await expect(
        contract.connect(landlord1).createListing(
          price,
          bedrooms,
          postalCode,
          propertyType
        )
      ).to.emit(contract, "ListingCreated")
        .withArgs(1, landlord1.address);

      expect(await contract.listingIdCounter()).to.equal(2);
    });

    it("Should track user listings", async function () {
      await contract.connect(landlord1).createListing(1500, 2, 10001, 1);
      await contract.connect(landlord1).createListing(2000, 3, 10002, 2);

      const userListings = await contract.getUserListings(landlord1.address);
      expect(userListings.length).to.equal(2);
      expect(userListings[0]).to.equal(1);
      expect(userListings[1]).to.equal(2);
    });

    it("Should allow landlord to deactivate their listing", async function () {
      await contract.connect(landlord1).createListing(1500, 2, 10001, 1);

      await expect(
        contract.connect(landlord1).deactivateListing(1)
      ).to.emit(contract, "ListingDeactivated")
        .withArgs(1);

      const details = await contract.getListingDetails(1);
      expect(details.isActive).to.equal(false);
    });

    it("Should not allow non-owner to deactivate listing", async function () {
      await contract.connect(landlord1).createListing(1500, 2, 10001, 1);

      await expect(
        contract.connect(landlord2).deactivateListing(1)
      ).to.be.revertedWith("Not listing owner");
    });

    it("Should return correct listing details", async function () {
      await contract.connect(landlord1).createListing(1500, 2, 10001, 1);

      const details = await contract.getListingDetails(1);
      expect(details.isActive).to.equal(true);
      expect(details.landlord).to.equal(landlord1.address);
      expect(details.isMatched).to.equal(false);
    });

    it("Should not allow deactivating inactive listing", async function () {
      await contract.connect(landlord1).createListing(1500, 2, 10001, 1);
      await contract.connect(landlord1).deactivateListing(1);

      await expect(
        contract.connect(landlord1).deactivateListing(1)
      ).to.be.revertedWith("Listing not active");
    });
  });

  describe("Rental Requests", function () {
    it("Should create a new request", async function () {
      const maxBudget = 1800;
      const minBedrooms = 2;
      const preferredPostalCode = 10001;
      const preferredPropertyType = 1; // APARTMENT

      await expect(
        contract.connect(tenant1).createRequest(
          maxBudget,
          minBedrooms,
          preferredPostalCode,
          preferredPropertyType
        )
      ).to.emit(contract, "RequestCreated")
        .withArgs(1, tenant1.address);

      expect(await contract.requestIdCounter()).to.equal(2);
    });

    it("Should track user requests", async function () {
      await contract.connect(tenant1).createRequest(1800, 2, 10001, 1);
      await contract.connect(tenant1).createRequest(2200, 3, 10002, 2);

      const userRequests = await contract.getUserRequests(tenant1.address);
      expect(userRequests.length).to.equal(2);
      expect(userRequests[0]).to.equal(1);
      expect(userRequests[1]).to.equal(2);
    });

    it("Should allow tenant to deactivate their request", async function () {
      await contract.connect(tenant1).createRequest(1800, 2, 10001, 1);

      await expect(
        contract.connect(tenant1).deactivateRequest(1)
      ).to.emit(contract, "RequestDeactivated")
        .withArgs(1);

      const details = await contract.getRequestDetails(1);
      expect(details.isActive).to.equal(false);
    });

    it("Should not allow non-owner to deactivate request", async function () {
      await contract.connect(tenant1).createRequest(1800, 2, 10001, 1);

      await expect(
        contract.connect(tenant2).deactivateRequest(1)
      ).to.be.revertedWith("Not request owner");
    });

    it("Should return correct request details", async function () {
      await contract.connect(tenant1).createRequest(1800, 2, 10001, 1);

      const details = await contract.getRequestDetails(1);
      expect(details.isActive).to.equal(true);
      expect(details.tenant).to.equal(tenant1.address);
      expect(details.isMatched).to.equal(false);
    });

    it("Should not allow deactivating inactive request", async function () {
      await contract.connect(tenant1).createRequest(1800, 2, 10001, 1);
      await contract.connect(tenant1).deactivateRequest(1);

      await expect(
        contract.connect(tenant1).deactivateRequest(1)
      ).to.be.revertedWith("Request not active");
    });
  });

  describe("Matching", function () {
    beforeEach(async function () {
      // Create a listing and a request
      await contract.connect(landlord1).createListing(1500, 2, 10001, 1);
      await contract.connect(tenant1).createRequest(1800, 2, 10001, 1);
    });

    it("Should create a match between listing and request", async function () {
      await expect(
        contract.connect(landlord1).createMatch(1, 1)
      ).to.emit(contract, "MatchCreated")
        .withArgs(1, 1, 1);

      expect(await contract.matchCounter()).to.equal(2);
    });

    it("Should allow tenant to create a match", async function () {
      await expect(
        contract.connect(tenant1).createMatch(1, 1)
      ).to.emit(contract, "MatchCreated")
        .withArgs(1, 1, 1);
    });

    it("Should not allow unauthorized user to create match", async function () {
      await expect(
        contract.connect(landlord2).createMatch(1, 1)
      ).to.be.revertedWith("Not authorized to create this match");
    });

    it("Should not allow matching inactive listing", async function () {
      await contract.connect(landlord1).deactivateListing(1);

      await expect(
        contract.connect(landlord1).createMatch(1, 1)
      ).to.be.revertedWith("Listing not active");
    });

    it("Should not allow matching inactive request", async function () {
      await contract.connect(tenant1).deactivateRequest(1);

      await expect(
        contract.connect(tenant1).createMatch(1, 1)
      ).to.be.revertedWith("Request not active");
    });

    it("Should not allow matching already matched listing", async function () {
      await contract.connect(landlord1).createMatch(1, 1);

      // Create another request
      await contract.connect(tenant2).createRequest(1800, 2, 10001, 1);

      await expect(
        contract.connect(landlord1).createMatch(1, 2)
      ).to.be.revertedWith("Listing already matched");
    });

    it("Should not allow matching already matched request", async function () {
      await contract.connect(landlord1).createMatch(1, 1);

      // Create another listing
      await contract.connect(landlord2).createListing(1500, 2, 10001, 1);

      await expect(
        contract.connect(tenant1).createMatch(2, 1)
      ).to.be.revertedWith("Request already matched");
    });

    it("Should update listing and request matched status", async function () {
      await contract.connect(landlord1).createMatch(1, 1);

      const listingDetails = await contract.getListingDetails(1);
      const requestDetails = await contract.getRequestDetails(1);

      expect(listingDetails.isMatched).to.equal(true);
      expect(requestDetails.isMatched).to.equal(true);
    });
  });

  describe("Match Confirmation", function () {
    beforeEach(async function () {
      await contract.connect(landlord1).createListing(1500, 2, 10001, 1);
      await contract.connect(tenant1).createRequest(1800, 2, 10001, 1);
      await contract.connect(landlord1).createMatch(1, 1);
    });

    it("Should allow landlord to confirm match", async function () {
      await expect(
        contract.connect(landlord1).confirmMatch(1)
      ).to.emit(contract, "MatchConfirmed")
        .withArgs(1, landlord1.address);

      const match = await contract.getMatchDetails(1);
      expect(match.landlordConfirmed).to.equal(true);
    });

    it("Should allow tenant to confirm match", async function () {
      await expect(
        contract.connect(tenant1).confirmMatch(1)
      ).to.emit(contract, "MatchConfirmed")
        .withArgs(1, tenant1.address);

      const match = await contract.getMatchDetails(1);
      expect(match.tenantConfirmed).to.equal(true);
    });

    it("Should fully confirm match when both parties confirm", async function () {
      await contract.connect(landlord1).confirmMatch(1);
      await contract.connect(tenant1).confirmMatch(1);

      const match = await contract.getMatchDetails(1);
      expect(match.isConfirmed).to.equal(true);
      expect(match.landlordConfirmed).to.equal(true);
      expect(match.tenantConfirmed).to.equal(true);
    });

    it("Should not allow unauthorized user to confirm match", async function () {
      await expect(
        contract.connect(landlord2).confirmMatch(1)
      ).to.be.revertedWith("Not authorized to confirm this match");
    });

    it("Should not allow double confirmation by landlord", async function () {
      await contract.connect(landlord1).confirmMatch(1);

      await expect(
        contract.connect(landlord1).confirmMatch(1)
      ).to.be.revertedWith("Already confirmed by landlord");
    });

    it("Should not allow double confirmation by tenant", async function () {
      await contract.connect(tenant1).confirmMatch(1);

      await expect(
        contract.connect(tenant1).confirmMatch(1)
      ).to.be.revertedWith("Already confirmed by tenant");
    });

    it("Should not allow confirmation of already confirmed match", async function () {
      await contract.connect(landlord1).confirmMatch(1);
      await contract.connect(tenant1).confirmMatch(1);

      // Try to confirm again
      await expect(
        contract.connect(landlord1).confirmMatch(1)
      ).to.be.revertedWith("Match already confirmed");
    });

    it("Should return correct match details", async function () {
      await contract.connect(landlord1).confirmMatch(1);

      const match = await contract.getMatchDetails(1);
      expect(match.listingId).to.equal(1);
      expect(match.requestId).to.equal(1);
      expect(match.landlord).to.equal(landlord1.address);
      expect(match.tenant).to.equal(tenant1.address);
      expect(match.landlordConfirmed).to.equal(true);
      expect(match.tenantConfirmed).to.equal(false);
      expect(match.isConfirmed).to.equal(false);
    });
  });

  describe("Statistics and Counters", function () {
    it("Should count active listings correctly", async function () {
      await contract.connect(landlord1).createListing(1500, 2, 10001, 1);
      await contract.connect(landlord2).createListing(2000, 3, 10002, 2);

      expect(await contract.getActiveListingsCount()).to.equal(2);

      // Deactivate one
      await contract.connect(landlord1).deactivateListing(1);
      expect(await contract.getActiveListingsCount()).to.equal(1);
    });

    it("Should count active requests correctly", async function () {
      await contract.connect(tenant1).createRequest(1800, 2, 10001, 1);
      await contract.connect(tenant2).createRequest(2200, 3, 10002, 2);

      expect(await contract.getActiveRequestsCount()).to.equal(2);

      // Deactivate one
      await contract.connect(tenant1).deactivateRequest(1);
      expect(await contract.getActiveRequestsCount()).to.equal(1);
    });

    it("Should not count matched listings as active", async function () {
      await contract.connect(landlord1).createListing(1500, 2, 10001, 1);
      await contract.connect(landlord2).createListing(2000, 3, 10002, 2);
      await contract.connect(tenant1).createRequest(1800, 2, 10001, 1);

      expect(await contract.getActiveListingsCount()).to.equal(2);

      // Create a match
      await contract.connect(landlord1).createMatch(1, 1);

      expect(await contract.getActiveListingsCount()).to.equal(1);
    });

    it("Should not count matched requests as active", async function () {
      await contract.connect(landlord1).createListing(1500, 2, 10001, 1);
      await contract.connect(tenant1).createRequest(1800, 2, 10001, 1);
      await contract.connect(tenant2).createRequest(2200, 3, 10002, 2);

      expect(await contract.getActiveRequestsCount()).to.equal(2);

      // Create a match
      await contract.connect(landlord1).createMatch(1, 1);

      expect(await contract.getActiveRequestsCount()).to.equal(1);
    });
  });

  describe("Gateway Management", function () {
    it("Should allow owner to update gateway address", async function () {
      const newGateway = "0x0000000000000000000000000000000000000002";

      await contract.connect(owner).updateGateway(newGateway);

      expect(await contract.gateway()).to.equal(newGateway);
    });

    it("Should not allow non-owner to update gateway", async function () {
      const newGateway = "0x0000000000000000000000000000000000000002";

      await expect(
        contract.connect(landlord1).updateGateway(newGateway)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should not allow updating to zero address", async function () {
      await expect(
        contract.connect(owner).updateGateway(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid gateway address");
    });
  });
});
