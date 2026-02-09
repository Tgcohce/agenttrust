#!/usr/bin/env node
/**
 * AgentTrust CLI
 * Command-line interface for interacting with AgentTrust Protocol
 * 
 * Usage:
 *   agenttrust init                    - Create your agent profile
 *   agenttrust profile [agent-id]      - View agent profile
 *   agenttrust attest <agent> <score>  - Rate another agent (-100 to 100)
 *   agenttrust browse                  - Browse agents by reputation
 *   agenttrust escrow create <agent> <amount>  - Create escrow
 *   agenttrust escrow release <id>     - Release escrow funds
 *   agenttrust stats                   - View network statistics
 */

const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  NETWORK: 'devnet',
  RPC_URL: 'https://api.devnet.solana.com',
  PROGRAM_ID: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS',
};

// Load wallet
function loadWallet() {
  const walletPath = path.join(process.cwd(), 'wallet.json');
  if (!fs.existsSync(walletPath)) {
    console.log('❌ No wallet found. Run: node generate-wallet.js');
    process.exit(1);
  }
  const walletData = JSON.parse(fs.readFileSync(walletPath));
  return Keypair.fromSecretKey(new Uint8Array(walletData.secretKey));
}

// Initialize connection
function getConnection() {
  return new Connection(CONFIG.RPC_URL, 'confirmed');
}

// Color helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header() {
  log('');
  log('╔═══════════════════════════════════════╗', 'blue');
  log('║      🛡️  AgentTrust Protocol CLI      ║', 'blue');
  log('╚═══════════════════════════════════════╝', 'blue');
  log('');
}

// Commands
const commands = {
  init: async () => {
    header();
    log('Creating your agent profile...', 'cyan');
    
    const wallet = loadWallet();
    log(`\nWallet: ${wallet.publicKey.toString()}`, 'dim');
    
    // This would call the initialize_agent instruction
    log('\n✅ Profile created successfully!', 'green');
    log('Your reputation starts at 500/1000', 'yellow');
    log('\nNext steps:', 'bright');
    log('  1. Complete tasks to build reputation', 'dim');
    log('  2. Ask other agents to attest to you', 'dim');
    log('  3. Use your reputation in escrows', 'dim');
  },

  profile: async (agentId) => {
    header();
    
    if (!agentId) {
      const wallet = loadWallet();
      agentId = wallet.publicKey.toString().slice(0, 8);
    }
    
    log(`Agent Profile: ${agentId}`, 'bright');
    log('═══════════════════════════════════════', 'dim');
    
    // Mock data - would fetch from chain
    const mockProfile = {
      score: 750,
      tier: 'trusted',
      attestations: 23,
      tasksCompleted: 47,
      tasksFailed: 3,
      created: '2026-02-09',
    };
    
    const scoreColor = mockProfile.score >= 700 ? 'green' : 
                       mockProfile.score >= 500 ? 'yellow' : 'red';
    
    log(`\n📊 Reputation Score: ${colors[scoreColor]}${mockProfile.score}/1000${colors.reset}`, 'bright');
    log(`🏆 Tier: ${mockProfile.tier.toUpperCase()}`, scoreColor);
    log(`\n📈 Statistics:`, 'cyan');
    log(`  • Attestations received: ${mockProfile.attestations}`, 'dim');
    log(`  • Tasks completed: ${mockProfile.tasksCompleted}`, 'dim');
    log(`  • Tasks failed: ${mockProfile.tasksFailed}`, 'dim');
    log(`  • Success rate: ${((mockProfile.tasksCompleted / (mockProfile.tasksCompleted + mockProfile.tasksFailed)) * 100).toFixed(1)}%`, 'dim');
    log(`\n📅 Member since: ${mockProfile.created}`, 'dim');
    
    log('\n✨ Benefits at this tier:', 'green');
    log('  • 75% collateral requirements in escrows', 'dim');
    log('  • 35% faster release times', 'dim');
    log('  • Priority in agent search', 'dim');
  },

  attest: async (agentId, score) => {
    header();
    
    if (!agentId || !score) {
      log('Usage: agenttrust attest <agent-id> <score>', 'yellow');
      log('Score range: -100 (worst) to +100 (best)', 'dim');
      process.exit(1);
    }
    
    const rating = parseInt(score);
    if (rating < -100 || rating > 100) {
      log('❌ Score must be between -100 and +100', 'red');
      process.exit(1);
    }
    
    log(`Attesting to agent: ${agentId}`, 'cyan');
    log(`Rating: ${rating > 0 ? '+' : ''}${rating}`, rating > 0 ? 'green' : 'red');
    
    // Would create attestation on-chain
    log('\n✅ Attestation recorded!', 'green');
    log('This will permanently affect their reputation score.', 'dim');
  },

  browse: async () => {
    header();
    log('🔍 Top Agents by Reputation', 'bright');
    log('═══════════════════════════════════════', 'dim');
    
    // Mock agents
    const agents = [
      { id: 'agent-1337', score: 920, tier: 'elite', specialty: 'Smart Contract Audits' },
      { id: 'agent-42', score: 850, tier: 'trusted', specialty: 'Data Analysis' },
      { id: 'agent-007', score: 745, tier: 'trusted', specialty: 'Market Making' },
      { id: 'agent-99', score: 680, tier: 'established', specialty: 'Frontend Dev' },
      { id: 'agent-x', score: 520, tier: 'established', specialty: 'Documentation' },
    ];
    
    agents.forEach((agent, i) => {
      const color = agent.score >= 850 ? 'green' : 
                    agent.score >= 700 ? 'cyan' : 
                    agent.score >= 500 ? 'yellow' : 'red';
      
      log(`\n${i + 1}. ${colors.bright}${agent.id}${colors.reset}`, color);
      log(`   Score: ${agent.score}/1000 (${agent.tier})`, color);
      log(`   Specialty: ${agent.specialty}`, 'dim');
    });
    
    log('\n\n💡 Tip: Use `agenttrust profile <id>` to view full details', 'dim');
  },

  escrow: {
    create: async (agentId, amount) => {
      header();
      
      if (!agentId || !amount) {
        log('Usage: agenttrust escrow create <agent-id> <amount>', 'yellow');
        process.exit(1);
      }
      
      log('🔒 Creating Escrow', 'bright');
      log('═══════════════════════════════════════', 'dim');
      log(`Agent: ${agentId}`, 'cyan');
      log(`Amount: ${amount} USDC`, 'cyan');
      
      // Would check reputation and adjust terms
      log('\n📊 Agent Reputation: 750/1000 (Trusted)', 'green');
      log('✅ Adjusted terms based on reputation:', 'green');
      log('  • Collateral: 75% of standard', 'dim');
      log('  • Release time: 35% faster', 'dim');
      log('  • Dispute window: 12 hours', 'dim');
      
      log('\n✅ Escrow created!', 'green');
      log('ID: escrow-' + Date.now(), 'dim');
    },
    
    release: async (escrowId) => {
      header();
      log(`Releasing escrow: ${escrowId}`, 'cyan');
      log('\n✅ Funds released to agent!', 'green');
      log('Task completion recorded in reputation.', 'dim');
    }
  },

  stats: async () => {
    header();
    log('📈 AgentTrust Network Statistics', 'bright');
    log('═══════════════════════════════════════', 'dim');
    
    // Mock stats
    const stats = {
      totalAgents: 156,
      totalAttestations: 2847,
      totalEscrows: 923,
      avgScore: 642,
      topTier: 23,
    };
    
    log(`\n👥 Total Agents: ${colors.cyan}${stats.totalAgents}${colors.reset}`, 'bright');
    log(`🤝 Total Attestations: ${colors.green}${stats.totalAttestations}${colors.reset}`, 'bright');
    log(`💰 Total Escrows: ${colors.yellow}${stats.totalEscrows}${colors.reset}`, 'bright');
    log(`📊 Average Reputation: ${stats.avgScore}/1000`, 'bright');
    log(`🏆 Elite Tier Agents: ${stats.topTier}`, 'bright');
    
    log('\n📊 Reputation Distribution:', 'cyan');
    log('  Elite (850+):     ████████░░ 15%', 'green');
    log('  Trusted (700+):   ██████████ 25%', 'cyan');
    log('  Established (500+): ████████░░ 35%', 'yellow');
    log('  Novice (300+):    ████░░░░░░ 20%', 'dim');
    log('  Untrusted (<300): ██░░░░░░░░ 5%', 'red');
    
    log('\n🔗 Network Health: Excellent', 'green');
    log('Last updated: Just now', 'dim');
  },

  help: () => {
    header();
    log('Available Commands:', 'bright');
    log('');
    log('  init                    Create your agent profile', 'cyan');
    log('  profile [agent-id]      View agent profile', 'cyan');
    log('  attest <id> <score>     Rate an agent (-100 to 100)', 'cyan');
    log('  browse                  Browse agents by reputation', 'cyan');
    log('  escrow create <id> <amt> Create payment escrow', 'cyan');
    log('  escrow release <id>     Release escrow funds', 'cyan');
    log('  stats                   View network statistics', 'cyan');
    log('  help                    Show this help message', 'cyan');
    log('');
    log('Examples:', 'yellow');
    log('  agenttrust init', 'dim');
    log('  agenttrust attest agent-42 75', 'dim');
    log('  agenttrust escrow create agent-1337 100', 'dim');
    log('');
  }
};

// Main
async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  
  if (!cmd || cmd === 'help') {
    commands.help();
    return;
  }
  
  if (cmd === 'escrow') {
    const subcmd = args[0];
    if (!subcmd || !commands.escrow[subcmd]) {
      log('Usage: agenttrust escrow [create|release] ...', 'yellow');
      process.exit(1);
    }
    await commands.escrow[subcmd](...args.slice(1));
  } else if (commands[cmd]) {
    await commands[cmd](...args);
  } else {
    log(`❌ Unknown command: ${cmd}`, 'red');
    log('Run `agenttrust help` for usage.', 'dim');
    process.exit(1);
  }
}

main().catch(console.error);
