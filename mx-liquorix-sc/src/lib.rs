//! # XOXNO Leveraged Staking Smart Contract
//!
//! This smart contract enables leveraged liquid staking on the MultiversX blockchain
//! by integrating with XOXNO's liquid staking and lending protocols.
//!
//! ## Features
//! - Deposit EGLD or xEGLD to participate in leveraged staking
//! - Automated position management through bot operations
//! - Share-based accounting for fair profit distribution
//!
//! ## Modules
//! - `bot` - Automated leverage/deleverage operations
//! - `vault` - User deposit and withdrawal functionality
//! - `system` - Administrative and utility functions
//! - `xoxno` - Integration with XOXNO protocols

#![no_std]
#![allow(clippy::too_many_arguments)]

use multiversx_sc::imports::*;

use crate::constants::{DEFAULT_INACTION_ZONE_BPS, DEFAULT_SAFE_THRESHOLD_BPS, WAD_PRECISION};

pub mod bot;
pub mod constants;
pub mod errors;
pub mod proxies;
pub mod structs;
pub mod system;
pub mod vault;
pub mod xoxno;

/// Main smart contract trait that combines all module functionalities.
///
/// This contract enables users to participate in leveraged liquid staking
/// by depositing EGLD or xEGLD tokens.
#[multiversx_sc::contract]
pub trait Liquorix:
    system::manage::ManageModule
    + system::admins::AdminsModule
    + system::pause::PauseModule
    + vault::VaultModule
    + xoxno::liquid_staking::LiquidStakingModule
    + xoxno::lending::LendingModule
    + xoxno::swap_router::SwapRouterModule
    + bot::BotModule
    + system::utils::UtilsModule
    + system::storage::StorageModule
    + system::attributes::AttributesModule
{
    /// Initializes the smart contract with required configuration.
    ///
    /// # Arguments
    /// - `supplied_token` - Token identifier for collateral (e.g., xEGLD)
    /// - `borrowed_token` - Token identifier for borrowing (e.g., EGLD)
    /// - `lending_position_token` - NFT token for tracking lending positions
    /// - `liquid_staking_address` - Address of the XOXNO liquid staking contract
    /// - `lending_address` - Address of the XOXNO lending controller contract
    /// - `bot_address` - Address authorized to execute leverage operations
    #[init]
    fn init(
        &self,
        supplied_token: EsdtTokenIdentifier,
        borrowed_token: EsdtTokenIdentifier,
        lending_position_token: EsdtTokenIdentifier,
        liquid_staking_address: ManagedAddress,
        lending_address: ManagedAddress,
        swap_router_address: ManagedAddress,
        bot_address: ManagedAddress,
    ) {
        self.supplied_token().set(supplied_token);
        self.borrowed_token().set(borrowed_token);
        self.lending_position_token().set(lending_position_token);
        self.liquid_staking_address().set(liquid_staking_address);
        self.lending_address().set(lending_address);
        self.swap_router_address().set(swap_router_address);
        self.bot_address().set(bot_address);

        self.total_shares()
            .set_if_empty(ManagedDecimal::from_raw_units(
                BigUint::zero(),
                WAD_PRECISION,
            ));

        self.safe_threshold_bps()
            .set_if_empty(DEFAULT_SAFE_THRESHOLD_BPS);
        self.inaction_zone_bps()
            .set_if_empty(DEFAULT_INACTION_ZONE_BPS);

        self.admins().insert(self.caller());
    }

    /// Handles contract upgrade. Called when the contract is upgraded.
    #[upgrade]
    fn upgrade(&self) {
        self.total_shares()
            .set_if_empty(ManagedDecimal::from_raw_units(
                BigUint::zero(),
                WAD_PRECISION,
            ));
    }

    // #[only_owner]
    // #[payable]
    // #[endpoint(ls)]
    // fn ls(&self) {
    //     let payment = self.call_value().egld_or_single_esdt();

    //     let returned =
    //         self.execute_delegation(&self.liquid_staking_address().get(), &payment.amount);

    //     self.tx()
    //         .to(&self.blockchain().get_owner_address())
    //         .payment(returned)
    //         .transfer();
    // }

    // #[only_owner]
    // #[endpoint(reset)]
    // fn reset(&self) {
    //     // self.tx()
    //     //     .to(&self.blockchain().get_owner_address())
    //     //     .single_esdt(
    //     //         &self.supplied_token().get(),
    //     //         0,
    //     //         &self.blockchain().get_sc_balance(
    //     //             TokenId::new(self.supplied_token().get().into_managed_buffer()),
    //     //             0u64,
    //     //         ),
    //     //     )
    //     //     .transfer();

    //     self.tx()
    //         .to(&self.blockchain().get_owner_address())
    //         .single_esdt(
    //             &self.lending_position_token().get(),
    //             self.lending_position_nonce().get(),
    //             &BigUint::from(1u8),
    //         )
    //         .transfer();

    //     self.total_shares().set(ManagedDecimal::from_raw_units(
    //         BigUint::zero(),
    //         WAD_PRECISION,
    //     ));
    //     self.lending_position_nonce().clear();
    //     self.has_collateral().clear();
    // }

    // #[only_owner]
    // #[endpoint(get)]
    // fn get(&self, token: EgldOrEsdtTokenIdentifier, nonce: u64, amount: BigUint) {
    //     self.tx()
    //         .to(&self.blockchain().get_owner_address())
    //         .egld_or_single_esdt(&token, nonce, &amount)
    //         .transfer();
    // }

    // #[view(getPositionAttributes)]
    // fn get_position_attributes(&self, address: ManagedAddress, nonce: u64) -> ManagedBuffer {
    //     self.blockchain()
    //         .get_esdt_token_data(&address, &self.share_token().get_token_id(), nonce)
    //         .attributes
    // }
}
