# 🚀 GitHub Pages Deployment Guide

This guide will help you deploy the Private Rental Matching platform to GitHub Pages.

## 📋 Prerequisites

- GitHub account
- Git installed on your computer
- The `public` folder from this project

## 🔧 Step-by-Step Deployment

### 1. Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right and select "New repository"
3. Name your repository (e.g., `private-rental-matching`)
4. Choose "Public" visibility
5. **Do NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### 2. Prepare Your Files

The `public` folder contains everything needed:
```
public/
├── index.html          # Main application file
├── README.md           # Documentation
├── .nojekyll          # Tells GitHub Pages not to use Jekyll
└── DEPLOY.md          # This file
```

### 3. Initialize Git and Push

Open your terminal in the `public` folder and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Private Rental Matching on GitHub Pages"

# Add your GitHub repository as remote
# Replace YOUR_USERNAME and YOUR_REPO with your actual values
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Create and switch to main branch
git branch -M main

# Push to GitHub
git push -u origin main
```

### 4. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click "Save"

### 5. Wait for Deployment

- GitHub will automatically deploy your site
- This usually takes 1-3 minutes
- You'll see a message: "Your site is published at `https://YOUR_USERNAME.github.io/YOUR_REPO/`"

### 6. Access Your Site

Visit: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## 🔄 Updating Your Site

Whenever you make changes to your files:

```bash
# Add changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push
```

GitHub Pages will automatically redeploy (takes 1-3 minutes).

## ⚙️ Configuration

### Custom Domain (Optional)

1. Add a `CNAME` file to your repository with your domain:
   ```
   yourdomain.com
   ```

2. Configure DNS settings at your domain provider:
   - Type: `CNAME`
   - Name: `@` or `www`
   - Value: `YOUR_USERNAME.github.io`

3. In GitHub Settings > Pages, enter your custom domain

### Environment Variables

The contract address is hardcoded in `index.html`:
```javascript
const CONTRACT_ADDRESS = '0x980051585b6DC385159BD53B5C78eb7B91b848E5';
```

To update:
1. Edit `index.html`
2. Find `CONTRACT_ADDRESS` variable
3. Replace with your contract address
4. Commit and push changes

## 🐛 Troubleshooting

### Site Not Loading
- Check GitHub Pages is enabled in Settings
- Ensure you selected the correct branch and folder
- Wait 5-10 minutes for initial deployment
- Clear browser cache and try again

### 404 Error
- Verify `index.html` exists in the root
- Check branch name is correct
- Ensure `.nojekyll` file exists (prevents Jekyll processing)

### Contract Not Working
- Check MetaMask is installed
- Verify you're on Sepolia testnet
- Ensure contract address is correct
- Check browser console for errors (F12)

### Wallet Connection Issues
- Make sure MetaMask is unlocked
- Try refreshing the page
- Clear browser cache
- Check you have some Sepolia ETH

## 📱 Testing Locally

Before deploying, test locally:

```bash
# Using http-server (recommended)
npx http-server . -p 8080 -c-1 --cors

# Using Python 3
python -m http.server 8080

# Using Python 2
python -m SimpleHTTPServer 8080
```

Then visit `http://localhost:8080`

## 🔒 Security Notes

- Private keys never leave MetaMask
- All sensitive data encrypted with FHE
- Contract is immutable on blockchain
- No backend server needed
- Everything runs in browser

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [Zama fhEVM Docs](https://docs.zama.ai/fhevm)
- [Sepolia Testnet Faucet](https://sepoliafaucet.com/)

## 💡 Tips

1. **Always test locally first** before pushing to GitHub
2. **Use meaningful commit messages** for easier tracking
3. **Keep your README updated** with latest features
4. **Monitor contract on Sepolia Explorer** for activity
5. **Share the link** with users to test

## 🎉 Success!

Your privacy-preserving rental matching platform is now live on GitHub Pages!

Share your deployment:
```
🏠 Private Rental Matching
🔗 https://YOUR_USERNAME.github.io/YOUR_REPO/
🔒 Powered by Zama's fhEVM
```

---

Need help? Check the [README.md](README.md) or open an issue on GitHub.
