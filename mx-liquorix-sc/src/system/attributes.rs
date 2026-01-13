//! # Attributes Module
//!
//! Handles share token NFT attributes encoding and decoding.
//!
//! Provides functionality to manage the metadata stored in each share token.

use multiversx_sc::imports::*;

use crate::structs::{ShareTokenAttributes, TimestampInMillis};

/// Module for managing share token attributes.
#[multiversx_sc::module]
pub trait AttributesModule:
    crate::system::storage::StorageModule + crate::system::utils::UtilsModule
{
    /// Retrieves the attributes of a share token by nonce.
    /// Returns default attributes if the token doesn't exist.
    /// The token must be held by the contract itself.
    ///
    /// # Arguments
    /// - `nonce` - The nonce of the share token
    fn get_share_token_attributes(&self, nonce: u64) -> ShareTokenAttributes<Self::Api> {
        if self.is_biguint_gt_zero(&self.share_token().get_balance(nonce)) {
            self.share_token().get_token_attributes(nonce)
        } else {
            ShareTokenAttributes::default()
        }
    }

    /// Retrieves the attributes of a share token by nonce.
    /// Returns default attributes if the token doesn't exist in the specified address.
    ///
    ///
    /// # Arguments
    /// - `nonce` - The nonce of the share token
    /// - `opt_address` - Optional address to check the token balance; defaults to contract address if None
    fn get_share_token_attributes_from_address(
        &self,
        nonce: u64,
        address: &ManagedAddress,
    ) -> ShareTokenAttributes<Self::Api> {
        let share_token = self.share_token().get_token_id();
        let share_balance = self
            .blockchain()
            .get_esdt_balance(address, &share_token, nonce);

        if self.is_biguint_gt_zero(&share_balance) {
            let attr_buffer = self
                .blockchain()
                .get_esdt_token_data(address, &share_token, nonce)
                .attributes;

            self.attributes_from_buffer(&attr_buffer)
        } else {
            ShareTokenAttributes::default()
        }
    }

    /// Encodes share token attributes to a buffer for NFT creation.
    ///
    /// # Arguments
    /// - `total_share_supply` - Total shares at time of creation
    /// - `total_initial_supplied_amount` - Total supplied amount at time of creation
    /// - `last_interaction_ts_millis` - Timestamp of the interaction
    fn attributes_to_buffer(
        &self,
        total_share_supply: ManagedDecimal<Self::Api, NumDecimals>,
        total_initial_supplied_amount: ManagedDecimal<Self::Api, NumDecimals>,
        last_interaction_ts_millis: TimestampInMillis,
    ) -> ManagedBuffer {
        let share_token_attributes = ShareTokenAttributes::new(
            total_share_supply,
            total_initial_supplied_amount,
            last_interaction_ts_millis,
        );

        let mut attributes = ManagedBuffer::new();
        let _ = share_token_attributes.top_encode(&mut attributes);
        attributes
    }

    /// Decodes share token attributes from a buffer.
    ///
    /// # Arguments
    /// - `attributes` - The buffer containing encoded attributes
    fn attributes_from_buffer(
        &self,
        attributes: &ManagedBuffer,
    ) -> ShareTokenAttributes<Self::Api> {
        ShareTokenAttributes::top_decode(attributes.clone()).unwrap_or_default()
    }
}
