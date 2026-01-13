//! # Pause Module
//!
//! Provides pausability functionality for the smart contract.
//!
//! When paused, certain operations (like deposits and withdrawals) are blocked.

use crate::errors::{ERROR_NOT_PAUSED, ERROR_PAUSED};
use multiversx_sc::imports::*;

/// Smart Contract module that offers pausability.
///
/// It provides:
/// * two endpoints where an admin can pause/unpause the contract
/// * two methods to require the contract to be paused/not paused
#[multiversx_sc::module]
pub trait PauseModule:
    crate::system::admins::AdminsModule + crate::system::storage::StorageModule
{
    // === Endpoints ===

    /// Pauses the contract.
    ///
    /// # Access Control
    /// Only callable by an admin.
    ///
    /// # Panics
    /// Panics if the contract is already paused.
    #[endpoint(pause)]
    fn pause(&self) {
        self.require_is_admin(&self.blockchain().get_caller());
        self.require_not_paused();

        self.is_paused().set(true);
        self.event_paused();
    }

    /// Unpauses the contract.
    ///
    /// # Access Control
    /// Only callable by an admin.
    ///
    /// # Panics
    /// Panics if the contract is not paused.
    #[endpoint(unpause)]
    fn unpause(&self) {
        self.require_is_admin(&self.blockchain().get_caller());
        self.require_paused();

        self.is_paused().set(false);
        self.event_unpaused();
    }

    // === Private ===

    /// Requires the contract to be paused.
    fn require_paused(&self) {
        require!(self.is_paused().get(), ERROR_NOT_PAUSED);
    }

    /// Requires the contract to not be paused.
    fn require_not_paused(&self) {
        require!(!self.is_paused().get(), ERROR_PAUSED);
    }

    // === Events ===

    /// Emitted when the contract is paused.
    #[event("paused")]
    fn event_paused(&self);

    /// Emitted when the contract is unpaused.
    #[event("unpaused")]
    fn event_unpaused(&self);
}
