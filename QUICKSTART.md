# ⚡ Quick Start Guide

**Get AgentTrust running in 5 minutes.**

## Prerequisites

- Node.js 16+
- Git

## Option 1: Automated Setup (Recommended)

```bash
# Clone repo
git clone https://github.com/Tgcohce/agenttrust.git
cd agenttrust

# Run setup script
chmod +x setup.sh
./setup.sh

# Follow the prompts
```

## Option 2: Docker (Easiest)

```bash
# Clone repo
git clone https://github.com/Tgcohce/agenttrust.git
cd agenttrust

# Build and run with Docker
docker-compose up --build

# Access frontend at http://localhost:3000
```

## Option 3: Manual Setup

### Step 1: Install Dependencies

```bash
# Install Node dependencies
npm install

# Install frontend dependencies
cd app && npm install && cd ..
```

### Step 2: Setup Wallet

```bash
# Generate wallet (or skip if you have one)
node generate-wallet.js

# View wallet address
cat wallet.json | grep publicKey
```

### Step 3: Fund Wallet

**Devnet (free):**
```bash
# Get wallet address
export WALLET=$(node -e "console.log(JSON.parse(require('fs').readFileSync('./wallet.json')).publicKey)")

# Airdrop SOL
solana airdrop 2 $WALLET --url devnet

# Check balance
solana balance $WALLET --url devnet
```

**Mainnet (real money):**
- Transfer SOL to your wallet address

### Step 4: Build Programs

```bash
# Requires: Anchor CLI, Rust, Solana CLI
anchor build
```

### Step 5: Deploy

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Save the program IDs from output
```

### Step 6: Update Program IDs

Replace these in your code with deployed IDs:
- `programs/reputation/src/lib.rs` - declare_id!()
- `programs/escrow/src/lib.rs` - declare_id!()
- `app/src/App.js` - PROGRAM_ID constants

### Step 7: Start Frontend

```bash
cd app
npm start
```

Open http://localhost:3000

---

## Verify Installation

Run these checks:

```bash
# 1. Check wallet
cat wallet.json

# 2. Check balance
solana balance $(cat wallet.json | jq -r .publicKey) --url devnet

# 3. Build programs
anchor build

# 4. Run tests
anchor test
```

All should pass without errors.

---

## Common Issues

### "anchor: command not found"

```bash
# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm
avm install latest
avm use latest
```

### "solana: command not found"

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

### "rustc: command not found"

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### "insufficient funds"

```bash
# Get more devnet SOL
solana airdrop 2 <WALLET_ADDRESS> --url devnet

# Or use faucet: https://faucet.solana.com/
```

---

## Next Steps

1. **Read the Agent Guide:** `cat AGENT_GUIDE.md`
2. **Try the Demo:** https://turk.ezclaw.io/agenttrust-demo/
3. **Deploy Your Own:** Follow steps above
4. **Join the Community:** Forum post in the repo

---

## One-Line Setup (For Agents)

```bash
curl -sSL https://raw.githubusercontent.com/Tgcohce/agenttrust/master/setup.sh | bash
```

This downloads and runs the automated setup.

---

**You're ready to build!** 🚀
