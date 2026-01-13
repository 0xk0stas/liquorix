//! # Utils Module
//!
//! Provides utility functions used across the smart contract.
//!
//! Contains helpers for token conversion, decimal handling, and blockchain queries.

use multiversx_sc::imports::*;

use crate::{
    constants::{WAD, WAD_PRECISION},
    structs::TimestampInMillis,
};

/// Module containing utility helper functions.
#[multiversx_sc::module]
pub trait UtilsModule {
    fn wad_as_md(&self) -> ManagedDecimal<Self::Api, NumDecimals> {
        ManagedDecimal::from_raw_units(BigUint::from(WAD), WAD_PRECISION)
    }

    /// Converts a BigUint to a ManagedDecimal with specified precision.
    ///
    /// # Arguments
    /// - `value` - The BigUint value to convert
    /// - `decimals` - The decimal precision for the result
    ///
    /// # Returns
    /// ManagedDecimal representation of the input value.
    fn biguint_to_md(
        &self,
        value: BigUint,
        decimals: usize,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        ManagedDecimal::from_raw_units(value, decimals)
    }

    /// Converts a ManagedDecimal to a BigUint.
    ///
    /// # Arguments
    /// - `value` - The ManagedDecimal value to convert
    ///
    /// # Returns
    /// BigUint representation of the input value.
    fn md_to_biguint(&self, value: &ManagedDecimal<Self::Api, NumDecimals>) -> BigUint {
        value.into_raw_units().clone()
    }

    /// Returns a ManagedDecimal representing zero with specified precision.
    ///
    /// # Arguments
    /// - `decimals` - The decimal precision for the result
    ///
    /// # Returns
    /// ManagedDecimal representation of zero.
    fn md_zero(&self, decimals: usize) -> ManagedDecimal<Self::Api, NumDecimals> {
        ManagedDecimal::from_raw_units(BigUint::zero(), decimals)
    }

    /// Returns a BigUint representing zero.
    ///
    /// # Returns
    /// BigUint representation of zero.
    fn biguint_zero(&self) -> BigUint {
        BigUint::zero()
    }

    /// Checks if a ManagedDecimal value is equal to zero.
    ///
    /// # Arguments
    /// - `value` - The ManagedDecimal value to check
    ///
    /// # Returns
    /// True if the value is zero, false otherwise.
    fn is_md_eq_zero(&self, value: &ManagedDecimal<Self::Api, NumDecimals>) -> bool {
        value.into_raw_units() == &BigUint::zero()
    }

    /// Checks if a BigUint value is equal to zero.
    ///
    /// # Arguments
    /// - `value` - The BigUint value to check
    ///
    /// # Returns
    /// True if the value is zero, false otherwise.
    fn is_biguint_eq_zero(&self, value: &BigUint) -> bool {
        value == &BigUint::zero()
    }

    /// Checks if a BigUint value is greater than zero.
    ///
    /// # Arguments
    /// - `value` - The BigUint value to check
    ///
    /// # Returns
    /// True if the value is greater than zero, false otherwise.
    fn is_biguint_gt_zero(&self, value: &BigUint) -> bool {
        value > &BigUint::zero()
    }

    /// Checks if a ManagedDecimal value is greater than zero.
    ///
    /// # Arguments
    /// - `value` - The ManagedDecimal value to check
    ///
    /// # Returns
    /// True if the value is greater than zero, false otherwise.
    fn is_md_gt_zero(&self, value: &ManagedDecimal<Self::Api, NumDecimals>) -> bool {
        value.into_raw_units() > &BigUint::zero()
    }

    /// Returns the absolute difference between two BigUint values.
    ///
    /// # Arguments
    /// - `a` - First BigUint value
    /// - `b` - Second BigUint value
    ///
    ///  # Returns
    /// Absolute difference as BigUint.
    fn abs_difference_biguint(&self, a: &BigUint, b: &BigUint) -> BigUint {
        if a > b {
            a - b
        } else {
            b - a
        }
    }

    /// Returns the absolute difference between two ManagedDecimal values.
    ///
    /// # Arguments
    /// - `a` - First ManagedDecimal value
    /// - `b` - Second ManagedDecimal value
    ///
    /// # Returns
    /// Absolute difference as ManagedDecimal.
    fn abs_difference_md(
        &self,
        a: ManagedDecimal<Self::Api, NumDecimals>,
        b: ManagedDecimal<Self::Api, NumDecimals>,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        if a > b {
            a.sub(b)
        } else {
            b.sub(a)
        }
    }

    /// Returns the current block timestamp in milliseconds.
    fn current_ts_millis(&self) -> TimestampInMillis {
        self.blockchain()
            .get_block_timestamp_millis()
            .as_u64_millis()
    }

    /// Returns the caller's address.
    fn caller(&self) -> ManagedAddress {
        self.blockchain().get_caller()
    }

    /// Returns the owner's address.
    fn owner(&self) -> ManagedAddress {
        self.blockchain().get_owner_address()
    }

    /// Returns the contract's address.
    fn sc(&self) -> ManagedAddress {
        self.blockchain().get_sc_address()
    }
}
