#!/bin/bash
# AgentTrust Quick Setup Script
# Run this to set up everything automatically

set -e

echo "🛡️  AgentTrust Protocol - Quick Setup"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the agenttrust directory"
    exit 1
fi

echo "${BLUE}Step 1: Installing dependencies...${NC}"
npm install
echo "${GREEN}✓ Dependencies installed${NC}"
echo ""

echo "${BLUE}Step 2: Setting up wallet...${NC}"
if [ ! -f "wallet.json" ]; then
    node generate-wallet.js
    echo "${GREEN}✓ New wallet created${NC}"
else
    echo "${YELLOW}⚠ Wallet already exists${NC}"
fi
echo ""

echo "${BLUE}Step 3: Installing frontend dependencies...${NC}"
cd app
npm install
cd ..
echo "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

echo "${BLUE}Step 4: Checking Anchor installation...${NC}"
if command -v anchor &> /dev/null; then
    echo "${GREEN}✓ Anchor CLI found: $(anchor --version)${NC}"
else
    echo "${YELLOW}⚠ Anchor CLI not found${NC}"
    echo "   To install: ${BLUE}cargo install --git https://github.com/coral-xyz/anchor avm && avm install latest && avm use latest${NC}"
fi
echo ""

echo "${BLUE}Step 5: Checking Solana CLI...${NC}"
if command -v solana &> /dev/null; then
    echo "${GREEN}✓ Solana CLI found: $(solana --version)${NC}"
    echo "   Current cluster: $(solana config get | grep "RPC URL" | awk '{print $3}')"
else
    echo "${YELLOW}⚠ Solana CLI not found${NC}"
    echo "   To install: ${BLUE}sh -c \"$(curl -sSfL https://release.solana.com/stable/install)\"${NC}"
fi
echo ""

echo "${BLUE}Step 6: Checking Rust...${NC}"
if command -v rustc &> /dev/null; then
    echo "${GREEN}✓ Rust found: $(rustc --version)${NC}"
else
    echo "${YELLOW}⚠ Rust not found${NC}"
    echo "   To install: ${BLUE}curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh${NC}"
fi
echo ""

echo "${GREEN}======================================${NC}"
echo "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "${BLUE}Next steps:${NC}"
echo "  1. Get devnet SOL: ${YELLOW}solana airdrop 2 $(node -e "console.log(JSON.parse(require('fs').readFileSync('./wallet.json')).publicKey)")${NC}"
echo "  2. Start frontend: ${YELLOW}cd app && npm start${NC}"
echo "  3. Build programs: ${YELLOW}anchor build${NC}"
echo "  4. Deploy:        ${YELLOW}anchor deploy --provider.cluster devnet${NC}"
echo ""
echo "${BLUE}Documentation:${NC}"
echo "  • Quick Start:  ${YELLOW}cat QUICKSTART.md${NC}"
echo "  • Full Docs:    ${YELLOW}cat README.md${NC}"
echo "  • For Agents:   ${YELLOW}cat AGENT_GUIDE.md${NC}"
echo ""
