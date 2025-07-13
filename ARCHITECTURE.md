# Architecture Documentation

## Overview

The Private Rental Matching platform is built with a modern, privacy-first architecture using Fully Homomorphic Encryption (FHE). This document explains the system design, components, and data flow.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js 14 + React + TypeScript + Tailwind CSS     │  │
│  │  - RainbowKit (Wallet Connection)                    │  │
│  │  - Wagmi (Ethereum Interactions)                     │  │
│  │  - fhEVM SDK (Encryption/Decryption)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Blockchain Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Ethereum Sepolia Testnet                            │  │
│  │  - PrivateRentalMatching.sol (Main Contract)         │  │
│  │  - Gateway Contract (FHE Operations)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Privacy Layer (Zama)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  - KMS (Key Management Service)                      │  │
│  │  - Coprocessor (FHE Computation)                     │  │
│  │  - Gateway (Decryption Orchestration)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Smart Contract Layer

#### PrivateRentalMatching.sol

The main contract handles:
- **Property Listings**: Encrypted property data storage
- **Rental Requests**: Encrypted tenant requirements
- **Matching Logic**: FHE-based compatibility checks
- **Confirmation System**: Two-party match approval

**Key Features**:
- Uses `euint32` and `euint8` for encrypted integers
- Automatic input re-randomization (sIND-CPAD security)
- Event-based decryption via Gateway
- Access control for data privacy

**State Variables**:
```solidity
mapping(uint256 => PropertyListing) public listings;
mapping(uint256 => RentalRequest) public requests;
mapping(uint256 => Match) public matches;
mapping(address => uint256[]) public userListings;
mapping(address => uint256[]) public userRequests;
```

### 2. Frontend Architecture

#### Technology Stack

- **Next.js 14**: App Router for server/client components
- **TypeScript**: Type safety across the application
- **Tailwind CSS**: Utility-first styling
- **RainbowKit**: Wallet connection UI
- **Wagmi**: React hooks for Ethereum
- **fhEVM SDK**: Client-side encryption

#### Component Structure

```
app/
├── layout.tsx          # Root layout
├── page.tsx            # Main page
├── providers.tsx       # Web3 providers
├── globals.css         # Global styles
└── components/
    ├── CreateListing.tsx      # Listing creation form
    ├── CreateRequest.tsx      # Request creation form
    ├── MatchMaker.tsx         # Matching interface
    ├── Statistics.tsx         # Platform stats
    └── UserActivity.tsx       # User's items
```

### 3. Data Flow

#### Creating a Listing (Encryption Flow)

```
1. User enters data (price, bedrooms, location, type)
   ↓
2. Frontend encrypts using fhEVM SDK
   ↓
3. Encrypted inputs sent to smart contract
   ↓
4. Contract stores encrypted data
   ↓
5. Contract emits ListingCreated event
   ↓
6. Frontend updates UI
```

#### Creating a Match (FHE Computation Flow)

```
1. User selects listing and request IDs
   ↓
2. Contract performs encrypted comparisons:
   - price <= maxBudget
   - bedrooms >= minBedrooms
   - propertyType == preferredType
   - postalCode == preferredPostal
   ↓
3. FHE operations execute without decryption
   ↓
4. All conditions must pass (encrypted AND)
   ↓
5. Match created if compatible
   ↓
6. Event emitted for both parties
```

#### Decryption Flow (New Gateway API)

```
1. User requests decryption of owned data
   ↓
2. Contract validates ownership
   ↓
3. Request sent to Gateway contract
   ↓
4. Gateway orchestrates KMS nodes
   ↓
5. Each KMS node:
   - Validates request
   - Computes encrypted share
   - Signs share
   - Emits individual event
   ↓
6. Frontend collects events
   ↓
7. Client combines shares to decrypt
```

## Security Architecture

### 1. Encryption Layer

**FHE Properties**:
- Operations on encrypted data
- No intermediate decryption
- Computation privacy preserved

**Encryption Types**:
- `euint8`: Small integers (1-255)
- `euint32`: Larger integers (up to 4.3B)
- `ebool`: Encrypted booleans

### 2. Access Control

```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Not authorized");
    _;
}

modifier onlyActiveListing(uint256 listingId) {
    require(listings[listingId].isActive, "Listing not active");
    require(listings[listingId].landlord == msg.sender, "Not listing owner");
    _;
}
```

### 3. Permission System

```solidity
// Allow contract to perform operations
FHE.allowThis(encryptedPrice);

// Allow user to decrypt their data
FHE.allow(encryptedPrice, msg.sender);
```

## Gateway Migration (Old vs New)

### Old Gateway API
```solidity
// Old: check* functions (reverts on failure)
gateway.checkPublicDecryptAllowed(...)

// Old: single pauser address
PAUSER_ADDRESS=0x...

// Old: on-chain aggregation
event DecryptionResult(bytes32 result)
```

### New Gateway API
```solidity
// New: is* functions (returns boolean)
gateway.isPublicDecryptAllowed(...)

// New: multiple pausers
NUM_PAUSERS=4
PAUSER_ADDRESS_0=0x...
PAUSER_ADDRESS_1=0x...

// New: event-based responses
event Decryption(uint256 indexed requestId, bytes share, bytes signature)
```

## Performance Considerations

### Gas Optimization

1. **Batch Operations**: Group multiple FHE ops where possible
2. **View Functions**: Use view functions for reads
3. **Event Indexing**: Emit events for off-chain indexing
4. **Storage Patterns**: Minimize storage writes

### Frontend Optimization

1. **Code Splitting**: Next.js automatic code splitting
2. **Image Optimization**: Next.js Image component
3. **Caching**: React Query for data caching
4. **Lazy Loading**: Components loaded on demand

## Scalability

### Current Limitations

- Sequential processing of FHE operations
- Gas costs for encrypted computations
- Decryption latency (multiple KMS nodes)

### Future Improvements

1. **Layer 2**: Deploy on L2 for lower gas costs
2. **Batching**: Batch match computations
3. **Indexing**: Use The Graph for event indexing
4. **Caching**: Cache decrypted results client-side

## Testing Strategy

### Unit Tests
- Individual function testing
- Edge case coverage
- Access control validation

### Integration Tests
- Full user flows
- Multi-party interactions
- Event emission verification

### End-to-End Tests
- Complete workflows
- Frontend + Contract integration
- Real wallet interactions

## Monitoring & Observability

### Contract Events

Monitor these events:
```solidity
event ListingCreated(uint256 indexed listingId, address indexed landlord);
event RequestCreated(uint256 indexed requestId, address indexed tenant);
event MatchCreated(uint256 indexed matchId, uint256 indexed listingId, uint256 indexed requestId);
event MatchConfirmed(uint256 indexed matchId, address indexed confirmer);
```

### Metrics to Track

- Total listings/requests created
- Match success rate
- Average confirmation time
- Gas costs per operation
- Decryption latency

### Tools

- **Etherscan**: Transaction explorer
- **Tenderly**: Contract monitoring
- **The Graph**: Event indexing
- **Vercel Analytics**: Frontend metrics

## Disaster Recovery

### Contract Upgrades

Since contract is not upgradeable:
1. Deploy new version
2. Migrate data off-chain
3. Update frontend
4. Notify users

### Data Backup

- Contract state backed up via events
- Frontend can reconstruct from events
- Regular snapshots recommended

## Future Architecture

### Planned Enhancements

1. **Messaging System**: Encrypted chat between matched parties
2. **Reputation System**: Privacy-preserving reviews
3. **Advanced Matching**: Machine learning on encrypted data
4. **Multi-Chain**: Support multiple networks
5. **Mobile App**: Native iOS/Android applications

### Research Areas

- Zero-knowledge proofs for verification
- Confidential compute for ML
- Cross-chain encrypted messaging
- Privacy-preserving analytics

---

This architecture provides a solid foundation for a privacy-preserving rental platform while maintaining security and scalability.
