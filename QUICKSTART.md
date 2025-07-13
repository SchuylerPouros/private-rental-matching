# Quick Start Guide

Get the Private Rental Matching platform running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js version (need >= 18)
node --version

# Check npm
npm --version

# Check you have a wallet with Sepolia ETH
# Get free Sepolia ETH: https://sepoliafaucet.com/
```

## Step 1: Clone & Install (1 minute)

```bash
cd private-rental-matching
npm install
```

## Step 2: Configure Environment (2 minutes)

```bash
# Copy environment template
cp .env.example .env

# Edit .env file - MINIMUM REQUIRED:
nano .env
```

Add these required values:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_here
GATEWAY_CONTRACT_ADDRESS=0xZAMA_GATEWAY_ADDRESS
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Step 3: Compile & Test (1 minute)

```bash
# Compile contracts
npm run compile

# Run tests (optional but recommended)
npm run test
```

## Step 4: Deploy Contract (30 seconds)

```bash
# Deploy to Sepolia testnet
npm run deploy

# Copy the deployed contract address from output
# Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

## Step 5: Update Frontend Config (30 seconds)

```bash
# Edit .env and add deployed contract address
nano .env
```

Add:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

## Step 6: Start Application (30 seconds)

```bash
# Start development server
npm run dev
```

Visit: http://localhost:3000

## 🎉 You're Done!

You should now see:
1. Beautiful landing page
2. "Connect Wallet" button
3. After connecting, you can:
   - Create property listings
   - Create rental requests
   - Match properties
   - Confirm matches

## Common Issues & Solutions

### "Insufficient funds"
**Solution**: Get Sepolia ETH from https://sepoliafaucet.com/

### "Cannot find module"
**Solution**: Run `npm install` again

### "Network error"
**Solution**: Check your RPC URL in .env

### "Contract not found"
**Solution**: Verify NEXT_PUBLIC_CONTRACT_ADDRESS in .env

### "Transaction failed"
**Solution**:
- Check you're on Sepolia network in MetaMask
- Ensure you have enough gas

## Test the Application

### Create a Test Listing

1. Connect wallet
2. Fill in "Create Property Listing" form:
   - Monthly Rent: `1500`
   - Bedrooms: `2`
   - Postal Code: `10001`
   - Property Type: `Apartment`
3. Click "Create Encrypted Listing"
4. Approve transaction in MetaMask

### Create a Test Request

1. Fill in "Create Rental Request" form:
   - Max Budget: `1800`
   - Min Bedrooms: `2`
   - Preferred Postal: `10001`
   - Property Type: `Apartment`
2. Click "Create Encrypted Request"
3. Approve transaction

### Create a Match

1. Note your listing ID (shows in "Your Activity")
2. Note a request ID you want to match
3. Enter both IDs in "Match Properties" section
4. Click "Create Match"
5. Both parties must confirm for final match

## Development Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Deploy to Sepolia
npm run deploy

# Start frontend development
npm run dev

# Build frontend for production
npm run build

# Start production server
npm start

# Interact with deployed contract (CLI)
npm run interact

# Setup gateway configuration
npm run setup-gateway
```

## Production Checklist

Before going to production:

- [ ] Security audit completed
- [ ] All tests passing
- [ ] Environment variables secured
- [ ] Frontend built and tested
- [ ] Contract verified on Etherscan
- [ ] Gateway properly configured
- [ ] Documentation reviewed
- [ ] Backup strategy in place
- [ ] Monitoring set up
- [ ] Legal compliance checked

## Next Steps

1. **Read Full Documentation**
   - [README.md](./README.md) - Overview
   - [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Detailed deployment
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - System design

2. **Explore the Code**
   - `contracts/` - Smart contracts
   - `test/` - Test suite
   - `app/` - Frontend components
   - `scripts/` - Utility scripts

3. **Customize**
   - Modify styles in `app/globals.css`
   - Add features in `contracts/`
   - Enhance UI in `app/components/`

4. **Deploy to Production**
   - Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   - Set up monitoring
   - Configure production environment

## Help & Support

- 📖 Check [README.md](./README.md) for details
- 🏗️ See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- 🚀 Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment
- 💬 Open GitHub issue for bugs
- 🌐 Visit [Zama Documentation](https://docs.zama.ai/fhevm)

## Troubleshooting

### Frontend won't start
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Contracts won't compile
```bash
rm -rf cache artifacts
npm run compile
```

### Tests failing
```bash
# Make sure you're on correct node version
node --version  # Should be >= 18

# Reinstall dependencies
rm -rf node_modules
npm install

# Run tests
npm test
```

---

**Happy Building! 🚀**

If you get stuck, check the full documentation or open an issue.
