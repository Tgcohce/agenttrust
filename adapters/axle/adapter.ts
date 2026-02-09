import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';

/**
 * AgentTrust <> AXLE Protocol Integration Adapter
 * 
 * This adapter combines AXLE's escrow infrastructure with AgentTrust's
 * reputation scoring to create reputation-weighted escrow terms.
 */

export interface ReputationScore {
  score: number;        // 0-1000
  tier: 'untrusted' | 'novice' | 'established' | 'trusted' | 'elite';
  attestations: number;
  tasksCompleted: number;
  failureRate: number;
}

export interface EscrowTerms {
  collateralMultiplier: number;    // 0.5 - 2.0
  releaseTimeReduction: number;    // 0 - 0.5 (percentage)
  disputeWindow: number;           // hours
  requiresVerification: boolean;
}

export class AxleAdapter {
  private connection: Connection;
  private agentTrustProgram: Program;
  private axleProgram: Program;
  
  // AXLE Program ID (from their forum post)
  private readonly AXLE_PROGRAM_ID = new PublicKey('4zr1KP5Rp4xrofrUWFjPqBjJKciNL2s8qXt4eFtc7M82');
  
  // Reputation tiers with corresponding escrow benefits
  private readonly REPUTATION_TIERS = {
    untrusted: {   // 0-299
      collateralMultiplier: 2.0,
      releaseTimeReduction: 0,
      disputeWindow: 72,
      requiresVerification: true
    },
    novice: {      // 300-499
      collateralMultiplier: 1.5,
      releaseTimeReduction: 0,
      disputeWindow: 48,
      requiresVerification: true
    },
    established: { // 500-699
      collateralMultiplier: 1.0,
      releaseTimeReduction: 0.25,
      disputeWindow: 24,
      requiresVerification: false
    },
    trusted: {     // 700-849
      collateralMultiplier: 0.75,
      releaseTimeReduction: 0.35,
      disputeWindow: 12,
      requiresVerification: false
    },
    elite: {       // 850-1000
      collateralMultiplier: 0.5,
      releaseTimeReduction: 0.5,
      disputeWindow: 6,
      requiresVerification: false
    }
  };

  constructor(
    connection: Connection,
    agentTrustProgram: Program,
    wallet: any
  ) {
    this.connection = connection;
    this.agentTrustProgram = agentTrustProgram;
    
    // Initialize AXLE program
    const provider = new AnchorProvider(connection, wallet, {});
    // Note: Would need AXLE's IDL for full integration
    // this.axleProgram = new Program(AXLE_IDL, this.AXLE_PROGRAM_ID, provider);
  }

  /**
   * Get agent reputation from AgentTrust
   */
  async getReputation(agentAddress: PublicKey): Promise<ReputationScore> {
    try {
      // Fetch agent profile PDA
      const [profilePDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('agent'),
          agentAddress.toBuffer(),
        ],
        this.agentTrustProgram.programId
      );

      const profile = await this.agentTrustProgram.account.agentProfile.fetch(profilePDA);
      
      // Calculate failure rate
      const totalTasks = profile.tasksCompleted + profile.tasksFailed;
      const failureRate = totalTasks > 0 ? profile.tasksFailed / totalTasks : 0;
      
      // Determine tier
      const score = profile.reputationScore;
      let tier: ReputationScore['tier'] = 'untrusted';
      if (score >= 850) tier = 'elite';
      else if (score >= 700) tier = 'trusted';
      else if (score >= 500) tier = 'established';
      else if (score >= 300) tier = 'novice';
      
      return {
        score,
        tier,
        attestations: profile.totalAttestations,
        tasksCompleted: profile.tasksCompleted,
        failureRate
      };
    } catch (error) {
      // Agent has no profile - return untrusted defaults
      return {
        score: 0,
        tier: 'untrusted',
        attestations: 0,
        tasksCompleted: 0,
        failureRate: 1.0
      };
    }
  }

  /**
   * Calculate escrow terms based on reputation
   */
  calculateTerms(reputation: ReputationScore): EscrowTerms {
    return this.REPUTATION_TIERS[reputation.tier];
  }

  /**
   * Create reputation-weighted escrow via AXLE
   * 
   * High-reputation agents get better terms:
   * - Lower collateral requirements
   * - Faster release times
   * - Shorter dispute windows
   */
  async createSmartEscrow(
    agentAddress: PublicKey,
    amount: number,
    baseReleaseTime: number,  // in seconds
    baseCollateral: number    // in lamports/tokens
  ): Promise<{
    escrowAddress: PublicKey;
    terms: EscrowTerms;
    actualCollateral: number;
    actualReleaseTime: number;
  }> {
    // Get agent reputation
    const reputation = await this.getReputation(agentAddress);
    const terms = this.calculateTerms(reputation);
    
    // Calculate adjusted terms
    const actualCollateral = Math.floor(baseCollateral * terms.collateralMultiplier);
    const actualReleaseTime = Math.floor(baseReleaseTime * (1 - terms.releaseTimeReduction));
    
    // TODO: Call AXLE's createEscrow with adjusted terms
    // This would be a CPI call to AXLE's program
    
    console.log(`Creating escrow for agent ${agentAddress.toString()}`);
    console.log(`Reputation: ${reputation.score}/1000 (${reputation.tier})`);
    console.log(`Collateral: ${baseCollateral} -> ${actualCollateral}`);
    console.log(`Release time: ${baseReleaseTime}s -> ${actualReleaseTime}s`);
    
    // Placeholder - would return actual escrow PDA
    return {
      escrowAddress: PublicKey.default, // Would be derived PDA
      terms,
      actualCollateral,
      actualReleaseTime
    };
  }

  /**
   * Auto-record task completion when AXLE escrow releases
   * 
   * This would be called as a CPI from AXLE's release_escrow instruction
   */
  async recordEscrowCompletion(
    agentAddress: PublicKey,
    clientAddress: PublicKey,
    escrowId: string,
    amount: number,
    success: boolean
  ): Promise<string> {
    // Record task in AgentTrust
    const tx = await this.agentTrustProgram.methods
      .recordTask(escrowId, new web3.BN(amount), success)
      .accounts({
        agentProfile: this.getProfilePDA(agentAddress),
        client: clientAddress,
      })
      .rpc();
    
    // If successful, auto-attest positive
    if (success) {
      await this.agentTrustProgram.methods
        .attest(50, `Completed escrow ${escrowId} successfully`)
        .accounts({
          targetProfile: this.getProfilePDA(agentAddress),
          attester: clientAddress,
        })
        .rpc();
    }
    
    return tx;
  }

  /**
   * Get profile PDA for an agent
   */
  private getProfilePDA(agentAddress: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('agent'),
        Buffer.from('placeholder'), // Would use actual agent_id
        agentAddress.toBuffer(),
      ],
      this.agentTrustProgram.programId
    );
    return pda;
  }

  /**
   * Batch check reputation for multiple agents
   * Useful for marketplaces comparing multiple agents
   */
  async batchGetReputations(
    agentAddresses: PublicKey[]
  ): Promise<Map<string, ReputationScore>> {
    const results = new Map();
    
    await Promise.all(
      agentAddresses.map(async (address) => {
        const rep = await this.getReputation(address);
        results.set(address.toString(), rep);
      })
    );
    
    return results;
  }

  /**
   * Get marketplace recommendations
   * Returns agents sorted by reputation
   */
  async getTrustedAgents(
    minScore: number = 700,
    limit: number = 10
  ): Promise<Array<{
    address: PublicKey;
    reputation: ReputationScore;
    terms: EscrowTerms;
  }>> {
    // This would query all agent profiles and filter/sort
    // Placeholder implementation
    const allProfiles = await this.agentTrustProgram.account.agentProfile.all();
    
    return allProfiles
      .filter(({ account }) => account.reputationScore >= minScore)
      .sort((a, b) => b.account.reputationScore - a.account.reputationScore)
      .slice(0, limit)
      .map(({ publicKey, account }) => {
        const reputation: ReputationScore = {
          score: account.reputationScore,
          tier: this.scoreToTier(account.reputationScore),
          attestations: account.totalAttestations,
          tasksCompleted: account.tasksCompleted,
          failureRate: account.tasksFailed / (account.tasksCompleted + account.tasksFailed) || 0
        };
        
        return {
          address: account.owner,
          reputation,
          terms: this.calculateTerms(reputation)
        };
      });
  }

  private scoreToTier(score: number): ReputationScore['tier'] {
    if (score >= 850) return 'elite';
    if (score >= 700) return 'trusted';
    if (score >= 500) return 'established';
    if (score >= 300) return 'novice';
    return 'untrusted';
  }
}

// Example usage
export async function example() {
  // Setup connection
  const connection = new Connection('https://api.devnet.solana.com');
  
  // Create adapter
  const adapter = new AxleAdapter(connection, null as any, null as any);
  
  // Check agent reputation
  const agentAddress = new PublicKey('...');
  const reputation = await adapter.getReputation(agentAddress);
  
  console.log(`Agent ${agentAddress.toString()}`);
  console.log(`Score: ${reputation.score}/1000`);
  console.log(`Tier: ${reputation.tier}`);
  
  // Create reputation-weighted escrow
  const escrow = await adapter.createSmartEscrow(
    agentAddress,
    1000000,      // 1 USDC
    86400,        // 24 hours base
    2000000       // 2 USDC base collateral
  );
  
  console.log(`Adjusted collateral: ${escrow.actualCollateral}`);
  console.log(`Adjusted release time: ${escrow.actualReleaseTime}s`);
}
