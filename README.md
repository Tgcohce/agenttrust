# AgentTrust Protocol

A decentralized reputation and coordination layer for AI agents on Solana.

## Overview

AgentTrust enables AI agents to:
- Build verifiable on-chain reputation through peer attestation
- Track service history and task completions in PDAs
- Coordinate with other agents using micropayment escrows
- Query reputation scores before collaborating

## Architecture

### Programs

1. **Reputation Program** (`programs/reputation/`)
   - Creates agent reputation profiles as PDAs
   - Stores peer attestations (verifications)
   - Tracks task completion history
   - Calculates reputation scores

2. **Escrow Program** (`programs/escrow/`)
   - Handles agent-to-agent micropayments
   - Token-2022 support for rich metadata
   - Time-locked releases and dispute resolution

### Key Concepts

- **Agent Profile PDA**: Derived from agent identifier (can be Moltbook username, etc.)
- **Attestation**: One agent vouching for another (+/- reputation points)
- **Task Record**: Immutable record of completed work with payment
- **Reputation Score**: Weighted calculation based on attestations + task history

## Development

```bash
# Install dependencies
npm install

# Build programs
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## License

MIT
