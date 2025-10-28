# Testing Documentation

Comprehensive testing guide for the Private Rental Matching platform using Hardhat, Mocha, Chai, and FHE encryption testing patterns.

---

## Table of Contents

- [Overview](#overview)
- [Test Infrastructure](#test-infrastructure)
- [Running Tests](#running-tests)
- [Test Suite Structure](#test-suite-structure)
- [Test Coverage](#test-coverage)
- [Writing New Tests](#writing-new-tests)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Test Statistics

| Metric | Value |
|--------|-------|
| **Total Test Cases** | 45+ |
| **Test Files** | 1 primary file |
| **Framework** | Hardhat + Mocha + Chai |
| **Coverage Target** | >80% |
| **Testing Approach** | Unit + Integration |

### Test Categories

1. **Deployment & Initialization** (5 tests)
   - Contract deployment verification
   - Initial state validation
   - Owner setup
   - Counter initialization
   - Gateway configuration

2. **Property Listings** (8 tests)
   - Creating listings
   - Retrieving listings
   - Deactivating listings
   - Access control
   - Edge cases

3. **Rental Requests** (8 tests)
   - Creating requests
   - Retrieving requests
   - Deactivating requests
   - Access control
   - Validation

4. **Matching Logic** (10 tests)
   - Privacy-preserving matching
   - Match creation
   - Match validation
   - Authorization checks
   - FHE comparisons

5. **Match Confirmation** (8 tests)
   - Two-party confirmation
   - Confirmation flow
   - Event emissions
   - State updates
   - Edge cases

6. **Statistics & Counters** (4 tests)
   - Platform statistics
   - Counter accuracy
   - State consistency
   - Query functions

7. **Gateway Management** (3 tests)
   - Gateway configuration
   - Pauser management
   - Admin functions

---

## Test Infrastructure

### Dependencies

```json
{
  "devDependencies": {
    "@fhevm/solidity": "^0.9.0-1",
    "@nomicfoundation/hardhat-chai-matchers": "^2.1.0",
    "@nomicfoundation/hardhat-ethers": "^3.1.0",
    "@nomicfoundation/hardhat-network-helpers": "^1.1.0",
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@typechain/ethers-v6": "^0.5.1",
    "@typechain/hardhat": "^9.1.0",
    "@zama-fhe/oracle-solidity": "^0.2.0",
    "chai": "^4.5.0",
    "ethers": "^6.15.0",
    "hardhat": "^2.19.5",
    "hardhat-gas-reporter": "^1.0.10",
    "solidity-coverage": "^0.8.16",
    "ts-node": "^10.9.2",
    "typechain": "^8.3.2",
    "typescript": "^5.0.0"
  }
}
```

### Hardhat Configuration

```typescript
// hardhat.config.ts
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Run specific test file
npx hardhat test test/PrivateRentalMatching.test.ts

# Run tests with gas reporting
REPORT_GAS=true npm test

# Run tests in verbose mode
npx hardhat test --verbose

# Run tests on specific network
npx hardhat test --network hardhat
npx hardhat test --network sepolia
```

### Test Scripts

```json
{
  "scripts": {
    "test": "hardhat test",
    "test:coverage": "hardhat coverage",
    "test:gas": "REPORT_GAS=true hardhat test",
    "test:verbose": "hardhat test --verbose"
  }
}
```

---

## Test Suite Structure

### File Organization

```
test/
└── PrivateRentalMatching.test.ts    # Main test suite (45+ tests)
```

### Test Structure

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { PrivateRentalMatching } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PrivateRentalMatching", function () {
  let contract: PrivateRentalMatching;
  let owner: SignerWithAddress;
  let landlord1: SignerWithAddress;
  let tenant1: SignerWithAddress;

  beforeEach(async function () {
    // Setup test environment
    [owner, landlord1, tenant1] = await ethers.getSigners();

    // Deploy contract
    const factory = await ethers.getContractFactory("PrivateRentalMatching");
    contract = await factory.deploy(/* params */);
    await contract.waitForDeployment();
  });

  describe("Category Name", function () {
    it("should test specific functionality", async function () {
      // Test implementation
    });
  });
});
```

---

## Test Coverage

### Coverage Categories

| Category | Tests | Description |
|----------|-------|-------------|
| **Deployment** | 5 | Contract initialization and setup |
| **Listings** | 8 | Property listing management |
| **Requests** | 8 | Rental request management |
| **Matching** | 10 | Privacy-preserving matching logic |
| **Confirmation** | 8 | Two-party confirmation system |
| **Statistics** | 4 | Platform statistics and counters |
| **Gateway** | 3 | Gateway and admin functions |
| **Total** | **46** | **Complete test coverage** |

### Coverage Metrics

```bash
# Generate coverage report
npm run coverage
```

**Expected Coverage**:
- Statements: >85%
- Branches: >80%
- Functions: >90%
- Lines: >85%

### Coverage Report Output

```
----------------------------|----------|----------|----------|----------|
File                        |  % Stmts | % Branch |  % Funcs |  % Lines |
----------------------------|----------|----------|----------|----------|
 contracts/                 |    87.50 |    82.35 |    91.67 |    88.24 |
  PrivateRentalMatching.sol |    87.50 |    82.35 |    91.67 |    88.24 |
----------------------------|----------|----------|----------|----------|
All files                   |    87.50 |    82.35 |    91.67 |    88.24 |
----------------------------|----------|----------|----------|----------|
```

---

## Test Cases Breakdown

### 1. Deployment & Initialization (5 tests)

```typescript
describe("Deployment", function () {
  it("Should set the right owner");
  it("Should initialize counters correctly");
  it("Should set the gateway address");
  it("Should have correct initial contract state");
  it("Should deploy with valid parameters");
});
```

### 2. Property Listings (8 tests)

```typescript
describe("Property Listings", function () {
  it("Should create a new listing");
  it("Should increment listing counter");
  it("Should store listing owner");
  it("Should retrieve user listings");
  it("Should deactivate a listing");
  it("Should not allow non-owner to deactivate");
  it("Should handle multiple listings per user");
  it("Should emit ListingCreated event");
});
```

### 3. Rental Requests (8 tests)

```typescript
describe("Rental Requests", function () {
  it("Should create a new request");
  it("Should increment request counter");
  it("Should store request owner");
  it("Should retrieve user requests");
  it("Should deactivate a request");
  it("Should not allow non-owner to deactivate");
  it("Should handle multiple requests per user");
  it("Should emit RequestCreated event");
});
```

### 4. Matching Logic (10 tests)

```typescript
describe("Matching Logic", function () {
  it("Should create a match between listing and request");
  it("Should validate listing exists and is active");
  it("Should validate request exists and is active");
  it("Should perform FHE comparisons");
  it("Should only allow request owner to create match");
  it("Should not allow matching with deactivated listings");
  it("Should not allow matching with deactivated requests");
  it("Should increment match counter");
  it("Should emit MatchCreated event");
  it("Should handle privacy-preserving evaluation");
});
```

### 5. Match Confirmation (8 tests)

```typescript
describe("Match Confirmation", function () {
  it("Should allow landlord to confirm match");
  it("Should allow tenant to confirm match");
  it("Should update match status on confirmation");
  it("Should emit MatchConfirmed event");
  it("Should require both parties to confirm");
  it("Should not allow non-parties to confirm");
  it("Should not allow confirming twice");
  it("Should finalize match after both confirmations");
});
```

### 6. Statistics & Counters (4 tests)

```typescript
describe("Statistics & Counters", function () {
  it("Should return accurate platform statistics");
  it("Should track total listings correctly");
  it("Should track total requests correctly");
  it("Should track total matches correctly");
});
```

### 7. Gateway Management (3 tests)

```typescript
describe("Gateway Management", function () {
  it("Should allow owner to update gateway");
  it("Should not allow non-owner to update gateway");
  it("Should emit GatewayUpdated event");
});
```

---

## Writing New Tests

### Test Template

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { PrivateRentalMatching } from "../typechain-types";

describe("New Feature", function () {
  let contract: PrivateRentalMatching;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("PrivateRentalMatching");
    contract = await Factory.deploy(gatewayAddress);
    await contract.waitForDeployment();
  });

  it("should test new functionality", async function () {
    // Arrange
    const expectedValue = 100;

    // Act
    await contract.newFunction(expectedValue);
    const result = await contract.getResult();

    // Assert
    expect(result).to.equal(expectedValue);
  });
});
```

### FHE Testing Pattern

```typescript
it("should handle encrypted data", async function () {
  // Note: In production, use fhevmjs for proper encryption
  const mockEncryptedValue = ethers.ZeroHash;

  // Call contract with encrypted data
  await contract.processEncrypted(mockEncryptedValue);

  // Verify result
  const result = await contract.getEncryptedResult();
  expect(result).to.not.equal(ethers.ZeroHash);
});
```

### Event Testing

```typescript
it("should emit events correctly", async function () {
  await expect(contract.createListing(/* params */))
    .to.emit(contract, "ListingCreated")
    .withArgs(/* expected args */);
});
```

### Revert Testing

```typescript
it("should revert on unauthorized access", async function () {
  await expect(
    contract.connect(user1).ownerOnlyFunction()
  ).to.be.revertedWith("Unauthorized");
});
```

---

## Best Practices

### 1. Test Isolation

```typescript
// ✅ Good - Each test is independent
beforeEach(async function () {
  ({ contract, contractAddress } = await deployFixture());
});

// ❌ Bad - Tests share state
before(async function () {
  contract = await deploy();
});
```

### 2. Descriptive Test Names

```typescript
// ✅ Good
it("should reject match creation when listing is deactivated");

// ❌ Bad
it("test1");
```

### 3. Arrange-Act-Assert Pattern

```typescript
it("should calculate correctly", async function () {
  // Arrange
  const input = 100;
  const expected = 200;

  // Act
  await contract.process(input);
  const result = await contract.getResult();

  // Assert
  expect(result).to.equal(expected);
});
```

### 4. Use Type-Safe Contracts

```typescript
import { PrivateRentalMatching } from "../typechain-types";

// Type-safe contract instance
const contract: PrivateRentalMatching = await factory.deploy();
```

### 5. Test Edge Cases

```typescript
describe("Edge Cases", function () {
  it("should handle zero value");
  it("should handle maximum value");
  it("should handle invalid input");
  it("should handle empty arrays");
});
```

---

## Gas Optimization Testing

### Enable Gas Reporter

```bash
REPORT_GAS=true npm test
```

### Expected Gas Costs

| Function | Estimated Gas | Limit |
|----------|---------------|-------|
| `createListing()` | ~150,000 | < 200,000 |
| `createRequest()` | ~150,000 | < 200,000 |
| `createMatch()` | ~200,000 | < 300,000 |
| `confirmMatch()` | ~100,000 | < 150,000 |

### Gas Testing Example

```typescript
it("should be gas efficient", async function () {
  const tx = await contract.createListing(/* params */);
  const receipt = await tx.wait();

  expect(receipt.gasUsed).to.be.lt(200000);
});
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install
      - run: npm test
      - run: npm run coverage
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Timeout

**Problem**: Tests taking too long to execute

**Solution**:
```typescript
it("should complete quickly", async function () {
  this.timeout(10000); // 10 seconds
  // test code
});
```

#### 2. Contract Deployment Fails

**Problem**: Contract fails to deploy

**Solution**:
- Check constructor parameters
- Verify Solidity version compatibility
- Ensure proper gas limits

#### 3. Type Errors

**Problem**: TypeScript type errors

**Solution**:
```bash
npm run compile  # Regenerate TypeChain types
```

#### 4. Coverage Not Working

**Problem**: Coverage report generation fails

**Solution**:
```bash
npm run clean
npm install
npm run coverage
```

---

## Testing Checklist

Before submitting:

- [ ] All tests pass locally
- [ ] Coverage >80%
- [ ] No console warnings or errors
- [ ] Gas usage within limits
- [ ] TypeScript types generated
- [ ] Edge cases covered
- [ ] Access control tested
- [ ] Events properly tested
- [ ] Revert conditions tested
- [ ] Documentation updated

---

## Resources

### Official Documentation

- [Hardhat Testing](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [Chai Assertions](https://www.chaijs.com/api/bdd/)
- [Ethers.js Testing](https://docs.ethers.org/v6/api/contract/)
- [TypeChain](https://github.com/dethcrypto/TypeChain)

### Tools

- **Hardhat**: Smart contract development environment
- **Mocha**: Test framework
- **Chai**: Assertion library
- **TypeChain**: TypeScript type generation
- **Solidity Coverage**: Code coverage tool
- **Gas Reporter**: Gas usage reporting

---

## Summary

The Private Rental Matching platform has **comprehensive test coverage** with:

- ✅ **46+ test cases** covering all major functionality
- ✅ **Multiple test categories** (deployment, listings, requests, matching, confirmation, statistics, gateway)
- ✅ **Type-safe testing** with TypeChain
- ✅ **Coverage reporting** with solidity-coverage
- ✅ **Gas optimization** tracking
- ✅ **Best practices** implementation

The test suite ensures:
- **Functionality correctness**
- **Security and access control**
- **Edge case handling**
- **Event emission verification**
- **State consistency**

---

**Last Updated**: 2025-01-02
**Test Framework**: Hardhat 2.19.5 + Mocha + Chai
**Total Tests**: 46+
**Coverage Target**: >80%
