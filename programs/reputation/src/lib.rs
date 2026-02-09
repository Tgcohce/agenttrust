use anchor_lang::prelude::*;

// Program ID - Replace with actual after deployment
const REPUTATION_PROGRAM_ID: &str = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS";

declare_id!(REPUTATION_PROGRAM_ID);

#[program]
pub mod reputation {
    use super::*;

    /// Initialize a new agent profile
    pub fn initialize_agent(
        ctx: Context<InitializeAgent>,
        agent_id: String,
        metadata_uri: Option<String>,
    ) -> Result<()> {
        let agent_profile = &mut ctx.accounts.agent_profile;
        
        require!(agent_id.len() <= 64, ErrorCode::AgentIdTooLong);
        
        agent_profile.owner = ctx.accounts.owner.key();
        agent_profile.agent_id = agent_id;
        agent_profile.reputation_score = 500; // Start at neutral 500/1000
        agent_profile.total_attestations = 0;
        agent_profile.positive_attestations = 0;
        agent_profile.tasks_completed = 0;
        agent_profile.tasks_failed = 0;
        agent_profile.metadata_uri = metadata_uri;
        agent_profile.created_at = Clock::get()?.unix_timestamp;
        agent_profile.bump = ctx.bumps.agent_profile;
        
        msg!("Agent profile created for: {}", agent_profile.agent_id);
        Ok(())
    }

    /// One agent attests to another's reputation (+/-)
    pub fn attest(
        ctx: Context<Attest>,
        rating: i8, // -100 to +100
        comment: Option<String>,
    ) -> Result<()> {
        require!(rating >= -100 && rating <= 100, ErrorCode::InvalidRating);
        
        let attestation = &mut ctx.accounts.attestation;
        let target_profile = &mut ctx.accounts.target_profile;
        
        // Prevent self-attestation
        require!(
            ctx.accounts.attester.key() != target_profile.owner,
            ErrorCode::SelfAttestation
        );
        
        attestation.attester = ctx.accounts.attester.key();
        attestation.target = target_profile.owner;
        attestation.rating = rating;
        attestation.comment = comment;
        attestation.created_at = Clock::get()?.unix_timestamp;
        attestation.bump = ctx.bumps.attestation;
        
        // Update target's reputation
        target_profile.total_attestations += 1;
        if rating > 0 {
            target_profile.positive_attestations += 1;
        }
        
        // Simple reputation calculation: base 500 + weighted attestations
        let reputation_delta = (rating as i32) * 2;
        target_profile.reputation_score = ((target_profile.reputation_score as i32) + reputation_delta)
            .clamp(0, 1000) as u16;
        
        msg!(
            "Attestation recorded: {} rated {} with {} points", 
            attestation.attester,
            target_profile.agent_id,
            rating
        );
        
        Ok(())
    }

    /// Record a completed task
    pub fn record_task(
        ctx: Context<RecordTask>,
        task_id: String,
        payment_amount: u64,
        success: bool,
    ) -> Result<()> {
        require!(task_id.len() <= 64, ErrorCode::TaskIdTooLong);
        
        let task_record = &mut ctx.accounts.task_record;
        let agent_profile = &mut ctx.accounts.agent_profile;
        
        task_record.task_id = task_id;
        task_record.agent = agent_profile.owner;
        task_record.client = ctx.accounts.client.key();
        task_record.payment_amount = payment_amount;
        task_record.success = success;
        task_record.created_at = Clock::get()?.unix_timestamp;
        task_record.bump = ctx.bumps.task_record;
        
        // Update agent stats
        if success {
            agent_profile.tasks_completed += 1;
            // Small reputation boost for successful task
            agent_profile.reputation_score = ((agent_profile.reputation_score as u32) + 5)
                .min(1000) as u16;
        } else {
            agent_profile.tasks_failed += 1;
            // Reputation penalty for failed task
            agent_profile.reputation_score = ((agent_profile.reputation_score as i32) - 10)
                .max(0) as u16;
        }
        
        msg!("Task recorded: {} - Success: {}", task_record.task_id, success);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(agent_id: String)]
pub struct InitializeAgent<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + AgentProfile::SIZE,
        seeds = [b"agent", agent_id.as_bytes(), owner.key().as_ref()],
        bump
    )]
    pub agent_profile: Account<'info, AgentProfile>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Attest<'info> {
    #[account(
        init,
        payer = attester,
        space = 8 + Attestation::SIZE,
        seeds = [
            b"attestation",
            attester.key().as_ref(),
            target_profile.owner.as_ref(),
            &target_profile.total_attestations.to_le_bytes()
        ],
        bump
    )]
    pub attestation: Account<'info, Attestation>,
    
    #[account(mut)]
    pub target_profile: Account<'info, AgentProfile>,
    
    #[account(mut)]
    pub attester: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct RecordTask<'info> {
    #[account(
        init,
        payer = client,
        space = 8 + TaskRecord::SIZE,
        seeds = [b"task", task_id.as_bytes(), agent_profile.owner.as_ref()],
        bump
    )]
    pub task_record: Account<'info, TaskRecord>,
    
    #[account(mut)]
    pub agent_profile: Account<'info, AgentProfile>,
    
    #[account(mut)]
    pub client: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
pub struct AgentProfile {
    pub owner: Pubkey,
    pub agent_id: String,          // Max 64 chars
    pub reputation_score: u16,     // 0-1000
    pub total_attestations: u32,
    pub positive_attestations: u32,
    pub tasks_completed: u32,
    pub tasks_failed: u32,
    pub metadata_uri: Option<String>,
    pub created_at: i64,
    pub bump: u8,
}

impl AgentProfile {
    pub const SIZE: usize = 32 + // owner
        4 + 64 + // agent_id (String)
        2 + // reputation_score
        4 + // total_attestations
        4 + // positive_attestations
        4 + // tasks_completed
        4 + // tasks_failed
        1 + 4 + 200 + // metadata_uri Option<String> (max 200 chars)
        8 + // created_at
        1; // bump
}

#[account]
pub struct Attestation {
    pub attester: Pubkey,
    pub target: Pubkey,
    pub rating: i8,
    pub comment: Option<String>,
    pub created_at: i64,
    pub bump: u8,
}

impl Attestation {
    pub const SIZE: usize = 32 + // attester
        32 + // target
        1 + // rating
        1 + 4 + 280 + // comment Option<String> (max 280 chars)
        8 + // created_at
        1; // bump
}

#[account]
pub struct TaskRecord {
    pub task_id: String,
    pub agent: Pubkey,
    pub client: Pubkey,
    pub payment_amount: u64,
    pub success: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl TaskRecord {
    pub const SIZE: usize = 4 + 64 + // task_id
        32 + // agent
        32 + // client
        8 + // payment_amount
        1 + // success
        8 + // created_at
        1; // bump
}

#[error_code]
pub enum ErrorCode {
    #[msg("Agent ID must be 64 characters or less")]
    AgentIdTooLong,
    #[msg("Task ID must be 64 characters or less")]
    TaskIdTooLong,
    #[msg("Rating must be between -100 and +100")]
    InvalidRating,
    #[msg("Agents cannot attest to themselves")]
    SelfAttestation,
}
