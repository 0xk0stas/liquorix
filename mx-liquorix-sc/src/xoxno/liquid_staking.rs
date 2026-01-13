//! # Liquid Staking Module
//!
//! Provides integration with the XOXNO liquid staking protocol.
//!
//! Enables conversion of EGLD to xEGLD through delegation.

use crate::{
    constants::WAD_PRECISION, errors::ERROR_DELEGATE_FAILED, proxies::xoxno_liquid_staking_proxy,
};
use multiversx_sc::imports::*;

/// Module for XOXNO liquid staking protocol interactions.
///
/// Provides functionality to delegate EGLD and receive xEGLD tokens.
#[multiversx_sc::module]
pub trait LiquidStakingModule: crate::system::utils::UtilsModule {
    // === Private ===

    /// Executes delegation of EGLD to the liquid staking protocol.
    ///
    /// Converts EGLD to xEGLD by delegating to the liquid staking contract.
    ///
    /// # Arguments
    /// - `liquid_staking_address` - Address of the liquid staking contract
    /// - `amount` - Amount of EGLD to delegate
    ///
    /// # Returns
    /// ESDT payment containing the received xEGLD tokens.
    ///
    /// # Panics
    /// Panics with `ERROR_DELEGATE_FAILED` if delegation returns no tokens.
    fn execute_delegation(
        &self,
        liquid_staking_address: &ManagedAddress,
        amount: &BigUint,
    ) -> EsdtTokenPayment {
        let opt_payment = self
            .tx()
            .to(liquid_staking_address)
            .typed(xoxno_liquid_staking_proxy::LiquidStakingProxy)
            .delegate(OptionalValue::None::<ManagedAddress>)
            .egld(amount)
            .returns(ReturnsResult)
            .sync_call();

        match opt_payment {
            OptionalValue::Some(payment) => {
                return EsdtTokenPayment::new(
                    payment.token_identifier,
                    payment.token_nonce,
                    payment.amount,
                );
            }
            OptionalValue::None => {
                sc_panic!(ERROR_DELEGATE_FAILED);
            }
        }
    }

    /// Queries the EGLD value of a given xEGLD amount.
    ///
    /// Calls the liquid staking contract to get the underlying EGLD value
    /// for a position denominated in xEGLD.
    ///
    /// # Arguments
    /// - `liquid_staking_address` - Address of the liquid staking contract
    /// - `amount` - Amount of xEGLD tokens
    ///
    /// # Returns
    /// The equivalent EGLD value as ManagedDecimal.
    fn get_ls_value_in_egld(
        &self,
        liquid_staking_address: &ManagedAddress,
        amount: &ManagedDecimal<Self::Api, NumDecimals>,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        let ls_value = self
            .tx()
            .to(liquid_staking_address)
            .typed(xoxno_liquid_staking_proxy::LiquidStakingProxy)
            .get_ls_value_for_position(self.md_to_biguint(amount))
            .returns(ReturnsResult)
            .sync_call();

        ManagedDecimal::from_raw_units(ls_value, WAD_PRECISION)
    }
}
