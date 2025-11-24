# Enhanced Private Rental Matching - Architecture Documentation

## Overview

The Enhanced Private Rental Matching Platform v3.0 is a privacy-preserving rental property matching system built on Fully Homomorphic Encryption (FHE) technology. This document describes the advanced architectural features including Gateway callback patterns, refund mechanisms, timeout protection, and comprehensive security measures.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Gateway Callback Pattern](#gateway-callback-pattern)
3. [Security Architecture](#security-architecture)
4. [Privacy Protection Mechanisms](#privacy-protection-mechanisms)
5. [Refund and Timeout Systems](#refund-and-timeout-systems)
6. [Gas Optimization](#gas-optimization)
7. [State Management](#state-management)
8. [Error Handling](#error-handling)

---

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                      │
│  (Landlords & Tenants - Web3 Frontend)                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├─────── Encrypted Transactions
                   ↓
┌─────────────────────────────────────────────────────────────┐
│               SMART CONTRACT LAYER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ PrivateRentalMatchingEnhanced.sol                    │   │
│  │  - Listing Management                                │   │
│  │  - Request Management                                │   │
│  │  - Match Creation & Confirmation                     │   │
│  │  - Refund & Timeout Handlers                         │   │
│  └──────────────────┬───────────────────────────────────┘   │
└────────────────────┼─────────────────────────────────────────┘
                     │
                     ├──────── Decryption Requests
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  GATEWAY ORACLE LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ KMS (Key Management System)                          │   │
│  │  - Decryption Service                                │   │
│  │  - Multi-signature Threshold                         │   │
│  │  - Callback Execution                                │   │
│  └──────────────────┬───────────────────────────────────┘   │
└────────────────────┼─────────────────────────────────────────┘
                     │
                     └──────── Callback Response
                     ↓
              Smart Contract Updates
```

### Core Workflow

1. **Listing Creation**: Landlord submits encrypted property details with deposit
2. **Request Creation**: Tenant submits encrypted requirements with deposit
3. **Match Initiation**: Either party initiates match creation
4. **Gateway Decryption**: Contract requests decryption from Gateway oracle
5. **Callback Processing**: Oracle returns decrypted comparison results
6. **Confirmation**: Both parties confirm the validated match
7. **Settlement**: Deposits returned upon successful match or timeout

---

## Gateway Callback Pattern

### Architecture Pattern

The Gateway callback pattern implements an asynchronous workflow that separates encrypted computation from result processing:

```
User Action → Contract Records → Gateway Decrypts → Callback Completes
```

### Implementation Flow

#### Phase 1: Request Submission

```solidity
function createMatchWithGatewayCallback(uint256 _listingId, uint256 _requestId)
    external returns (uint256 matchId)
{
    // 1. Validate inputs
    // 2. Create preliminary match
    // 3. Request Gateway decryption
    // 4. Store decryption request with timeout
    // 5. Emit DecryptionRequested event
}
```

#### Phase 2: Decryption Request

```solidity
function _requestMatchDecryption(uint256 _matchId, ...)
    private returns (uint256 requestId)
{
    // 1. Prepare encrypted values for comparison
    // 2. Set timeout deadline
    // 3. Create DecryptionRequest struct
    // 4. Return request ID for tracking
}
```

#### Phase 3: Gateway Processing (Off-chain)

The Gateway oracle:
1. Monitors `DecryptionRequested` events
2. Decrypts ciphertexts using KMS threshold signatures
3. Compares decrypted values according to match criteria
4. Prepares callback transaction

#### Phase 4: Callback Execution

```solidity
function processMatchDecryptionCallback(
    uint256 _decryptRequestId,
    bool _priceMatches,
    bool _bedroomsMatch,
    bool _success
) external whenNotPaused
{
    // 1. Verify oracle authorization (production)
    // 2. Validate request hasn't timed out
    // 3. Process results:
    //    - Success → Update match status
    //    - Failure → Trigger refund mechanism
}
```

### Benefits

1. **Asynchronous Processing**: Non-blocking operations
2. **Gas Efficiency**: Heavy computation off-chain
3. **Privacy Preservation**: Minimal on-chain exposure
4. **Fault Tolerance**: Timeout protection for failures
5. **Scalability**: Handles multiple concurrent requests

---

## Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Input Validation                               │
│  - Price bounds (100 - 1,000,000)                       │
│  - Bedroom count (1-10)                                 │
│  - Property type (1-3)                                  │
│  - Deposit requirements (≥0.01 ETH)                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Access Control                                 │
│  - Owner-only functions                                 │
│  - Pauser role management                               │
│  - Entity ownership verification                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Rate Limiting                                  │
│  - 5-second cooldown between actions                    │
│  - Per-address tracking                                 │
│  - DoS attack prevention                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Overflow Protection                            │
│  - Solidity 0.8+ built-in checks                        │
│  - Maximum value constraints                            │
│  - Safe arithmetic operations                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 5: Reentrancy Protection                          │
│  - Checks-Effects-Interactions pattern                  │
│  - State updates before external calls                  │
│  - Refund claim tracking                                │
└─────────────────────────────────────────────────────────┘
```

### Access Control Matrix

| Function | Owner | Pauser | Landlord | Tenant | Anyone |
|----------|-------|--------|----------|--------|--------|
| `createListing` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `createRequest` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `createMatch` | ✓ | ✓ | Owner Only | Owner Only | ✗ |
| `confirmMatch` | ✓ | ✓ | Party Only | Party Only | ✗ |
| `deactivateListing` | ✓ | ✓ | Owner Only | ✗ | ✗ |
| `claimTimeoutRefund` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `addPauser` | Owner Only | ✗ | ✗ | ✗ | ✗ |
| `pause` | ✓ | Pauser Only | ✗ | ✗ | ✗ |
| `unpause` | Owner Only | ✗ | ✗ | ✗ | ✗ |

### Security Event Monitoring

All security-relevant actions emit events:

```solidity
event SecurityAlert(string alertType, address indexed user, string details);
event RefundIssued(uint256 indexed entityId, address indexed recipient, uint256 amount, string reason);
event DecryptionTimedOut(uint256 indexed requestId, uint256 indexed relatedEntityId, address refundRecipient);
```

---

## Privacy Protection Mechanisms

### 1. Price Obfuscation

**Problem**: Direct encrypted price comparisons can leak information through transaction patterns.

**Solution**: Random salt addition before encryption

```solidity
// Generate unique salt per listing/request
uint32 obfuscationSalt = uint32(
    uint256(keccak256(abi.encodePacked(
        block.timestamp,
        block.prevrandao,
        msg.sender,
        listingIdCounter
    ))) % PRICE_OBFUSCATION_RANGE
);

// Obfuscate price
uint32 obfuscatedPrice = _price + obfuscationSalt;
euint32 encryptedPrice = FHE.asEuint32(obfuscatedPrice);
```

**Privacy Guarantee**: Actual price hidden within range of ±50 units

### 2. Division Protection

**Problem**: Division operations can reveal information about numerator and denominator.

**Solution**: Use random multipliers before division

```solidity
// Instead of: result = a / b
// Use: result = (a * randomMultiplier) / (b * randomMultiplier)
```

This preserves the ratio while obscuring actual values.

### 3. Comparison Privacy

All comparisons performed on encrypted data:

```solidity
ebool priceMatch = FHE.le(listing.encryptedPrice, request.encryptedMaxBudget);
ebool bedroomMatch = FHE.ge(listing.encryptedBedrooms, request.encryptedMinBedrooms);
ebool typeMatch = FHE.eq(listing.encryptedPropertyType, request.encryptedPreferredPropertyType);
```

Results remain encrypted until Gateway decryption.

### 4. Minimal Information Leakage

**What is public**:
- Match existence (IDs only)
- Timestamp data
- Confirmation status

**What remains private**:
- Actual prices
- Property details
- Location specifics
- Preference data

---

## Refund and Timeout Systems

### Refund Mechanism Architecture

```
Trigger Conditions:
├─ Decryption Failure
├─ Match Validation Failure
├─ Timeout Expiration
└─ User Deactivation

         ↓

Refund Processing:
├─ Validate refund eligibility
├─ Mark refund as claimed (prevent double-claim)
├─ Calculate amounts
├─ Reset entity status
├─ Execute transfers
└─ Emit RefundIssued event
```

### Timeout Protection Levels

#### Level 1: Decryption Timeout

- **Duration**: 1 hour (`DECRYPTION_TIMEOUT`)
- **Trigger**: Gateway fails to respond
- **Action**: Automatic refund available after timeout
- **Claimant**: Anyone can trigger

```solidity
function claimTimeoutRefund(uint256 _decryptRequestId) external {
    require(block.timestamp > decryptRequest.timeout, "Not yet timed out");
    _issueMatchRefund(matchId, "Decryption timeout");
}
```

#### Level 2: Match Confirmation Timeout

- **Duration**: 7 days (`MATCH_TIMEOUT`)
- **Trigger**: Parties fail to confirm
- **Action**: Match expires, deposits refundable
- **Protection**: Prevents indefinite fund locks

#### Level 3: Rate Limit Cooldown

- **Duration**: 5 seconds (`RATE_LIMIT_COOLDOWN`)
- **Purpose**: DoS attack prevention
- **Scope**: Per-address tracking

### Refund Safety Guarantees

1. **Double-Claim Prevention**:
```solidity
mapping(uint256 => mapping(address => bool)) public refundClaimed;
require(!refundClaimed[_matchId][recipient], "Already refunded");
refundClaimed[_matchId][recipient] = true;
```

2. **State Consistency**:
- Update state before transfers
- Reset matched flags
- Clear deposits after transfer

3. **Transfer Safety**:
```solidity
(bool sent, ) = payable(recipient).call{value: amount}("");
require(sent, "Refund failed");
```

---

## Gas Optimization

### HCU (Homomorphic Computation Units) Analysis

| Operation | Gas Cost (estimated) | HCU Usage |
|-----------|---------------------|-----------|
| `FHE.asEuint32()` | ~50,000 | Low |
| `FHE.le()` (comparison) | ~200,000 | High |
| `FHE.eq()` (equality) | ~200,000 | High |
| `FHE.add()` | ~150,000 | Medium |
| `FHE.select()` | ~180,000 | Medium-High |

### Optimization Strategies

1. **Batch Operations**: Minimize FHE operations by batching
2. **Lazy Evaluation**: Delay expensive operations until necessary
3. **Off-chain Computation**: Use Gateway for heavy lifting
4. **Storage Optimization**: Pack structs efficiently

### Gas Estimates

**Per Match Creation**:
- Listing encryption: ~200,000 gas
- Request encryption: ~200,000 gas
- Match comparisons (4 ops): ~800,000 gas
- **Total**: ~1,200,000 gas

**Callback Processing**: ~100,000 gas

**Confirmation**: ~50,000 gas per party

---

## State Management

### State Machine: Match Lifecycle

```
                    ┌─────────────┐
                    │   Pending   │ (Initial state)
                    └──────┬──────┘
                           │
                           ├──── createMatchWithGatewayCallback()
                           ↓
                ┌──────────────────────┐
                │ DecryptionRequested  │
                └──────┬───────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    Success        Timeout        Failure
        │              │              │
        ↓              ↓              ↓
┌────────────────┐ ┌─────────┐ ┌─────────────┐
│ Decryption     │ │ Expired │ │ RefundIssued│
│ Completed      │ └─────────┘ └─────────────┘
└────────┬───────┘
         │
         ├──── confirmMatch() x2
         ↓
┌──────────────────┐
│ ConfirmedByBoth  │ (Final state)
└──────────────────┘
```

### State Transitions

| From State | Event | To State | Trigger |
|------------|-------|----------|---------|
| Pending | Decryption Request | DecryptionRequested | `createMatch()` |
| DecryptionRequested | Success Callback | DecryptionCompleted | Oracle callback |
| DecryptionRequested | Failure Callback | RefundIssued | Oracle callback |
| DecryptionRequested | Timeout | Expired | `claimTimeoutRefund()` |
| DecryptionCompleted | Both Confirm | ConfirmedByBoth | `confirmMatch()` |
| DecryptionCompleted | Timeout | Expired | Time expires |

---

## Error Handling

### Error Categories and Codes

#### Validation Errors (VALIDATION:)
```
VALIDATION: Price too low
VALIDATION: Price too high
VALIDATION: Invalid bedroom count
VALIDATION: Invalid property type
VALIDATION: Insufficient deposit
VALIDATION: Listing not active
VALIDATION: Request not active
VALIDATION: Already matched
VALIDATION: Not yet timed out
VALIDATION: Already fulfilled
```

#### Authorization Errors (AUTH:)
```
AUTH: Not authorized
AUTH: Not listing owner
AUTH: Not request owner
AUTH: Not a pauser
```

#### Rate Limiting Errors (RATE_LIMIT:)
```
RATE_LIMIT: Too many requests
```

#### Refund Errors (REFUND:)
```
REFUND: Landlord refund failed
REFUND: Tenant refund failed
REFUND: Deposit refund failed
```

#### Pause Errors (PAUSED:)
```
PAUSED: Contract is paused
```

### Error Recovery Strategies

1. **Transaction Failures**: Automatic rollback, state unchanged
2. **Decryption Failures**: Timeout triggers refund mechanism
3. **Oracle Failures**: Timeout protection ensures fund recovery
4. **Confirmation Failures**: Match expires, deposits returned

---

## Deployment Considerations

### Network Requirements

1. **FHE Support**: Network must support fhEVM operations
2. **Gateway Oracle**: Oracle service must be available
3. **Gas Limits**: Block gas limit ≥ 15,000,000

### Configuration Parameters

```typescript
const config = {
  pauserAddresses: ["0x..."], // Initial pausers
  kmsGeneration: 1,           // KMS version
  minDeposit: "0.01 ETH",     // Minimum deposit
  decryptionTimeout: 3600,    // 1 hour
  matchTimeout: 604800,       // 7 days
};
```

### Post-Deployment Checklist

- [ ] Verify contract on block explorer
- [ ] Configure Gateway oracle address
- [ ] Add additional pausers if needed
- [ ] Test listing creation
- [ ] Test request creation
- [ ] Test match flow end-to-end
- [ ] Monitor events for anomalies
- [ ] Set up emergency response procedures

---

## Monitoring and Maintenance

### Key Metrics to Track

1. **Transaction Metrics**:
   - Listings created
   - Requests created
   - Matches initiated
   - Matches confirmed
   - Refunds issued

2. **Performance Metrics**:
   - Average gas per operation
   - Decryption response time
   - Timeout frequency

3. **Security Metrics**:
   - Failed authorization attempts
   - Rate limit triggers
   - Emergency pauses
   - Refund patterns

### Alert Conditions

🚨 **Critical**:
- Emergency pause triggered
- Multiple timeout failures
- Oracle downtime > 1 hour

⚠️ **Warning**:
- High refund rate (> 10%)
- Unusual gas consumption
- Frequent rate limit hits

ℹ️ **Info**:
- New pausers added
- KMS generation updated
- Contract unpaused

---

## Future Enhancements

### Planned Features

1. **Multi-Currency Support**: Accept payments in various tokens
2. **Reputation System**: Track user reliability
3. **Dispute Resolution**: Arbitration mechanism
4. **Dynamic Pricing**: Market-based fee adjustments
5. **Advanced Matching**: ML-powered recommendations
6. **Cross-Chain**: Bridge to other networks

### Research Areas

1. **Zero-Knowledge Proofs**: Additional privacy layer
2. **Quantum Resistance**: Post-quantum cryptography
3. **Decentralized Oracle**: Replace centralized Gateway
4. **Layer 2 Integration**: Reduce gas costs

---

## Conclusion

The Enhanced Private Rental Matching Platform represents a comprehensive implementation of privacy-preserving smart contract architecture. By combining FHE technology with robust security measures, timeout protection, and automated refund mechanisms, the system provides a trustworthy foundation for confidential property matching.

For additional information, see:
- [API Documentation](./API.md)
- [Security Audit Guide](./SECURITY_AUDIT.md)
- [User Guide](./USER_GUIDE.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
