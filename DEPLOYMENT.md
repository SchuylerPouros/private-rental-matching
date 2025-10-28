# Deployment Guide

Complete guide for deploying the Private Rental Matching platform on Ethereum Sepolia testnet.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Compilation](#compilation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Verification](#verification)
- [Interaction](#interaction)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Git**

### Required Accounts

1. **Ethereum Wallet**
   - Private key with Sepolia ETH
   - Get testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

2. **Etherscan API Key**
   - Create account at [Etherscan.io](https://etherscan.io/)
   - Generate API key from your account dashboard

3. **RPC Provider** (Optional but recommended)
   - [Alchemy](https://www.alchemy.com/)
   - [Infura](https://infura.io/)
   - Or use public RPC: `https://eth-sepolia.g.alchemy.com/v2/demo`

---

## Environment Setup

### 1. Clone and Install

```bash
# Navigate to project directory
cd private-rental-matching

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Network Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Deployment Account
PRIVATE_KEY=your_private_key_here

# Etherscan Verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Gateway Configuration (FHE)
NUM_PAUSERS=4
PAUSER_ADDRESS_0=0x0000000000000000000000000000000000000000
PAUSER_ADDRESS_1=0x0000000000000000000000000000000000000000
PAUSER_ADDRESS_2=0x0000000000000000000000000000000000000000
PAUSER_ADDRESS_3=0x0000000000000000000000000000000000000000

# Gas Settings (Optional)
REPORT_GAS=true
```

### 3. Security Best Practices

⚠️ **Important Security Notes:**

- **Never commit `.env` file** to version control
- Keep your private key secure
- Use a separate wallet for testnet deployments
- For production, use hardware wallets or secure key management

---

## Compilation

### Compile Smart Contracts

```bash
npm run compile
```

**Expected Output:**
```
Compiled 1 Solidity file successfully
```

### Verify Compilation

Check that artifacts were generated:

```bash
# Windows
dir artifacts\contracts\PrivateRentalMatching.sol

# Linux/Mac
ls artifacts/contracts/PrivateRentalMatching.sol
```

---

## Testing

### Run Test Suite

```bash
npm test
```

**Expected Output:**
```
  PrivateRentalMatching
    Deployment
      ✓ Should deploy with correct owner
      ✓ Should initialize counters to 1
      ✓ Should set gateway pausers correctly

    ... (38 tests total)

  38 passing
```

### Generate Coverage Report

```bash
npm run coverage
```

### Generate Gas Report

```bash
REPORT_GAS=true npm test
```

---

## Deployment

### Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

**Deployment Steps:**

1. **Pre-flight Check**
   - Validates network connection
   - Checks deployer balance
   - Verifies environment configuration

2. **Contract Deployment**
   - Deploys `PrivateRentalMatching.sol`
   - Initializes with Gateway pausers
   - Waits for confirmations

3. **Post-deployment**
   - Saves deployment information
   - Generates environment variable updates
   - Displays Etherscan link

**Expected Output:**

```
========================================
Private Rental Matching - Deployment Script
========================================

📋 Deployment Information:
------------------------------------------
Network Name: sepolia
Chain ID: 11155111
Deployer Address: 0x...
Deployer Balance: 0.5 ETH
------------------------------------------

🔐 Gateway Configuration:
------------------------------------------
Number of Pausers: 4
Pauser 0: 0x0000000000000000000000000000000000000000
...
------------------------------------------

🚀 Deploying PrivateRentalMatching contract...

✅ Contract Deployed Successfully!
==========================================
Contract Address: 0x980051585b6DC385159BD53B5C78eb7B91b848E5
==========================================

📋 Environment Variables to Update:
==========================================
CONTRACT_ADDRESS=0x980051585b6DC385159BD53B5C78eb7B91b848E5
NEXT_PUBLIC_CONTRACT_ADDRESS=0x980051585b6DC385159BD53B5C78eb7B91b848E5
==========================================

🔗 View on Etherscan:
https://sepolia.etherscan.io/address/0x980051585b6DC385159BD53B5C78eb7B91b848E5
```

### Update Environment Variables

After deployment, update `.env`:

```bash
CONTRACT_ADDRESS=0x980051585b6DC385159BD53B5C78eb7B91b848E5
NEXT_PUBLIC_CONTRACT_ADDRESS=0x980051585b6DC385159BD53B5C78eb7B91b848E5
```

---

## Verification

### Verify on Etherscan

```bash
npm run verify
```

**Verification Process:**

1. Loads deployment information
2. Submits contract source to Etherscan
3. Verifies constructor arguments
4. Updates deployment record

**Expected Output:**

```
========================================
Etherscan Contract Verification
========================================

📂 Loading deployment information...

📋 Deployment Details:
------------------------------------------
Contract Address: 0x980051585b6DC385159BD53B5C78eb7B91b848E5
------------------------------------------

🔍 Starting contract verification...

✅ Contract Verified Successfully!
==========================================

🔗 View Verified Contract:
https://sepolia.etherscan.io/address/0x980051585b6DC385159BD53B5C78eb7B91b848E5#code
```

### Manual Verification (Alternative)

If automatic verification fails:

1. Go to [Sepolia Etherscan](https://sepolia.etherscan.io/)
2. Navigate to your contract address
3. Click "Contract" → "Verify and Publish"
4. Select:
   - **Compiler Type:** Solidity (Single file)
   - **Compiler Version:** v0.8.24
   - **License:** MIT
5. Paste contract source code
6. Enter constructor arguments (ABI-encoded)

---

## Interaction

### Check Contract Status

```bash
npm run interact
```

**Available Interactions:**

1. Get Platform Statistics
2. Get User Listings
3. Get User Requests
4. Get Contract Owner
5. Check Listing Count
6. Check Request Count
7. Check Match Count

**Expected Output:**

```
========================================
Contract Interaction Script
========================================

📋 Connection Information:
------------------------------------------
Network: sepolia
Chain ID: 11155111
Signer Address: 0x...
Balance: 0.5 ETH
------------------------------------------

1️⃣  Fetching Platform Statistics...
------------------------------------------
Total Listings: 0
Total Requests: 0
Total Matches: 0
Confirmed Matches: 0
------------------------------------------
```

### Run Simulation

```bash
npm run simulate
```

This script demonstrates the complete workflow:
- Creating property listings
- Creating rental requests
- Privacy-preserving matching
- Two-party confirmation

---

## Deployment Information

### Network Details

| Property | Value |
|----------|-------|
| **Network** | Sepolia Testnet |
| **Chain ID** | 11155111 |
| **RPC URL** | https://eth-sepolia.g.alchemy.com/v2/demo |
| **Block Explorer** | https://sepolia.etherscan.io |

### Current Deployment

| Property | Value |
|----------|-------|
| **Contract** | PrivateRentalMatching |
| **Address** | `0x980051585b6DC385159BD53B5C78eb7B91b848E5` |
| **Compiler** | Solidity 0.8.24 |
| **Optimization** | Enabled (200 runs) |
| **License** | MIT |

### Etherscan Links

- **Contract Address:** [View on Etherscan](https://sepolia.etherscan.io/address/0x980051585b6DC385159BD53B5C78eb7B91b848E5)
- **Verified Code:** [View Code](https://sepolia.etherscan.io/address/0x980051585b6DC385159BD53B5C78eb7B91b848E5#code)
- **Read Contract:** [Read Functions](https://sepolia.etherscan.io/address/0x980051585b6DC385159BD53B5C78eb7B91b848E5#readContract)
- **Write Contract:** [Write Functions](https://sepolia.etherscan.io/address/0x980051585b6DC385159BD53B5C78eb7B91b848E5#writeContract)

---

## Available NPM Scripts

```bash
# Development
npm run dev              # Start Next.js development server
npm run build            # Build production frontend

# Smart Contracts
npm run compile          # Compile Solidity contracts
npm test                 # Run test suite
npm run clean            # Clean artifacts and cache

# Deployment
npm run deploy:sepolia   # Deploy to Sepolia testnet
npm run verify           # Verify on Etherscan
npm run interact         # Interact with deployed contract
npm run simulate         # Run simulation scenarios
```

---

## Troubleshooting

### Common Issues

#### 1. Insufficient Balance

**Error:** `sender doesn't have enough funds`

**Solution:**
- Get testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- Verify balance: `npm run interact`

#### 2. Invalid Private Key

**Error:** `invalid private key`

**Solution:**
- Ensure private key starts with `0x`
- Check for extra spaces in `.env`
- Verify key is 64 characters (excluding `0x`)

#### 3. RPC Connection Failed

**Error:** `could not detect network`

**Solution:**
- Check `SEPOLIA_RPC_URL` in `.env`
- Try alternative RPC providers:
  - Alchemy: `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`
  - Infura: `https://sepolia.infura.io/v3/YOUR_KEY`
  - Public: `https://rpc.sepolia.org`

#### 4. Verification Failed

**Error:** `Failed to verify contract`

**Solution:**
- Wait 1-2 minutes after deployment
- Ensure `ETHERSCAN_API_KEY` is set
- Try manual verification on Etherscan
- Check that contract is not already verified

#### 5. Compilation Errors

**Error:** `Compilation failed`

**Solution:**
```bash
npm run clean
npm install
npm run compile
```

### Getting Help

- **Documentation:** Check `/Documentation` folder
- **Issues:** Review error messages carefully
- **Community:** Ethereum Stack Exchange
- **Support:** Open GitHub issue with error details

---

## Security Checklist

Before deploying to production:

- [ ] Private key is secured (hardware wallet recommended)
- [ ] `.env` file is in `.gitignore`
- [ ] Contract has been audited
- [ ] Test coverage is adequate (>80%)
- [ ] Gateway pausers are configured correctly
- [ ] Emergency pause mechanism tested
- [ ] Access controls verified
- [ ] Gas optimizations reviewed
- [ ] Frontend security checked
- [ ] Monitoring and alerts set up

---

## Next Steps After Deployment

1. **Update Frontend Configuration**
   ```bash
   # Update app/config/contract.ts with new address
   ```

2. **Build and Deploy Frontend**
   ```bash
   npm run build
   # Deploy to hosting provider
   ```

3. **Monitor Contract**
   - Watch transactions on Etherscan
   - Set up event monitoring
   - Track gas usage

4. **Test End-to-End**
   - Create test listings
   - Create test requests
   - Verify matching works
   - Test confirmation flow

5. **Documentation**
   - Update README with deployment info
   - Document any configuration changes
   - Create user guides

---

## Resources

### Official Documentation

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Zama fhEVM Documentation](https://docs.zama.ai/fhevm)
- [Sepolia Testnet](https://sepolia.dev/)

### Tools

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Etherscan Sepolia](https://sepolia.etherscan.io/)
- [Alchemy](https://www.alchemy.com/)
- [Remix IDE](https://remix.ethereum.org/)

### Community

- [Ethereum Stack Exchange](https://ethereum.stackexchange.com/)
- [Hardhat Discord](https://hardhat.org/discord)
- [Zama Discord](https://discord.com/invite/zama)

---

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) file for details.

---

**Last Updated:** 2025-01-01
**Contract Version:** 2.0
**Network:** Sepolia Testnet
