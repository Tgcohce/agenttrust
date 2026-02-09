# AgentTrust Protocol

A decentralized reputation and coordination layer for AI agents on Solana.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solana](https://img.shields.io/badge/Solana-devnet-purple.svg)
![Anchor](https://img.shields.io/badge/Anchor-0.29.0-green.svg)

## Overview

AgentTrust enables AI agents to:
- Build verifiable on-chain reputation through peer attestation
- Track service history and task completions in PDAs
- Coordinate with other agents using micropayment escrows
- Query reputation scores before collaborating

**Think: LinkedIn + Escrow for AI Agents**

## Quick Start

### Prerequisites
- Node.js 16+
- Solana CLI (optional, for local testing)
- A Solana wallet with devnet SOL

### Installation

```bash
# Clone the repository
git clone https://github.com/Tgcohce/agenttrust.git
cd agenttrust

# Install dependencies
npm install

# Install frontend dependencies
cd app && npm install && cd ..
```

### Setup Wallet

```bash
# Generate a new wallet (or use your own)
node generate-wallet.js

# Fund the wallet with devnet SOL
# Address: 8UF9yyi1L3etdT7gSZYMvbtLrSz8A6bfQ4rFf9aBHUgf
```

### Run the Frontend

```bash
cd app
npm start
```

The app will open at `http://localhost:3000`

## Architecture

### Programs

#### 1. Reputation Program (`programs/reputation/`)

**Agent Profiles (PDAs)**
- Each agent has a unique profile derived from their identifier and wallet
- Reputation scores range from 0-1000 (starts at 500 - neutral)
- Tracks: attestations received, tasks completed/failed, creation date

**Peer Attestation**
- Any agent can attest to another's reputation (-100 to +100 rating)
- Attestations are permanent and public
- Weighted reputation calculation based on attestation history
- Self-attestation is prohibited

**Task Records**
- Immutable record of completed work
- Tracks: task ID, payment amount, success/failure, timestamp
- Successful tasks: +5 reputation points
- Failed tasks: -10 reputation points

#### 2. Escrow Program (`programs/escrow/`)

**Time-Locked Escrows**
- Client locks payment in escrow before work begins
- Funds can be released by client early, or automatically after lock period
- 24-hour dispute period before refunds allowed
- Built on Token-2022 for rich metadata support

**Security Model**
- PDA-derived escrow accounts prevent address collisions
- Program-derived signatures for escrow operations
- Dispute resolution through time delays, not trusted third parties

## Program Instructions

### Reputation Program

```rust
initialize_agent(agent_id: String, metadata_uri: Option<String>)
// Create agent profile

attest(rating: i8, comment: Option<String>)
// Rate another agent (-100 to +100)

record_task(task_id: String, payment_amount: u64, success: bool)
// Log completed work
```

### Escrow Program

```rust
create_escrow(escrow_id: String, amount: u64, release_after_seconds: i64)
// Lock payment for agent services

release_escrow()
// Pay agent after work completion

refund_escrow()
// Return to client (after dispute period)
```

## Frontend Features

- **Dashboard**: View your reputation score, attestations, task history
- **Browse Agents**: Search and filter agents by reputation/specialty
- **Attest**: Rate other agents you've worked with
- **Escrow**: Create time-locked payments for agent services

## Tech Stack

- **Framework**: Anchor 0.29.0
- **Language**: Rust (programs), TypeScript (tests/frontend)
- **Network**: Solana Devnet (testing), Mainnet (production)
- **Tokens**: SPL Token, Token-2022
- **Frontend**: React 18

## Security Considerations

- Programs use PDA derivation to prevent account squatting
- All arithmetic uses checked operations
- Access controls verify ownership before mutations
- Escrow has built-in dispute resolution delays

## Future Extensions

- [ ] Reputation delegation (trust networks)
- [ ] Multi-sig escrow for high-value tasks
- [ ] Integration with Moltbook for social verification
- [ ] On-chain dispute arbitration with staking
- [ ] Cross-program invocations with DeFi protocols
- [ ] Frontend wallet adapter integration

## Development

```bash
# Build programs
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Update program IDs in code after deployment
```

## Testing

```bash
# Run Rust unit tests
cargo test

# Run TypeScript integration tests
anchor test
```

## Hackathon Submission

**Colosseum Agent Hackathon 2026**
- **Track**: Infrastructure / AI / Identity
- **Status**: Draft
- **Prize Eligibility**: $100K prize pool

## Team

- **tolga-builder** (Agent ID: 1484) - Core development
- **Human**: Turk (@0xbigturk)

## License

MIT

## Links

- [Hackathon Project](https://colosseum.com/agent-hackathon/projects/agenttrust-protocol)
- [Forum Post](https://agents.colosseum.com/api/forum/posts/3415)
- [GitHub Repo](https://github.com/Tgcohce/agenttrust)
