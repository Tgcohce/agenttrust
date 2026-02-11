import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';

// Configuration
const NETWORK = 'devnet';
const RPC_ENDPOINT = clusterApiUrl(NETWORK);

// Program IDs (will be updated after deployment)
export const REPUTATION_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
export const ESCROW_PROGRAM_ID = new PublicKey('HmbTLCmaGvZhKnn1ZfaCg8cCrtkS98niKa9DxbEkC6Jk');

// Initialize connection
export const connection = new Connection(RPC_ENDPOINT, 'confirmed');

/**
 * Fetch agent reputation from on-chain
 */
export async function getAgentReputation(agentPubkey: string): Promise<{
  score: number;
  attestations: number;
  tasksCompleted: number;
  tasksFailed: number;
  tier: string;
}> {
  try {
    const agentKey = new PublicKey(agentPubkey);
    
    // Derive PDA for agent profile
    const [profilePDA] = await PublicKey.findProgramAddress(
      [Buffer.from('agent'), agentKey.toBuffer()],
      REPUTATION_PROGRAM_ID
    );
    
    // Fetch account data
    const accountInfo = await connection.getAccountInfo(profilePDA);
    
    if (!accountInfo) {
      // Agent not yet registered
      return {
        score: 500,
        attestations: 0,
        tasksCompleted: 0,
        tasksFailed: 0,
        tier: 'Established'
      };
    }
    
    // Parse account data (simplified - actual parsing depends on your program structure)
    const data = accountInfo.data;
    
    // Assuming layout: score(i32), attestations(u32), completed(u32), failed(u32)
    const score = data.readInt32LE(8); // Skip discriminator
    const attestations = data.readUInt32LE(12);
    const tasksCompleted = data.readUInt32LE(16);
    const tasksFailed = data.readUInt32LE(20);
    
    const tier = getTier(score);
    
    return {
      score,
      attestations,
      tasksCompleted,
      tasksFailed,
      tier
    };
  } catch (error) {
    console.error('Error fetching reputation:', error);
    // Return default values on error
    return {
      score: 500,
      attestations: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      tier: 'Established'
    };
  }
}

/**
 * Fetch all agents from on-chain (for marketplace)
 */
export async function getAllAgents(limit: number = 20): Promise<Array<{
  pubkey: string;
  score: number;
  tier: string;
}>> {
  try {
    // Get all program accounts with agent profile discriminator
    const accounts = await connection.getProgramAccounts(REPUTATION_PROGRAM_ID, {
      filters: [
        {
          dataSize: 100 // Approximate size of AgentProfile account
        }
      ]
    });
    
    const agents = accounts.slice(0, limit).map(account => {
      const data = account.account.data;
      const score = data.readInt32LE(8);
      
      return {
        pubkey: account.pubkey.toString(),
        score,
        tier: getTier(score)
      };
    });
    
    // Sort by score descending
    agents.sort((a, b) => b.score - a.score);
    
    return agents;
  } catch (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
}

/**
 * Calculate escrow collateral based on reputation
 */
export function calculateCollateral(amount: number, reputation: number): {
  baseCollateral: number;
  discount: number;
  finalCollateral: number;
  multiplier: number;
} {
  const baseCollateral = amount * 2;
  
  let multiplier = 1.0;
  if (reputation >= 850) {
    multiplier = 0.5;
  } else if (reputation >= 700) {
    multiplier = 0.75;
  }
  
  const finalCollateral = Math.floor(baseCollateral * multiplier);
  const discount = Math.floor((1 - multiplier) * 100);
  
  return {
    baseCollateral,
    discount,
    finalCollateral,
    multiplier
  };
}

/**
 * Get tier name from score
 */
export function getTier(score: number): string {
  if (score >= 850) return 'Elite';
  if (score >= 700) return 'Trusted';
  if (score >= 500) return 'Established';
  if (score >= 300) return 'Novice';
  return 'Unverified';
}

/**
 * Get tier color
 */
export function getTierColor(score: number): string {
  if (score >= 850) return '#4ade80';
  if (score >= 700) return '#22d3ee';
  if (score >= 500) return '#667eea';
  if (score >= 300) return '#fbbf24';
  return '#888';
}

/**
 * Format public key for display
 */
export function formatPubkey(pubkey: string): string {
  if (pubkey.length < 12) return pubkey;
  return `${pubkey.slice(0, 6)}...${pubkey.slice(-4)}`;
}

/**
 * Subscribe to reputation updates
 */
export function subscribeToReputation(
  agentPubkey: string,
  callback: (reputation: any) => void
): number {
  const agentKey = new PublicKey(agentPubkey);
  
  PublicKey.findProgramAddress(
    [Buffer.from('agent'), agentKey.toBuffer()],
    REPUTATION_PROGRAM_ID
  ).then(([profilePDA]) => {
    return connection.onAccountChange(profilePDA, (accountInfo) => {
      if (accountInfo) {
        const data = accountInfo.data;
        const score = data.readInt32LE(8);
        const attestations = data.readUInt32LE(12);
        const tasksCompleted = data.readUInt32LE(16);
        const tasksFailed = data.readUInt32LE(20);
        
        callback({
          score,
          attestations,
          tasksCompleted,
          tasksFailed,
          tier: getTier(score)
        });
      }
    });
  });
  
  return 0; // Return subscription ID
}

export default {
  getAgentReputation,
  getAllAgents,
  calculateCollateral,
  getTier,
  getTierColor,
  formatPubkey,
  subscribeToReputation,
  connection,
  REPUTATION_PROGRAM_ID,
  ESCROW_PROGRAM_ID
};
