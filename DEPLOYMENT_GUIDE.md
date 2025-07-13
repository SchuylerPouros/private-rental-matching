# Deployment Guide

This guide walks you through deploying the Private Rental Matching platform to Sepolia testnet.

## Prerequisites

1. **Wallet Setup**
   - MetaMask installed
   - Sepolia testnet configured
   - Test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

2. **API Keys**
   - Infura/Alchemy RPC URL
   - Etherscan API key (for verification)
   - WalletConnect Project ID

3. **Node Environment**
   - Node.js >= 18.0.0
   - npm or yarn

## Step 1: Environment Configuration

Create `.env` file from template:

```bash
cp .env.example .env
```

Configure the following variables:

```env
# Network RPC
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# Deployment wallet (NEVER commit this!)
PRIVATE_KEY=your_private_key_without_0x

# Etherscan for verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Gateway Configuration (New Gateway API)
NUM_PAUSERS=4
PAUSER_ADDRESS_0=0xKMS_NODE_1_ADDRESS
PAUSER_ADDRESS_1=0xKMS_NODE_2_ADDRESS
PAUSER_ADDRESS_2=0xCOPRO_NODE_1_ADDRESS
PAUSER_ADDRESS_3=0xCOPRO_NODE_2_ADDRESS

# Zama Gateway (use official Sepolia gateway)
GATEWAY_CONTRACT_ADDRESS=0xZAMA_GATEWAY_ADDRESS

# Frontend
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Compile Contracts

```bash
npm run compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

## Step 4: Run Tests

```bash
npm run test
```

Ensure all tests pass before deploying.

## Step 5: Deploy to Sepolia

```bash
npm run deploy
```

The deployment script will:
1. Deploy the PrivateRentalMatching contract
2. Save deployment info to `deployments/`
3. Attempt Etherscan verification (if API key provided)

Expected output:
```
====================================
Private Rental Matching Deployment
====================================

Deploying contracts with account: 0x...
Account balance: X.XX ETH

Gateway Address: 0x...
Deploying PrivateRentalMatching contract...
✅ PrivateRentalMatching deployed to: 0x...

Deployment Info:
================
Network: sepolia
Chain ID: 11155111
Contract Address: 0x...
Gateway Address: 0x...
Owner: 0x...
```

## Step 6: Update Frontend Configuration

Update `.env` with the deployed contract address:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xDEPLOYED_CONTRACT_ADDRESS
```

## Step 7: Verify Contract (Optional)

If automatic verification failed:

```bash
npx hardhat verify --network sepolia \
  DEPLOYED_CONTRACT_ADDRESS \
  GATEWAY_CONTRACT_ADDRESS
```

## Step 8: Setup Gateway (Production Only)

For production deployments with custom Gateway:

```bash
npm run setup-gateway
```

This validates your pauser configuration.

## Step 9: Build Frontend

```bash
npm run build
```

## Step 10: Start Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Test ETH in deployment wallet
- [ ] All tests passing
- [ ] Contract compiled successfully
- [ ] Gateway address configured
- [ ] Contract deployed to Sepolia
- [ ] Contract verified on Etherscan
- [ ] Frontend environment updated
- [ ] Application tested locally
- [ ] Documentation reviewed

## Testing the Deployment

1. Visit the application URL
2. Connect wallet (MetaMask on Sepolia)
3. Create a test listing
4. Create a test request
5. Attempt to create a match
6. Verify events on Etherscan

## Troubleshooting

### "Insufficient funds for gas"
- Ensure your wallet has enough Sepolia ETH
- Get more from [Sepolia Faucet](https://sepoliafaucet.com/)

### "Nonce too high"
- Reset MetaMask account: Settings → Advanced → Reset Account

### "Gateway address not set"
- Verify GATEWAY_CONTRACT_ADDRESS in .env
- Check Zama documentation for official Gateway address

### "Contract verification failed"
- Wait 30 seconds after deployment
- Manually verify using Etherscan UI
- Check constructor arguments match deployment

### "FHE operations failing"
- Verify Gateway configuration
- Check KMS and coprocessor are running
- Review pauser addresses

## Production Deployment

For mainnet deployment:

1. **Security Audit**: Get contract audited
2. **Gas Optimization**: Review gas costs
3. **Multi-sig**: Use multi-sig wallet for owner
4. **Monitoring**: Set up contract monitoring
5. **Documentation**: Update all docs
6. **Legal Review**: Ensure compliance

## Maintenance

### Updating the Contract

1. Make changes in a new contract version
2. Deploy new contract
3. Test thoroughly on testnet
4. Plan migration strategy
5. Deploy to mainnet
6. Update frontend to use new address

### Monitoring

Monitor contract events:
- `ListingCreated`
- `RequestCreated`
- `MatchCreated`
- `MatchConfirmed`

Use tools like:
- Etherscan for transaction history
- The Graph for event indexing
- Tenderly for monitoring and alerting

## Support

For deployment issues:
- Check Zama fhEVM documentation
- Open issue on GitHub
- Contact team via Discord

## Security Notes

⚠️ **IMPORTANT**:
- Never commit `.env` file
- Never share private keys
- Use hardware wallet for mainnet
- Enable 2FA on all accounts
- Regular security audits for production

---

Good luck with your deployment! 🚀
