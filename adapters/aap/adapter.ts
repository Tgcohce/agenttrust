import { Connection, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';

/**
 * AgentTrust <> AAP (Agent Agreement Protocol) Integration
 * 
 * Combines AAP's identity verification and agreement lifecycle
 * with AgentTrust's reputation scoring for intelligent agreements.
 */

export interface Agreement {
  id: string;
  agent: PublicKey;
  client: PublicKey;
  terms: string;
  paymentAmount: number;
  status: 'proposed' | 'signed' | 'fulfilled' | 'disputed';
}

export interface SmartAgreementConfig {
  minReputationScore: number;
  requireIdentityVerification: boolean;
  reputationWeightedTerms: boolean;
  autoRecordOnCompletion: boolean;
}

export class AAPAdapter {
  private connection: Connection;
  private agentTrustProgram: Program;
  private config: SmartAgreementConfig;

  constructor(
    connection: Connection,
    agentTrustProgram: Program,
    config: Partial<SmartAgreementConfig> = {}
  ) {
    this.connection = connection;
    this.agentTrustProgram = agentTrustProgram;
    this.config = {
      minReputationScore: 500,
      requireIdentityVerification: true,
      reputationWeightedTerms: true,
      autoRecordOnCompletion: true,
      ...config
    };
  }

  /**
   * Validate if agent can enter agreement based on reputation
   */
  async validateAgentForAgreement(
    agentAddress: PublicKey
  ): Promise<{
    allowed: boolean;
    reason?: string;
    reputationScore?: number;
    suggestedTerms?: any;
  }> {
    try {
      // Fetch reputation
      const [profilePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('agent'), agentAddress.toBuffer()],
        this.agentTrustProgram.programId
      );

      const profile = await this.agentTrustProgram.account.agentProfile.fetch(profilePDA);
      
      // Check minimum reputation
      if (profile.reputationScore < this.config.minReputationScore) {
        return {
          allowed: false,
          reason: `Reputation score ${profile.reputationScore} below minimum ${this.config.minReputationScore}`,
          reputationScore: profile.reputationScore
        };
      }

      // Check failure rate
      const totalTasks = profile.tasksCompleted + profile.tasksFailed;
      const failureRate = totalTasks > 0 ? profile.tasksFailed / totalTasks : 0;
      
      if (failureRate > 0.3) {
        return {
          allowed: false,
          reason: `High failure rate: ${(failureRate * 100).toFixed(1)}%`,
          reputationScore: profile.reputationScore
        };
      }

      // Calculate suggested terms based on reputation
      const suggestedTerms = this.calculateAgreementTerms(profile.reputationScore);

      return {
        allowed: true,
        reputationScore: profile.reputationScore,
        suggestedTerms
      };
    } catch (error) {
      // No profile found
      return {
        allowed: false,
        reason: 'Agent has no reputation profile',
        suggestedTerms: {
          collateralMultiplier: 2.0,
          requiresEscrow: true,
          paymentSchedule: 'milestone'
        }
      };
    }
  }

  /**
   * Calculate agreement terms based on reputation
   */
  private calculateAgreementTerms(reputationScore: number) {
    if (reputationScore >= 850) {
      return {
        collateralMultiplier: 0.5,
        requiresEscrow: false,
        paymentSchedule: 'completion',
        disputeWindow: 6
      };
    } else if (reputationScore >= 700) {
      return {
        collateralMultiplier: 0.75,
        requiresEscrow: true,
        paymentSchedule: 'completion',
        disputeWindow: 12
      };
    } else if (reputationScore >= 500) {
      return {
        collateralMultiplier: 1.0,
        requiresEscrow: true,
        paymentSchedule: 'milestone',
        disputeWindow: 24
      };
    } else {
      return {
        collateralMultiplier: 1.5,
        requiresEscrow: true,
        paymentSchedule: 'milestone',
        disputeWindow: 48
      };
    }
  }

  /**
   * On agreement fulfillment - record in AgentTrust
   * 
   * This would be called by AAP's fulfill_agreement instruction
   * via CPI to AgentTrust
   */
  async onAgreementFulfilled(
    agreement: Agreement,
    success: boolean
  ): Promise<string> {
    if (!this.config.autoRecordOnCompletion) {
      return 'Auto-recording disabled';
    }

    try {
      // Record task completion
      const tx = await this.agentTrustProgram.methods
        .recordTask(
          agreement.id,
          new (await import('@solana/web3.js')).BN(agreement.paymentAmount),
          success
        )
        .accounts({
          agentProfile: this.getProfilePDA(agreement.agent),
          client: agreement.client,
        })
        .rpc();

      // Auto-attest based on outcome
      if (success) {
        await this.agentTrustProgram.methods
          .attest(
            75,
            `Successfully completed agreement ${agreement.id}`
          )
          .accounts({
            targetProfile: this.getProfilePDA(agreement.agent),
            attester: agreement.client,
          })
          .rpc();
      } else {
        await this.agentTrustProgram.methods
          .attest(
            -25,
            `Failed to complete agreement ${agreement.id}`
          )
          .accounts({
            targetProfile: this.getProfilePDA(agreement.agent),
            attester: agreement.client,
          })
          .rpc();
      }

      return tx;
    } catch (error) {
      console.error('Failed to record agreement completion:', error);
      throw error;
    }
  }

  /**
   * Get reputation-weighted agreement template
   */
  async getAgreementTemplate(
    agentAddress: PublicKey
  ): Promise<{
    template: string;
    terms: any;
    estimatedTrust: string;
  }> {
    const validation = await this.validateAgentForAgreement(agentAddress);
    
    if (!validation.allowed) {
      return {
        template: 'HIGH_COLLATERAL_TEMPLATE',
        terms: validation.suggestedTerms,
        estimatedTrust: 'low'
      };
    }

    const score = validation.reputationScore!;
    
    if (score >= 850) {
      return {
        template: 'TRUSTED_AGENT_TEMPLATE',
        terms: validation.suggestedTerms,
        estimatedTrust: 'elite'
      };
    } else if (score >= 700) {
      return {
        template: 'STANDARD_TEMPLATE',
        terms: validation.suggestedTerms,
        estimatedTrust: 'high'
      };
    } else {
      return {
        template: 'PROTECTED_TEMPLATE',
        terms: validation.suggestedTerms,
        estimatedTrust: 'medium'
      };
    }
  }

  private getProfilePDA(agentAddress: PublicKey): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('agent'),
        Buffer.from('placeholder'),
        agentAddress.toBuffer(),
      ],
      this.agentTrustProgram.programId
    );
    return pda;
  }
}
