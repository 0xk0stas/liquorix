//! # Storage Module
//!
//! Defines all storage mappers used by the smart contract.
//!
//! Contains storage for tokens, addresses, state flags, and admin list.

use multiversx_sc::imports::*;

/// Module containing all storage mappers for the contract.
#[multiversx_sc::module]
pub trait StorageModule {
    /// NFT token used to represent user shares in the vault.
    #[storage_mapper("share_token")]
    fn share_token(&self) -> NonFungibleTokenMapper;

    /// Total supply of share tokens with decimal precision.
    #[storage_mapper("total_shares")]
    fn total_shares(&self) -> SingleValueMapper<ManagedDecimal<Self::Api, NumDecimals>>;

    /// Token identifier for the collateral token (e.g., xEGLD).
    #[storage_mapper("supplied_token")]
    fn supplied_token(&self) -> SingleValueMapper<EsdtTokenIdentifier>;

    /// Token identifier for the borrowed token (e.g., EGLD).
    #[storage_mapper("borrowed_token")]
    fn borrowed_token(&self) -> SingleValueMapper<EsdtTokenIdentifier>;

    /// NFT token identifier for tracking lending positions.
    #[storage_mapper("lending_position_token")]
    fn lending_position_token(&self) -> SingleValueMapper<EsdtTokenIdentifier>;

    /// Nonce of the current lending position NFT.
    #[storage_mapper("lending_position_nonce")]
    fn lending_position_nonce(&self) -> SingleValueMapper<u64>;

    /// Flag indicating if the vault has active collateral.
    #[storage_mapper("has_collateral")]
    fn has_collateral(&self) -> SingleValueMapper<bool>;

    /// Flag indicating if the vault has active debt.
    #[storage_mapper("has_debt")]
    fn has_debt(&self) -> SingleValueMapper<bool>;

    /// Address of the XOXNO liquid staking contract.
    #[storage_mapper("liquid_staking_address")]
    fn liquid_staking_address(&self) -> SingleValueMapper<ManagedAddress>;

    /// Address of the XOXNO lending controller contract.
    #[storage_mapper("lending_address")]
    fn lending_address(&self) -> SingleValueMapper<ManagedAddress>;

    /// Address of the XOXNO swap router contract.
    #[storage_mapper("swap_router_address")]
    fn swap_router_address(&self) -> SingleValueMapper<ManagedAddress>;

    /// Address authorized to execute bot operations.
    #[storage_mapper("bot_address")]
    fn bot_address(&self) -> SingleValueMapper<ManagedAddress>;

    /// Flag indicating if the contract is paused.
    #[storage_mapper("is_paused")]
    fn is_paused(&self) -> SingleValueMapper<bool>;

    /// Set of admin addresses with elevated privileges.
    #[storage_mapper("admins")]
    fn admins(&self) -> UnorderedSetMapper<ManagedAddress>;

    /// Safe threshold for LTV ratio in BPS (basis points).
    #[storage_mapper("safe_threshold_bps")]
    fn safe_threshold_bps(&self) -> SingleValueMapper<u64>;

    /// Inaction zone in BPS around the safe threshold.
    #[storage_mapper("inaction_zone_bps")]
    fn inaction_zone_bps(&self) -> SingleValueMapper<u64>;
}
