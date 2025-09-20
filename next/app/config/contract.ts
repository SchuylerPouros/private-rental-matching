export const CONTRACT_ADDRESS = '0x980051585b6DC385159BD53B5C78eb7B91b848E5' as const;

export const CONTRACT_ABI = [
  // Constructor
  {
    "inputs": [
      { "internalType": "address[]", "name": "_pauserAddresses", "type": "address[]" },
      { "internalType": "uint256", "name": "_kmsGeneration", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "listingId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "landlord", "type": "address" }
    ],
    "name": "ListingCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "requestId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "tenant", "type": "address" }
    ],
    "name": "RequestCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "matchId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "listingId", "type": "uint256" },
      { "indexed": true, "internalType": "uint256", "name": "requestId", "type": "uint256" }
    ],
    "name": "MatchCreated",
    "type": "event"
  },
  // Main Functions
  {
    "inputs": [
      { "internalType": "uint32", "name": "_price", "type": "uint32" },
      { "internalType": "uint8", "name": "_bedrooms", "type": "uint8" },
      { "internalType": "uint32", "name": "_postalCode", "type": "uint32" },
      { "internalType": "uint8", "name": "_propertyType", "type": "uint8" }
    ],
    "name": "createListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint32", "name": "_maxBudget", "type": "uint32" },
      { "internalType": "uint8", "name": "_minBedrooms", "type": "uint8" },
      { "internalType": "uint32", "name": "_preferredPostalCode", "type": "uint32" },
      { "internalType": "uint8", "name": "_preferredPropertyType", "type": "uint8" }
    ],
    "name": "createRequest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_listingId", "type": "uint256" },
      { "internalType": "uint256", "name": "_requestId", "type": "uint256" }
    ],
    "name": "createMatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_matchId", "type": "uint256" }
    ],
    "name": "confirmMatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // View Functions
  {
    "inputs": [],
    "name": "getPlatformStats",
    "outputs": [
      { "internalType": "uint256", "name": "totalListings", "type": "uint256" },
      { "internalType": "uint256", "name": "totalRequests", "type": "uint256" },
      { "internalType": "uint256", "name": "totalMatches", "type": "uint256" },
      { "internalType": "uint256", "name": "activeListings", "type": "uint256" },
      { "internalType": "uint256", "name": "activeRequests", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "getUserListings",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "getUserRequests",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_matchId", "type": "uint256" }
    ],
    "name": "getMatchDetails",
    "outputs": [
      { "internalType": "uint256", "name": "listingId", "type": "uint256" },
      { "internalType": "uint256", "name": "requestId", "type": "uint256" },
      { "internalType": "address", "name": "landlord", "type": "address" },
      { "internalType": "address", "name": "tenant", "type": "address" },
      { "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "internalType": "bool", "name": "isConfirmed", "type": "bool" },
      { "internalType": "bool", "name": "landlordConfirmed", "type": "bool" },
      { "internalType": "bool", "name": "tenantConfirmed", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;
