//! # Admins Module
//!
//! Provides admin management functionality for the smart contract.
//!
//! Admins have elevated privileges to perform certain operations
//! like pausing/unpausing the contract.

use crate::errors::ERROR_NOT_ADMIN;
use multiversx_sc::imports::*;

/// Smart Contract module that offers admin management capabilities.
///
/// It provides:
/// * two endpoints where the owner can add/remove admins
/// * a method to require an address to be an admin
#[multiversx_sc::module]
pub trait AdminsModule: crate::system::storage::StorageModule {
    // === Endpoints ===

    /// Adds one or more addresses as admins.
    ///
    /// # Access Control
    /// Only callable by the contract owner.
    ///
    /// # Arguments
    /// - `addresses` - List of addresses to add as admins
    #[only_owner]
    #[endpoint(addAdmins)]
    fn add_admin(&self, addresses: MultiValueEncoded<ManagedAddress>) {
        self.event_admins_added(&addresses);

        for address in addresses.into_iter() {
            self.admins().insert(address);
        }
    }

    /// Removes one or more addresses from admins.
    ///
    /// # Access Control
    /// Only callable by the contract owner.
    ///
    /// # Arguments
    /// - `addresses` - List of addresses to remove from admins
    #[only_owner]
    #[endpoint(removeAdmins)]
    fn remove_admin(&self, addresses: MultiValueEncoded<ManagedAddress>) {
        self.event_admins_removed(&addresses);

        for address in addresses.into_iter() {
            self.admins().swap_remove(&address);
        }
    }

    // === Private ===

    /// Requires the given address to be in the admins list.
    ///
    /// # Panics
    /// Panics with `ERROR_NOT_ADMIN` if the address is not an admin.
    fn require_is_admin(&self, address: &ManagedAddress) {
        require!(self.admins().contains(address), ERROR_NOT_ADMIN);
    }

    // === Events ===

    /// Emitted when admins are added.
    #[event("adminsAdded")]
    fn event_admins_added(&self, #[indexed] admins: &MultiValueEncoded<ManagedAddress>);

    /// Emitted when admins are removed.
    #[event("adminsRemoved")]
    fn event_admins_removed(&self, #[indexed] admins: &MultiValueEncoded<ManagedAddress>);
}
