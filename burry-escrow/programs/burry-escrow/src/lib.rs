pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use instructions::{deposit::*, withdraw::*};



pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("5Wm5kTLkqUW5afvTdPr7w6wYJGrhggivmDNjcCQs4vk5");

#[program]
pub mod burry_escrow {
    use super::*;

    pub fn deposit(ctx: Context<Deposit>,escrow_amount: u64, unlock_price: f64) -> Result<()> {
        deposit_handler(ctx, escrow_amount, unlock_price)
    }

    pub fn withdraw(ctx: Context<Withdraw>) ->Result<()>{
        withdraw_handler(ctx)
    }

}
