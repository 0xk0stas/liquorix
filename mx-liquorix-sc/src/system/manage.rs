//! # Manage Module
//!
//! Provides contract management and configuration functionality.
//!
//! Contains owner-only endpoints for setting up tokens, addresses,
//! and creating the initial lending position.

use multiversx_sc::imports::*;

use crate::{
    constants::WAD_PRECISION,
    errors::{
        ERROR_INACTION_ZONE_TOO_LARGE, ERROR_INACTION_ZONE_UPPER_BOUND_TOO_HIGH, ERROR_NOT_BOT,
        ERROR_SAFE_THRESHOLD_TOO_HIGH,
    },
    structs::{SystemInfo, SystemInfoType},
};

/// Module for contract management and configuration.
///
/// Provides:
/// - Token issuance and configuration
/// - Address configuration for external protocols
/// - System info views
/// - Bot authorization checks
#[multiversx_sc::module]
pub trait ManageModule:
    crate::system::pause::PauseModule
    + crate::system::admins::AdminsModule
    + crate::system::storage::StorageModule
    + crate::system::utils::UtilsModule
    + crate::xoxno::lending::LendingModule
    + crate::xoxno::liquid_staking::LiquidStakingModule
{
    // === Endpoints ===

    /// Issues the share token NFT for the vault.
    ///
    /// Creates a MetaFungible token used to represent user shares.
    ///
    /// # Arguments
    /// - `display_name` - Human-readable name for the token
    /// - `ticker` - Short ticker symbol for the token
    ///
    /// # Payment
    /// Requires EGLD payment for token issuance fee.
    #[only_owner]
    #[payable("EGLD")]
    #[endpoint(issueShareToken)]
    fn issue_share_token(&self, display_name: ManagedBuffer, ticker: ManagedBuffer) {
        self.share_token().issue_and_set_all_roles(
            EsdtTokenType::DynamicMeta,
            self.call_value().egld().clone_value(),
            display_name,
            ticker,
            WAD_PRECISION,
            Option::Some(
                self.callbacks()
                    .share_token_issuance_callback(&self.blockchain().get_owner_address()),
            ),
        );
    }

    /// Sets the token used as collateral (e.g., xEGLD).
    #[only_owner]
    #[endpoint(setSuppliedToken)]
    fn set_supplied_token(&self, token: EsdtTokenIdentifier) {
        self.event_supplied_token_set(&token);
        self.supplied_token().set(token);
    }

    /// Sets the token to be borrowed (e.g., EGLD).
    #[only_owner]
    #[endpoint(setBorrowedToken)]
    fn set_borrowed_token(&self, token: EsdtTokenIdentifier) {
        self.event_borrowed_token_set(&token);
        self.borrowed_token().set(token);
    }

    /// Sets the XOXNO liquid staking contract address.
    #[only_owner]
    #[endpoint(setLiquidStakingAddress)]
    fn set_liquid_staking_address(&self, address: ManagedAddress) {
        self.event_liquid_staking_address_set(&address);
        self.liquid_staking_address().set(address);
    }

    /// Sets the XOXNO lending controller contract address.
    #[only_owner]
    #[endpoint(setLendingAddress)]
    fn set_lending_address(&self, address: ManagedAddress) {
        self.event_lending_address_set(&address);
        self.lending_address().set(address);
    }

    /// Sets the XOXNO swap router contract address.
    #[only_owner]
    #[endpoint(setSwapRouterAddress)]
    fn set_swap_router_address(&self, address: ManagedAddress) {
        self.event_swap_router_address_set(&address);
        self.swap_router_address().set(address);
    }

    /// Sets the authorized bot address for leverage operations.
    #[only_owner]
    #[endpoint(setBotAddress)]
    fn set_bot_address(&self, address: ManagedAddress) {
        self.event_bot_address_set(&address);
        self.bot_address().set(address);
    }

    /// Sets the bot LTV threshold parameters.
    ///
    /// # Arguments
    /// - `safe_threshold_bps` - Safe threshold in BPS (e.g., 4000 = 40%). Target LTV ratio.
    /// - `inaction_zone_bps` - Inaction zone in BPS around safe threshold (e.g., 500 = 5%).
    ///
    /// # Validation
    /// - `safe_threshold_bps` must be <= 10000 (100%)
    /// - `safe_threshold_bps + inaction_zone_bps` must be <= 10000 (upper bound can't exceed 100%)
    /// - `inaction_zone_bps` must be < `safe_threshold_bps` (lower bound can't go negative)
    #[only_owner]
    #[endpoint(setRiskThresholds)]
    fn set_risk_thresholds(&self, safe_threshold_bps: u64, inaction_zone_bps: u64) {
        require!(safe_threshold_bps <= 10_000, ERROR_SAFE_THRESHOLD_TOO_HIGH);
        require!(
            safe_threshold_bps + inaction_zone_bps <= 10_000,
            ERROR_INACTION_ZONE_UPPER_BOUND_TOO_HIGH
        );
        require!(
            inaction_zone_bps < safe_threshold_bps,
            ERROR_INACTION_ZONE_TOO_LARGE
        );

        self.safe_threshold_bps().set(safe_threshold_bps);
        self.inaction_zone_bps().set(inaction_zone_bps);

        self.event_risk_thresholds_set(safe_threshold_bps, inaction_zone_bps);
    }

    // === Views ===

    /// Returns complete system information as a `SystemInfo` struct.
    #[view(getSystemInfo)]
    fn get_system_info(&self) -> SystemInfo<Self::Api> {
        SystemInfo::new(
            self.is_paused().get(),
            self.share_token().get_token_id(),
            self.total_shares().get(),
            self.supplied_token().get(),
            self.borrowed_token().get(),
            self.lending_position_token().get(),
            self.lending_position_nonce().get(),
            self.has_collateral().get(),
            self.has_debt().get(),
            self.liquid_staking_address().get(),
            self.lending_address().get(),
            self.swap_router_address().get(),
            self.bot_address().get(),
            self.admins().iter().collect(),
        )
    }

    /// Returns system info as a MultiValue tuple for ABI compatibility.
    #[view(getSystemInfoMultiValue)]
    fn get_system_info_multi_value(&self) -> SystemInfoType<Self::Api> {
        self.get_system_info().into_multi_value()
    }

    // === Private ===

    /// Requires the caller to be the authorized bot address.
    fn require_is_bot(&self, address: &ManagedAddress) {
        require!(
            &self.bot_address().get() == address || &self.owner() == address,
            ERROR_NOT_BOT
        );
    }

    // === Events ===

    /// Emitted when the share token is set.
    #[event("shareTokenSet")]
    fn event_share_token_set(&self, #[indexed] token: &EsdtTokenIdentifier);

    /// Emitted when the supplied token is set.
    #[event("SuppliedTokenSet")]
    fn event_supplied_token_set(&self, #[indexed] token: &EsdtTokenIdentifier);

    /// Emitted when the borrowed token is set.
    #[event("borrowedTokenSet")]
    fn event_borrowed_token_set(&self, #[indexed] token: &EsdtTokenIdentifier);

    /// Emitted when the liquid staking address is set.
    #[event("liquidStakingAddressSet")]
    fn event_liquid_staking_address_set(&self, #[indexed] address: &ManagedAddress);

    /// Emitted when the lending address is set.
    #[event("lendingAddressSet")]
    fn event_lending_address_set(&self, #[indexed] address: &ManagedAddress);

    /// Emitted when the swap router address is set.
    #[event("swapRouterAddressSet")]
    fn event_swap_router_address_set(&self, #[indexed] address: &ManagedAddress);

    /// Emitted when the bot address is set.
    #[event("botAddressSet")]
    fn event_bot_address_set(&self, #[indexed] address: &ManagedAddress);

    /// Emitted when the lending position nonce is set.
    #[event("lendingPositionNonceSet")]
    fn event_lending_position_nonce_set(&self, #[indexed] nonce: u64);

    /// Emitted when the risk thresholds are set.
    #[event("riskThresholdsSet")]
    fn event_risk_thresholds_set(
        &self,
        #[indexed] safe_threshold_bps: u64,
        #[indexed] inaction_zone_bps: u64,
    );

    // === Callbacks ===

    /// Callback for share token issuance.
    ///
    /// On success, stores the token ID. On failure, refunds the EGLD to the caller.
    #[callback]
    fn share_token_issuance_callback(
        &self,
        caller: &ManagedAddress,
        #[call_result] result: ManagedAsyncCallResult<EsdtTokenIdentifier>,
    ) {
        match result {
            ManagedAsyncCallResult::Ok(token_id) => {
                self.event_share_token_set(&token_id);
                self.share_token().set_token_id(token_id);
            }
            ManagedAsyncCallResult::Err(_) => {
                self.tx()
                    .to(caller)
                    .egld(&self.call_value().egld().clone_value())
                    .transfer();

                self.share_token().clear();
            }
        }
    }
}
