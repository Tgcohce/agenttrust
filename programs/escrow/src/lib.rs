use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

const ESCROW_PROGRAM_ID: &str = "HmbTLCmaGvZhKnn1ZfaCg8cCrtkS98niKa9DxbEkC6Jk";

declare_id!(ESCROW_PROGRAM_ID);

#[program]
pub mod escrow {
    use super::*;

    /// Create a new escrow for agent service payment
    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        escrow_id: String,
        amount: u64,
        release_after_seconds: i64,
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(escrow_id.len() <= 64, ErrorCode::EscrowIdTooLong);
        
        let escrow = &mut ctx.accounts.escrow_account;
        let clock = Clock::get()?;
        
        escrow.client = ctx.accounts.client.key();
        escrow.agent = ctx.accounts.agent.key();
        escrow.mint = ctx.accounts.mint.key();
        escrow.amount = amount;
        escrow.status = EscrowStatus::Pending;
        escrow.created_at = clock.unix_timestamp;
        escrow.release_at = clock.unix_timestamp + release_after_seconds;
        escrow.escrow_id = escrow_id;
        escrow.bump = ctx.bumps.escrow_account;
        
        // Transfer tokens from client to escrow
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.client_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.client.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, amount)?;
        
        msg!("Escrow created: {} for {} tokens", escrow.escrow_id, amount);
        Ok(())
    }

    /// Release funds to agent after service completion
    pub fn release_escrow(ctx: Context<ReleaseEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        let clock = Clock::get()?;
        
        require!(
            escrow.status == EscrowStatus::Pending,
            ErrorCode::EscrowNotPending
        );
        
        // Client can release early, or anyone can release after release_at
        if ctx.accounts.signer.key() != escrow.client {
            require!(
                clock.unix_timestamp >= escrow.release_at,
                ErrorCode::ReleaseTimeNotReached
            );
        }
        
        // Transfer from escrow to agent
        let seeds = &[
            b"escrow",
            escrow.escrow_id.as_bytes(),
            escrow.client.as_ref(),
            escrow.agent.as_ref(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.agent_token_account.to_account_info(),
            authority: ctx.accounts.escrow_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(cpi_ctx, escrow.amount)?;
        
        escrow.status = EscrowStatus::Released;
        
        msg!("Escrow released: {} to agent", escrow.escrow_id);
        Ok(())
    }

    /// Refund client if service not delivered
    pub fn refund_escrow(ctx: Context<RefundEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        let clock = Clock::get()?;
        
        require!(
            escrow.status == EscrowStatus::Pending,
            ErrorCode::EscrowNotPending
        );
        
        // Only client can request refund, and only after release time + dispute period
        require!(
            ctx.accounts.signer.key() == escrow.client,
            ErrorCode::Unauthorized
        );
        require!(
            clock.unix_timestamp >= escrow.release_at + 86400, // 24h dispute period
            ErrorCode::DisputePeriodActive
        );
        
        // Transfer back to client
        let seeds = &[
            b"escrow",
            escrow.escrow_id.as_bytes(),
            escrow.client.as_ref(),
            escrow.agent.as_ref(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.client_token_account.to_account_info(),
            authority: ctx.accounts.escrow_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(cpi_ctx, escrow.amount)?;
        
        escrow.status = EscrowStatus::Refunded;
        
        msg!("Escrow refunded: {} to client", escrow.escrow_id);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(escrow_id: String, amount: u64)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = client,
        space = 8 + EscrowAccount::SIZE,
        seeds = [
            b"escrow",
            escrow_id.as_bytes(),
            client.key().as_ref(),
            agent.key().as_ref()
        ],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    
    #[account(
        init,
        payer = client,
        seeds = [b"escrow_token", escrow_account.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = escrow_account,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub client: Signer<'info>,
    
    /// CHECK: Agent is just a pubkey, doesn't need to sign
    pub agent: AccountInfo<'info>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = client_token_account.owner == client.key(),
        constraint = client_token_account.mint == mint.key()
    )]
    pub client_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(
        mut,
        seeds = [
            b"escrow",
            escrow_account.escrow_id.as_bytes(),
            escrow_account.client.as_ref(),
            escrow_account.agent.as_ref()
        ],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    
    #[account(
        mut,
        seeds = [b"escrow_token", escrow_account.key().as_ref()],
        bump,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = agent_token_account.owner == escrow_account.agent,
        constraint = agent_token_account.mint == escrow_account.mint
    )]
    pub agent_token_account: Account<'info, TokenAccount>,
    
    pub signer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RefundEscrow<'info> {
    #[account(
        mut,
        seeds = [
            b"escrow",
            escrow_account.escrow_id.as_bytes(),
            escrow_account.client.as_ref(),
            escrow_account.agent.as_ref()
        ],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,
    
    #[account(
        mut,
        seeds = [b"escrow_token", escrow_account.key().as_ref()],
        bump,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = client_token_account.owner == escrow_account.client,
        constraint = client_token_account.mint == escrow_account.mint
    )]
    pub client_token_account: Account<'info, TokenAccount>,
    
    pub signer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct EscrowAccount {
    pub client: Pubkey,
    pub agent: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub status: EscrowStatus,
    pub created_at: i64,
    pub release_at: i64,
    pub escrow_id: String,
    pub bump: u8,
}

impl EscrowAccount {
    pub const SIZE: usize = 32 + // client
        32 + // agent
        32 + // mint
        8 + // amount
        1 + // status
        8 + // created_at
        8 + // release_at
        4 + 64 + // escrow_id
        1; // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum EscrowStatus {
    Pending,
    Released,
    Refunded,
}

impl Default for EscrowStatus {
    fn default() -> Self {
        EscrowStatus::Pending
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Escrow ID must be 64 characters or less")]
    EscrowIdTooLong,
    #[msg("Escrow is not in pending status")]
    EscrowNotPending,
    #[msg("Release time has not been reached")]
    ReleaseTimeNotReached,
    #[msg("Unauthorized operation")]
    Unauthorized,
    #[msg("Dispute period is still active")]
    DisputePeriodActive,
}
