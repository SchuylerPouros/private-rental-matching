# 🏠 Private Rental Matching

Privacy-preserving property matching platform using Fully Homomorphic Encryption (FHE).

## 🌟 Features

- **🔒 Full Privacy**: All sensitive data encrypted with FHE
- **🏘️ Property Listings**: Landlords can create encrypted property listings
- **🔍 Rental Requests**: Tenants can create encrypted rental requests
- **🤝 Smart Matching**: Privacy-preserving matching without revealing data
- **📊 Statistics**: Platform-wide statistics tracking
- **👤 User Dashboard**: Track your listings and requests

## 🚀 Live Demo

Visit the live application: [GitHub Pages URL]

## 🛠️ Technology Stack

- **Frontend**: Pure HTML/CSS/JavaScript with Tailwind CSS
- **Blockchain**: Ethereum Sepolia Testnet
- **Smart Contracts**: Solidity with fhEVM (Zama)
- **Wallet Integration**: MetaMask via Ethers.js
- **Encryption**: Fully Homomorphic Encryption (FHE)

## 📦 Contract Information

- **Contract Address**: `0x980051585b6DC385159BD53B5C78eb7B91b848E5`
- **Network**: Sepolia Testnet
- **Chain ID**: 11155111

## 🎯 How to Use

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask connection
2. **Switch to Sepolia**: Ensure you're on Sepolia testnet
3. **Create Listing**: Fill in property details and submit
4. **Create Request**: Fill in your requirements and submit
5. **Match Properties**: Enter listing and request IDs to create a match

## 🔐 Privacy Features

All sensitive information is encrypted using FHE:
- Monthly rent prices
- Number of bedrooms
- Postal codes
- Property types

Only authorized parties can decrypt their own data.

## 📝 Smart Contract Functions

- `createListing(price, bedrooms, postalCode, propertyType)`: Create encrypted property listing
- `createRequest(budget, bedrooms, postalCode, propertyType)`: Create encrypted rental request
- `createMatch(listingId, requestId)`: Match a listing with a request
- `getPlatformStats()`: Get platform statistics
- `getUserListings(address)`: Get user's listings
- `getUserRequests(address)`: Get user's requests

## 🌐 Deployment

This is a static site that can be deployed to GitHub Pages:

1. Fork this repository
2. Go to Settings > Pages
3. Select "Deploy from a branch"
4. Choose `main` branch and `/public` folder
5. Save and wait for deployment

## 🔗 Links

- [Zama fhEVM Documentation](https://docs.zama.ai/fhevm)
- [Sepolia Testnet Explorer](https://sepolia.etherscan.io/)
- [Contract on Sepolia](https://sepolia.etherscan.io/address/0x980051585b6DC385159BD53B5C78eb7B91b848E5)

## 📄 License

MIT License - Built with ❤️ for privacy-preserving web3

---

Powered by [Zama's fhEVM](https://www.zama.ai/)
