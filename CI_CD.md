# CI/CD Pipeline Documentation

Comprehensive Continuous Integration and Continuous Deployment setup for the Private Rental Matching platform.

---

## Table of Contents

- [Overview](#overview)
- [GitHub Actions Workflows](#github-actions-workflows)
- [Code Quality Tools](#code-quality-tools)
- [Coverage Reporting](#coverage-reporting)
- [Local Development](#local-development)
- [Troubleshooting](#troubleshooting)

---

## Overview

### CI/CD Stack

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **GitHub Actions** | CI/CD Automation | `.github/workflows/test.yml` |
| **Solhint** | Solidity Linting | `.solhint.json` |
| **ESLint** | TypeScript Linting | `.eslintrc.yml` |
| **Prettier** | Code Formatting | `.prettierrc.yml` |
| **Codecov** | Coverage Reporting | `codecov.yml` |
| **Solidity Coverage** | Contract Coverage | `.solcover.js` |

### Automated Checks

✅ **Code Formatting** - Prettier
✅ **TypeScript Linting** - ESLint
✅ **Solidity Linting** - Solhint
✅ **Contract Compilation** - Hardhat
✅ **Test Execution** - Mocha + Chai
✅ **Coverage Generation** - Solidity Coverage
✅ **Security Audit** - npm audit
✅ **Build Verification** - Next.js build

---

## GitHub Actions Workflows

### Main Workflow (`.github/workflows/test.yml`)

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs**:

#### 1. Test on Node.js 18.x
```yaml
- Checkout code
- Setup Node.js 18.x
- Install dependencies (npm ci)
- Check code formatting
- Lint TypeScript
- Lint Solidity
- Compile contracts
- Run tests
- Generate coverage
- Upload to Codecov
```

#### 2. Test on Node.js 20.x
```yaml
- Checkout code
- Setup Node.js 20.x
- Install dependencies (npm ci)
- Check code formatting
- Lint TypeScript
- Lint Solidity
- Compile contracts
- Run tests
- Generate coverage
- Upload to Codecov
```

#### 3. Security Audit
```yaml
- Checkout code
- Setup Node.js 20.x
- Install dependencies
- Run npm audit (moderate level)
- Check production dependencies
```

#### 4. Build Verification
```yaml
- Checkout code
- Setup Node.js 20.x
- Install dependencies
- Build Next.js application
- Verify build artifacts
```

### Workflow Features

**Security**:
- Pinned action versions with SHA hashes
- Disabled credential persistence
- Read-only repository permissions

**Efficiency**:
- Parallel job execution
- NPM cache for faster builds
- Clean installs (`npm ci`)

**Reliability**:
- Multiple Node.js versions (18.x, 20.x)
- Comprehensive quality checks
- Automated coverage reporting

---

## Code Quality Tools

### 1. Solhint (Solidity Linter)

**Configuration**: `.solhint.json`

**Rules**:
- `code-complexity`: Max complexity 8
- `compiler-version`: >= 0.8.20
- `max-line-length`: 120 characters
- `func-visibility`: Required (ignores constructors)
- `named-parameters-mapping`: Warning
- `no-console`: Disabled
- `one-contract-per-file`: Warning

**Usage**:
```bash
# Lint Solidity files
npm run lint:sol

# Auto-fix issues
npm run lint:sol:fix
```

**Ignored**:
- `artifacts/`
- `node_modules/`
- `cache/`
- `coverage/`
- `typechain-types/`

---

### 2. ESLint (TypeScript Linter)

**Configuration**: `.eslintrc.yml`

**Extends**:
- `eslint:recommended`
- `@typescript-eslint/eslint-recommended`
- `@typescript-eslint/recommended`
- `prettier` (disables conflicting rules)

**Custom Rules**:
- `no-floating-promises`: Error (with exceptions)
- `no-inferrable-types`: Off
- `no-unused-vars`: Error (ignores `_` prefix)
- `no-console`: Warn (allows warn, error, info)

**Usage**:
```bash
# Lint TypeScript files
npm run lint

# Auto-fix issues
npm run lint:fix
```

**Ignored**:
- `node_modules/`
- `artifacts/`
- `typechain-types/`
- `.next/`
- `coverage/`

---

### 3. Prettier (Code Formatter)

**Configuration**: `.prettierrc.yml`

**Settings**:
- Print width: 120 characters
- Trailing comma: All
- End of line: LF

**Solidity Specific**:
- Compiler: 0.8.24
- Parser: solidity-parse
- Tab width: 4

**Usage**:
```bash
# Check formatting
npm run prettier:check

# Auto-format files
npm run prettier:write
```

**Supported Files**:
- `*.js`, `*.json`, `*.md`
- `*.sol`, `*.ts`, `*.tsx`
- `*.yml`

---

## Coverage Reporting

### Solidity Coverage

**Configuration**: `.solcover.js`

**Reporters**:
- HTML (interactive report)
- LCOV (for Codecov)
- Text (console output)
- JSON (programmatic access)

**Skipped Files**:
- `test/` directory
- `scripts/` directory

**Usage**:
```bash
# Generate coverage report
npm run coverage

# View HTML report
open coverage/index.html
```

### Codecov Integration

**Configuration**: `codecov.yml`

**Settings**:
- Precision: 2 decimal places
- Target: 70% coverage
- Threshold: 5% change tolerance

**Ignored**:
- `test/**/*`
- `scripts/**/*`
- `typechain-types/**/*`
- Config files

**Flags**:
- `unittests`: Tracks contract coverage

**Upload**:
- Automatic via GitHub Actions
- Requires `CODECOV_TOKEN` secret

---

## Local Development

### Setup

```bash
# Install dependencies
npm install

# Install additional CI/CD tools
npm install --save-dev \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-config-prettier \
  prettier \
  prettier-plugin-solidity \
  solhint
```

### Pre-Commit Checks

```bash
# Run all quality checks
npm run prettier:check
npm run lint
npm run lint:sol
npm run compile
npm test
```

### Manual Quality Check

```bash
# 1. Format code
npm run prettier:write

# 2. Lint and fix
npm run lint:fix
npm run lint:sol:fix

# 3. Compile
npm run compile

# 4. Test
npm test

# 5. Coverage
npm run coverage
```

---

## NPM Scripts

### Development

```bash
npm run dev              # Start Next.js dev server
npm run build            # Build Next.js app
npm start                # Start production server
```

### Code Quality

```bash
npm run lint             # Lint TypeScript
npm run lint:fix         # Lint and auto-fix TypeScript
npm run lint:sol         # Lint Solidity
npm run lint:sol:fix     # Lint and auto-fix Solidity
npm run prettier:check   # Check formatting
npm run prettier:write   # Auto-format code
```

### Smart Contracts

```bash
npm run compile          # Compile contracts
npm test                 # Run tests
npm run test:coverage    # Run tests with coverage
npm run coverage         # Generate coverage report
npm run clean            # Clean artifacts
npm run typechain        # Generate TypeScript types
```

### Deployment

```bash
npm run deploy:sepolia   # Deploy to Sepolia
npm run deploy:localhost # Deploy to localhost
npm run verify           # Verify on Etherscan
npm run interact         # Interact with contract
npm run simulate         # Run simulation
npm run node             # Start Hardhat node
```

---

## Workflow Triggers

### Automatic Triggers

**On Push**:
```
main branch      → Full CI/CD pipeline
develop branch   → Full CI/CD pipeline
```

**On Pull Request**:
```
→ main           → Full CI/CD pipeline
→ develop        → Full CI/CD pipeline
```

### Manual Triggers

Currently not configured. To add:

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to test'
        required: true
        default: 'development'
```

---

## CI/CD Pipeline Flow

```
┌─────────────┐
│   PR/Push   │
└──────┬──────┘
       │
       ├──────────────────────────────────┐
       │                                  │
┌──────▼────────┐                  ┌─────▼─────────┐
│  Node 18.x    │                  │  Node 20.x    │
│               │                  │               │
│ 1. Format ✓   │                  │ 1. Format ✓   │
│ 2. Lint TS ✓  │                  │ 2. Lint TS ✓  │
│ 3. Lint Sol ✓ │                  │ 3. Lint Sol ✓ │
│ 4. Compile ✓  │                  │ 4. Compile ✓  │
│ 5. Test ✓     │                  │ 5. Test ✓     │
│ 6. Coverage ✓ │                  │ 6. Coverage ✓ │
│ 7. Codecov ✓  │                  │ 7. Codecov ✓  │
└───────────────┘                  └───────────────┘
       │                                  │
       └──────────────┬───────────────────┘
                      │
           ┌──────────▼──────────┐
           │  Security Audit     │
           │                     │
           │  1. npm audit ✓     │
           │  2. Production ✓    │
           └──────────┬──────────┘
                      │
           ┌──────────▼──────────┐
           │  Build Check        │
           │                     │
           │  1. Next.js Build ✓ │
           │  2. Verify Output ✓ │
           └─────────────────────┘
```

---

## Troubleshooting

### Common Issues

#### 1. Prettier Check Fails

**Error**: `Code style issues found`

**Solution**:
```bash
npm run prettier:write
git add .
git commit -m "fix: format code"
```

#### 2. ESLint Errors

**Error**: `X problems (Y errors, Z warnings)`

**Solution**:
```bash
npm run lint:fix
# Review changes
git add .
git commit -m "fix: resolve linting issues"
```

#### 3. Solhint Warnings

**Error**: `Solhint found warnings`

**Solution**:
```bash
npm run lint:sol:fix
# Or manually fix issues in contracts
```

#### 4. Test Failures

**Error**: `X passing, Y failing`

**Solution**:
```bash
# Run tests locally
npm test

# Check specific test
npx hardhat test --grep "test name"

# Debug with console logs
# Add console.log() in tests
```

#### 5. Coverage Upload Fails

**Error**: `Codecov upload failed`

**Solution**:
- Ensure `CODECOV_TOKEN` secret is set
- Check `.codecov.yml` configuration
- Verify `coverage/lcov.info` exists

#### 6. Compilation Errors

**Error**: `HH Error: Compilation failed`

**Solution**:
```bash
npm run clean
npm run compile
```

---

## Security Best Practices

### 1. Action Version Pinning

✅ Uses SHA hashes for security:
```yaml
actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
```

### 2. Credential Protection

✅ Disables credential persistence:
```yaml
persist-credentials: false
```

### 3. Read-Only Permissions

✅ Minimal permissions:
```yaml
permissions:
  contents: read
```

### 4. Dependency Audit

✅ Automated security checks:
```bash
npm audit --audit-level=moderate
```

---

## Integration with GitHub

### Required Secrets

Add these secrets in GitHub repository settings:

1. **CODECOV_TOKEN**
   - Get from codecov.io
   - Settings → Secrets → Actions
   - New repository secret

### Branch Protection

Recommended settings:

```
Branch: main
✓ Require status checks before merging
  ✓ test-node-18
  ✓ test-node-20
  ✓ security-audit
  ✓ build-check
✓ Require branches to be up to date
✓ Require linear history
```

---

## Metrics & Monitoring

### Quality Metrics

**Coverage**:
- Target: >70%
- Current: Check Codecov dashboard

**Linting**:
- Zero tolerance for errors
- Warnings allowed with justification

**Tests**:
- 46 test cases
- 11 currently passing
- 35 require FHE setup

### CI/CD Metrics

**Build Time**:
- Node 18.x: ~3-5 minutes
- Node 20.x: ~3-5 minutes
- Security Audit: ~1 minute
- Build Check: ~2-3 minutes

**Success Rate**:
- Target: >95%
- Monitor via GitHub Actions tab

---

## Summary

### ✅ Implemented Features

1. **GitHub Actions Workflow**
   - Multi-version Node.js testing (18.x, 20.x)
   - Parallel job execution
   - Comprehensive quality checks

2. **Code Quality Tools**
   - Solhint for Solidity
   - ESLint for TypeScript
   - Prettier for formatting

3. **Coverage Reporting**
   - Solidity Coverage
   - Codecov integration
   - Multiple report formats

4. **Security**
   - Pinned action versions
   - Automated audits
   - Secure credential handling

5. **Build Verification**
   - Next.js build checks
   - Artifact validation

### 📋 Requirements Met

- ✅ `.github/workflows/` directory
- ✅ Automated testing on push/PR
- ✅ Code quality checks (Solhint, ESLint, Prettier)
- ✅ Codecov configuration
- ✅ Multiple Node.js versions (18.x, 20.x)
- ✅ Main and develop branch triggers

---

**Last Updated**: 2025-01-02
**CI/CD Framework**: GitHub Actions
**Code Quality**: Solhint + ESLint + Prettier
**Coverage**: Codecov + Solidity Coverage
