.PHONY: help setup build test deploy frontend clean docker-build docker-up docker-down

# Default target
help:
	@echo "AgentTrust Protocol - Make Commands"
	@echo "===================================="
	@echo ""
	@echo "Setup:"
	@echo "  make setup         - Run automated setup"
	@echo "  make wallet        - Generate new wallet"
	@echo ""
	@echo "Development:"
	@echo "  make build         - Build Anchor programs"
	@echo "  make test          - Run all tests"
	@echo "  make deploy        - Deploy to devnet"
	@echo "  make frontend      - Start frontend dev server"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build  - Build Docker images"
	@echo "  make docker-up     - Start Docker services"
	@echo "  make docker-down   - Stop Docker services"
	@echo ""
	@echo "Utilities:"
	@echo "  make fund          - Airdrop devnet SOL to wallet"
	@echo "  make balance       - Check wallet balance"
	@echo "  make clean         - Clean build artifacts"
	@echo ""

# Setup
setup:
	@chmod +x setup.sh
	@./setup.sh

wallet:
	@node generate-wallet.js

# Development
build:
	@anchor build

test:
	@anchor test

deploy:
	@anchor deploy --provider.cluster devnet

frontend:
	@cd app && npm start

# Docker
docker-build:
	@docker-compose build

docker-up:
	@docker-compose up -d

docker-down:
	@docker-compose down

# Utilities
fund:
	@export ADDR=$$(node -e "console.log(JSON.parse(require('fs').readFileSync('./wallet.json')).publicKey)") && \
	 solana airdrop 2 $$ADDR --url devnet && \
	 echo "Airdropped 2 SOL to $$ADDR"

balance:
	@export ADDR=$$(node -e "console.log(JSON.parse(require('fs').readFileSync('./wallet.json')).publicKey)") && \
	 echo "Wallet: $$ADDR" && \
	 solana balance $$ADDR --url devnet

clean:
	@anchor clean
	@rm -rf app/node_modules
	@rm -rf node_modules
	@echo "Cleaned build artifacts"

# Quick start
start: setup fund build frontend
