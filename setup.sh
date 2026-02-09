#!/bin/bash
# AgentTrust Protocol - One-Command Setup
# Usage: curl -sSL https://raw.githubusercontent.com/Tgcohce/agenttrust/master/setup.sh | bash

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[AgentTrust]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

log "🛡️  AgentTrust Protocol - Automated Setup"
echo "=========================================="
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM=Linux;;
    Darwin*)    PLATFORM=Mac;;
    CYGWIN*)    PLATFORM=Cygwin;;
    MINGW*)     PLATFORM=MinGw;;
    *)          PLATFORM="UNKNOWN:${OS}"
esac

log "Detected platform: $PLATFORM"

# Check if in git repo
if [ ! -d ".git" ]; then
    log "📥 Cloning repository..."
    git clone https://github.com/Tgcohce/agenttrust.git
    cd agenttrust
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    log "📦 Installing Node.js..."
    if [ "$PLATFORM" = "Linux" ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    elif [ "$PLATFORM" = "Mac" ]; then
        if command -v brew &> /dev/null; then
            brew install node
        else
            error "Please install Homebrew first: https://brew.sh"
        fi
    else
        error "Please install Node.js 20+ manually: https://nodejs.org"
    fi
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    error "Node.js 16+ required. Found: $(node --version)"
fi
success "Node.js $(node --version)"

# Install dependencies
log "📦 Installing dependencies..."
npm install --silent 2>&1 | grep -v "deprecated" || true
success "Dependencies installed"

# Setup wallet
if [ ! -f "wallet.json" ]; then
    log "🔑 Generating wallet..."
    node generate-wallet.js > /tmp/wallet_gen.log 2>&1
    success "Wallet created"
else
    warn "Wallet already exists"
fi

WALLET_ADDR=$(node -e "console.log(JSON.parse(require('fs').readFileSync('./wallet.json')).publicKey)")
log "Wallet: $WALLET_ADDR"

# Install frontend deps
cd app
npm install --silent 2>&1 | grep -v "deprecated" || true
cd ..
success "Frontend dependencies installed"

# Check Solana CLI
if ! command -v solana &> /dev/null; then
    log "📦 Installing Solana CLI..."
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
fi

SOLANA_VERSION=$(solana --version | awk '{print $2}')
success "Solana CLI $SOLANA_VERSION"

# Configure devnet
solana config set --url devnet --quiet

# Check Anchor
if ! command -v anchor &> /dev/null; then
    log "📦 Installing Anchor CLI..."
    if ! command -v cargo &> /dev/null; then
        log "📦 Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source $HOME/.cargo/env
    fi
    cargo install --git https://github.com/coral-xyz/anchor avm --quiet
    avm install 0.29.0 --quiet
    avm use 0.29.0 --quiet
fi

ANCHOR_VERSION=$(anchor --version | awk '{print $2}')
success "Anchor $ANCHOR_VERSION"

# Fund wallet
log "💰 Checking wallet balance..."
BALANCE=$(solana balance $WALLET_ADDR --url devnet 2>/dev/null | awk '{print $1}')
if (( $(echo "$BALANCE < 1" | bc -l) )); then
    log "Requesting airdrop..."
    solana airdrop 2 $WALLET_ADDR --url devnet --quiet || warn "Airdrop may have failed - you can retry later"
fi

# Show final status
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Wallet: $WALLET_ADDR"
echo "Balance: $(solana balance $WALLET_ADDR --url devnet 2>/dev/null || echo '0') SOL"
echo ""
echo -e "${BLUE}Quick Commands:${NC}"
echo "  make build      - Build programs"
echo "  make test       - Run tests"
echo "  make deploy     - Deploy to devnet"
echo "  make frontend   - Start frontend"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  cat QUICKSTART.md"
echo "  cat AGENT_GUIDE.md"
echo ""
