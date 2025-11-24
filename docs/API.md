# Enhanced Private Rental Matching - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Core Functions](#core-functions)
3. [Gateway Callback Functions](#gateway-callback-functions)
4. [Administrative Functions](#administrative-functions)
5. [View Functions](#view-functions)
6. [Events](#events)
7. [Data Structures](#data-structures)
8. [Error Codes](#error-codes)
9. [Usage Examples](#usage-examples)

---

## Overview

This API documentation covers all public and external functions of the `PrivateRentalMatchingEnhanced` contract. The contract implements a privacy-preserving rental matching system with Gateway callback patterns, refund mechanisms, and comprehensive security features.

**Contract Address**: (deployed address)
**Network**: Sepolia Testnet (or configured network)
**Solidity Version**: ^0.8.24

---

## Core Functions

### `createListing`

Creates a property listing with encrypted details and price obfuscation.

**Signature**:
```solidity
function createListing(
    uint32 _price,
    uint8 _bedrooms,
    uint32 _postalCode,
    uint8 _propertyType
) external payable
```

**Parameters**:
| Name | Type | Description | Constraints |
|------|------|-------------|-------------|
| `_price` | `uint32` | Monthly rent price | 100 ≤ price ≤ 1,000,000 |
| `_bedrooms` | `uint8` | Number of bedrooms | 1 ≤ bedrooms ≤ 10 |
| `_postalCode` | `uint32` | Property postal code | Any valid postal code |
| `_propertyType` | `uint8` | Property type | 1=apartment, 2=house, 3=studio |

**Requirements**:
- `msg.value` ≥ 0.01 ETH (security deposit)
- Contract not paused
- Rate limit cooldown satisfied (5 seconds)

**Effects**:
- Creates encrypted listing with obfuscated price
- Stores listing in contract state
- Adds listing ID to user's listings
- Emits `ListingCreated` event

**Returns**: None (transaction hash in receipt)

**Events Emitted**:
```solidity
event ListingCreated(uint256 indexed listingId, address indexed landlord, uint256 deposit);
```

**Example**:
```javascript
await contract.createListing(
  1000,  // $1000/month
  2,     // 2 bedrooms
  12345, // Postal code
  1,     // Apartment
  { value: ethers.parseEther("0.01") }
);
```

**Errors**:
- `VALIDATION: Price too low` - Price < 100
- `VALIDATION: Price too high` - Price > 1,000,000
- `VALIDATION: Invalid bedroom count` - Bedrooms not in 1-10
- `VALIDATION: Invalid property type` - Type not in 1-3
- `VALIDATION: Insufficient deposit` - msg.value < 0.01 ETH
- `RATE_LIMIT: Too many requests` - Called too quickly
- `PAUSED: Contract is paused` - Contract paused

---

### `createRequest`

Creates a rental request with encrypted requirements and budget obfuscation.

**Signature**:
```solidity
function createRequest(
    uint32 _maxBudget,
    uint8 _minBedrooms,
    uint32 _preferredPostalCode,
    uint8 _preferredPropertyType
) external payable
```

**Parameters**:
| Name | Type | Description | Constraints |
|------|------|-------------|-------------|
| `_maxBudget` | `uint32` | Maximum monthly budget | 100 ≤ budget ≤ 1,000,000 |
| `_minBedrooms` | `uint8` | Minimum bedrooms required | 1 ≤ bedrooms ≤ 10 |
| `_preferredPostalCode` | `uint32` | Preferred postal code | Any valid postal code |
| `_preferredPropertyType` | `uint8` | Preferred property type | 1-3 |

**Requirements**:
- `msg.value` ≥ 0.01 ETH (security deposit)
- Contract not paused
- Rate limit cooldown satisfied

**Effects**:
- Creates encrypted request with obfuscated budget
- Stores request in contract state
- Adds request ID to user's requests
- Emits `RequestCreated` event

**Events Emitted**:
```solidity
event RequestCreated(uint256 indexed requestId, address indexed tenant, uint256 deposit);
```

**Example**:
```javascript
await contract.createRequest(
  1200,  // Max $1200/month
  2,     // Min 2 bedrooms
  12345, // Preferred postal code
  1,     // Apartment
  { value: ethers.parseEther("0.01") }
);
```

---

### `createMatchWithGatewayCallback`

Creates a match between listing and request, initiating Gateway decryption.

**Signature**:
```solidity
function createMatchWithGatewayCallback(
    uint256 _listingId,
    uint256 _requestId
) external returns (uint256 matchId)
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `_listingId` | `uint256` | ID of the property listing |
| `_requestId` | `uint256` | ID of the rental request |

**Requirements**:
- Listing must be active and not matched
- Request must be active and not matched
- Caller must be landlord or tenant
- Contract not paused
- Rate limit cooldown satisfied

**Effects**:
- Creates preliminary match
- Requests Gateway decryption
- Sets match status to `DecryptionRequested`
- Sets timeout deadline (1 hour for decryption)
- Sets confirmation deadline (7 days)
- Emits `MatchCreated` and `DecryptionRequested` events

**Returns**: `uint256 matchId` - The ID of the created match

**Events Emitted**:
```solidity
event MatchCreated(uint256 indexed matchId, uint256 indexed listingId, uint256 indexed requestId);
event DecryptionRequested(
    uint256 indexed requestId,
    address indexed requester,
    DecryptionType requestType,
    uint256 timeout,
    uint256 relatedEntityId
);
```

**Example**:
```javascript
const tx = await contract.createMatchWithGatewayCallback(1, 1);
const receipt = await tx.wait();
// Extract matchId from events
```

---

### `confirmMatch`

Confirms a match after successful Gateway decryption.

**Signature**:
```solidity
function confirmMatch(uint256 _matchId) external
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `_matchId` | `uint256` | ID of the match to confirm |

**Requirements**:
- Match status must be `DecryptionCompleted`
- Match not already confirmed
- Caller must be landlord or tenant
- Current time before confirmation deadline
- Contract not paused

**Effects**:
- Marks caller's confirmation (landlord or tenant)
- If both confirmed:
  - Sets status to `ConfirmedByBoth`
  - Returns deposits to both parties
  - Marks listing and request as matched
- Emits `MatchConfirmed` event

**Events Emitted**:
```solidity
event MatchConfirmed(uint256 indexed matchId, address indexed confirmer);
event DepositReturned(uint256 indexed matchId, address indexed recipient, uint256 amount);
```

**Example**:
```javascript
// Landlord confirms
await contract.connect(landlord).confirmMatch(matchId);

// Tenant confirms (finalizes match)
await contract.connect(tenant).confirmMatch(matchId);
```

---

### `deactivateListing`

Deactivates a listing and refunds deposit if not matched.

**Signature**:
```solidity
function deactivateListing(uint256 _listingId) external
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `_listingId` | `uint256` | ID of listing to deactivate |

**Requirements**:
- Listing must be active
- Caller must be listing owner
- Listing must not be matched

**Effects**:
- Deactivates listing
- Refunds deposit to landlord
- Emits `ListingDeactivated` and `RefundIssued` events

**Events Emitted**:
```solidity
event ListingDeactivated(uint256 indexed listingId, bool refunded);
event RefundIssued(uint256 indexed entityId, address indexed recipient, uint256 amount, string reason);
```

---

### `deactivateRequest`

Deactivates a request and refunds deposit if not matched.

**Signature**:
```solidity
function deactivateRequest(uint256 _requestId) external
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `_requestId` | `uint256` | ID of request to deactivate |

**Requirements**:
- Request must be active
- Caller must be request owner
- Request must not be matched

**Effects**:
- Deactivates request
- Refunds deposit to tenant
- Emits `RequestDeactivated` and `RefundIssued` events

---

## Gateway Callback Functions

### `processMatchDecryptionCallback`

Called by Gateway oracle to process decryption results.

**Signature**:
```solidity
function processMatchDecryptionCallback(
    uint256 _decryptRequestId,
    bool _priceMatches,
    bool _bedroomsMatch,
    bool _success
) external
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `_decryptRequestId` | `uint256` | Decryption request ID |
| `_priceMatches` | `bool` | Whether price criteria match |
| `_bedroomsMatch` | `bool` | Whether bedroom criteria match |
| `_success` | `bool` | Whether decryption succeeded |

**Requirements**:
- Request must not be fulfilled
- Request must not be timed out
- Contract not paused
- ⚠️ **Production**: Verify `msg.sender` is oracle address

**Effects**:
- If successful and criteria match:
  - Sets match status to `DecryptionCompleted`
- If failed or criteria don't match:
  - Issues refunds to both parties
  - Sets match status to `RefundIssued`
- Emits `DecryptionCompleted` event

**Events Emitted**:
```solidity
event DecryptionCompleted(uint256 indexed requestId, uint256 indexed relatedEntityId, bool success);
```

**Example (Oracle)**:
```javascript
// Oracle backend
await contract.processMatchDecryptionCallback(
  decryptRequestId,
  true,  // Price matches
  true,  // Bedrooms match
  true   // Decryption successful
);
```

---

### `claimTimeoutRefund`

Claims refund for timed-out decryption request.

**Signature**:
```solidity
function claimTimeoutRefund(uint256 _decryptRequestId) external
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `_decryptRequestId` | `uint256` | Decryption request ID |

**Requirements**:
- Request must not be fulfilled
- Request must not be already timed out
- Current time must be past timeout deadline (1 hour)

**Effects**:
- Marks request as timed out
- Sets match status to `Expired`
- Issues refunds to both landlord and tenant
- Emits `DecryptionTimedOut` and `RefundIssued` events

**Events Emitted**:
```solidity
event DecryptionTimedOut(uint256 indexed requestId, uint256 indexed relatedEntityId, address refundRecipient);
event RefundIssued(...);
```

**Example**:
```javascript
// After 1 hour timeout
await contract.claimTimeoutRefund(decryptRequestId);
```

---

## Administrative Functions

### `addPauser`

Adds a new pauser address (owner only).

**Signature**:
```solidity
function addPauser(address _pauser) external
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `_pauser` | `address` | Address to add as pauser |

**Requirements**:
- Caller must be owner
- Address must not be zero address
- Address must not already be a pauser

**Events Emitted**:
```solidity
event PauserAdded(address indexed pauser);
```

---

### `removePauser`

Removes a pauser address (owner only).

**Signature**:
```solidity
function removePauser(address _pauser) external
```

**Requirements**:
- Caller must be owner
- Address must be a pauser

**Events Emitted**:
```solidity
event PauserRemoved(address indexed pauser);
```

---

### `pause`

Pauses the contract (pauser only).

**Signature**:
```solidity
function pause() external
```

**Requirements**:
- Caller must be a pauser
- Contract must not be already paused

**Effects**:
- Pauses all operations (listings, requests, matches, confirmations)

**Events Emitted**:
```solidity
event ContractPaused(address indexed by);
```

---

### `unpause`

Unpauses the contract (owner only).

**Signature**:
```solidity
function unpause() external
```

**Requirements**:
- Caller must be owner
- Contract must be paused

**Events Emitted**:
```solidity
event ContractUnpaused(address indexed by);
```

---

### `emergencyPause`

Emergency pause (pauser only, with security alert).

**Signature**:
```solidity
function emergencyPause() external
```

**Requirements**:
- Caller must be a pauser

**Events Emitted**:
```solidity
event ContractPaused(address indexed by);
event SecurityAlert(string alertType, address indexed user, string details);
```

---

### `updateKmsGeneration`

Updates KMS generation number (owner only).

**Signature**:
```solidity
function updateKmsGeneration(uint256 _newGeneration) external
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| `_newGeneration` | `uint256` | New KMS generation |

**Events Emitted**:
```solidity
event KmsGenerationUpdated(uint256 oldGeneration, uint256 newGeneration);
```

---

## View Functions

### `getUserListings`

Returns all listing IDs for a user.

**Signature**:
```solidity
function getUserListings(address _user) external view returns (uint256[] memory)
```

**Returns**: Array of listing IDs

**Example**:
```javascript
const listingIds = await contract.getUserListings(landlordAddress);
```

---

### `getUserRequests`

Returns all request IDs for a user.

**Signature**:
```solidity
function getUserRequests(address _user) external view returns (uint256[] memory)
```

**Returns**: Array of request IDs

---

### `getMatchDetails`

Returns detailed information about a match.

**Signature**:
```solidity
function getMatchDetails(uint256 _matchId) external view returns (
    uint256 listingId,
    uint256 requestId,
    address landlord,
    address tenant,
    uint256 timestamp,
    uint256 confirmationDeadline,
    bool isConfirmed,
    MatchStatus status
)
```

**Returns**:
| Field | Type | Description |
|-------|------|-------------|
| `listingId` | `uint256` | Associated listing ID |
| `requestId` | `uint256` | Associated request ID |
| `landlord` | `address` | Landlord address |
| `tenant` | `address` | Tenant address |
| `timestamp` | `uint256` | Match creation time |
| `confirmationDeadline` | `uint256` | Confirmation deadline timestamp |
| `isConfirmed` | `bool` | Whether fully confirmed |
| `status` | `MatchStatus` | Current match status (0-5) |

**Example**:
```javascript
const matchDetails = await contract.getMatchDetails(matchId);
console.log(`Status: ${matchDetails.status}`);
```

---

### `getDecryptionRequestDetails`

Returns details about a decryption request.

**Signature**:
```solidity
function getDecryptionRequestDetails(uint256 _requestId) external view returns (
    address requester,
    DecryptionType requestType,
    uint256 timeout,
    bool fulfilled,
    bool timedOut,
    uint256 relatedEntityId
)
```

---

### `getPlatformStats`

Returns comprehensive platform statistics.

**Signature**:
```solidity
function getPlatformStats() external view returns (
    uint256 totalListings,
    uint256 totalRequests,
    uint256 totalMatches,
    uint256 totalDecryptionRequests,
    uint256 currentKmsGeneration
)
```

**Example**:
```javascript
const stats = await contract.getPlatformStats();
console.log(`Total Listings: ${stats.totalListings}`);
console.log(`Total Matches: ${stats.totalMatches}`);
```

---

### `isPauser`

Checks if an address is a pauser.

**Signature**:
```solidity
function isPauser(address _address) external view returns (bool)
```

---

### `isContractPaused`

Checks if contract is paused.

**Signature**:
```solidity
function isContractPaused() external view returns (bool)
```

---

### `getGasEstimate`

Returns estimated gas cost for match operations.

**Signature**:
```solidity
function getGasEstimate() external pure returns (uint256)
```

**Returns**: `uint256` - Estimated gas (800,000 for 4 FHE comparisons)

---

## Events

### Core Events

```solidity
event ListingCreated(uint256 indexed listingId, address indexed landlord, uint256 deposit);
event RequestCreated(uint256 indexed requestId, address indexed tenant, uint256 deposit);
event MatchCreated(uint256 indexed matchId, uint256 indexed listingId, uint256 indexed requestId);
event MatchConfirmed(uint256 indexed matchId, address indexed confirmer);
event ListingDeactivated(uint256 indexed listingId, bool refunded);
event RequestDeactivated(uint256 indexed requestId, bool refunded);
```

### Gateway Events

```solidity
event DecryptionRequested(
    uint256 indexed requestId,
    address indexed requester,
    DecryptionType requestType,
    uint256 timeout,
    uint256 relatedEntityId
);

event DecryptionCompleted(
    uint256 indexed requestId,
    uint256 indexed relatedEntityId,
    bool success
);

event DecryptionTimedOut(
    uint256 indexed requestId,
    uint256 indexed relatedEntityId,
    address refundRecipient
);
```

### Refund Events

```solidity
event RefundIssued(
    uint256 indexed entityId,
    address indexed recipient,
    uint256 amount,
    string reason
);

event DepositReturned(
    uint256 indexed matchId,
    address indexed recipient,
    uint256 amount
);
```

### Security Events

```solidity
event SecurityAlert(string alertType, address indexed user, string details);
event PauserAdded(address indexed pauser);
event PauserRemoved(address indexed pauser);
event ContractPaused(address indexed by);
event ContractUnpaused(address indexed by);
event KmsGenerationUpdated(uint256 oldGeneration, uint256 newGeneration);
```

---

## Data Structures

### MatchStatus Enum

```solidity
enum MatchStatus {
    Pending,              // 0: Initial state
    DecryptionRequested,  // 1: Waiting for Gateway
    DecryptionCompleted,  // 2: Ready for confirmation
    ConfirmedByBoth,      // 3: Fully confirmed (final)
    Expired,              // 4: Timed out
    RefundIssued          // 5: Refunded (final)
}
```

### DecryptionType Enum

```solidity
enum DecryptionType {
    ListingVerification,  // 0
    RequestVerification,  // 1
    MatchComparison,      // 2
    PriceReveal          // 3
}
```

---

## Error Codes

### Validation Errors
- `VALIDATION: Price too low`
- `VALIDATION: Price too high`
- `VALIDATION: Invalid bedroom count`
- `VALIDATION: Invalid property type`
- `VALIDATION: Insufficient deposit`
- `VALIDATION: Listing not active`
- `VALIDATION: Request not active`
- `VALIDATION: Already matched`
- `VALIDATION: Not yet timed out`
- `VALIDATION: Already fulfilled`
- `VALIDATION: Decryption not completed`
- `VALIDATION: Already confirmed`
- `VALIDATION: Confirmation deadline passed`

### Authorization Errors
- `AUTH: Not authorized`
- `AUTH: Not listing owner`
- `AUTH: Not request owner`
- `AUTH: Not a pauser`

### Other Errors
- `RATE_LIMIT: Too many requests`
- `PAUSED: Contract is paused`
- `REFUND: Landlord refund failed`
- `REFUND: Tenant refund failed`

---

## Usage Examples

### Complete Matching Flow

```javascript
// 1. Landlord creates listing
const listingTx = await contract.connect(landlord).createListing(
  1000,  // $1000/month
  2,     // 2 bedrooms
  12345,
  1,     // Apartment
  { value: ethers.parseEther("0.01") }
);
await listingTx.wait();

// Wait for rate limit
await new Promise(resolve => setTimeout(resolve, 6000));

// 2. Tenant creates request
const requestTx = await contract.connect(tenant).createRequest(
  1200,  // Up to $1200
  2,     // Min 2 bedrooms
  12345,
  1,
  { value: ethers.parseEther("0.01") }
);
await requestTx.wait();

// Wait for rate limit
await new Promise(resolve => setTimeout(resolve, 6000));

// 3. Create match (triggers Gateway decryption)
const matchTx = await contract.connect(landlord).createMatchWithGatewayCallback(1, 1);
const matchReceipt = await matchTx.wait();

// 4. Gateway processes (off-chain)
// ... Oracle monitors DecryptionRequested event, decrypts, and calls callback

// 5. Both parties confirm after successful decryption
await contract.connect(landlord).confirmMatch(1);
await contract.connect(tenant).confirmMatch(1);

// 6. Deposits automatically returned
```

### Handling Timeouts

```javascript
// If Gateway doesn't respond within 1 hour
const decryptRequestId = 1;

// Anyone can trigger timeout refund
await contract.claimTimeoutRefund(decryptRequestId);

// Deposits automatically refunded to both parties
```

### Monitoring Events

```javascript
// Listen for listing creation
contract.on("ListingCreated", (listingId, landlord, deposit) => {
  console.log(`New listing ${listingId} by ${landlord}`);
});

// Listen for matches
contract.on("MatchCreated", (matchId, listingId, requestId) => {
  console.log(`Match ${matchId} created`);
});

// Listen for decryption requests
contract.on("DecryptionRequested", (requestId, requester, type, timeout, entityId) => {
  console.log(`Decryption ${requestId} requested, timeout at ${new Date(timeout * 1000)}`);
});

// Listen for refunds
contract.on("RefundIssued", (entityId, recipient, amount, reason) => {
  console.log(`Refund issued: ${ethers.formatEther(amount)} ETH to ${recipient} - ${reason}`);
});
```

---

## Best Practices

1. **Always check contract pause status** before transactions
2. **Respect rate limits** - wait 5+ seconds between actions
3. **Monitor timeout deadlines** - claim refunds proactively
4. **Handle transaction failures** gracefully
5. **Verify match status** before confirmation
6. **Use events** for state tracking
7. **Estimate gas** before transactions (use `getGasEstimate()`)
8. **Keep deposits safe** - never send more than required

---

## Support

For questions or issues:
- GitHub Issues: [link]
- Documentation: [link]
- Discord: [link]
