//! # Lending Module
//!
//! Provides integration with the XOXNO lending protocol.
//!
//! Contains functions for supplying collateral, borrowing, withdrawing,
//! and querying position information.

use crate::{
    constants::WAD_PRECISION,
    errors::{
        ERROR_INVALID_LENDING_POSITION_NONCE, ERROR_INVALID_LENDING_POSITION_TOKEN,
        ERROR_RECEIVED_AMOUNT_MISMATCH, ERROR_UNEXPECTED_BACK_TRANSFER,
    },
    proxies::xoxno_lending_controller_proxy,
};
use multiversx_sc::imports::*;

/// Module for XOXNO lending protocol interactions.
///
/// Provides functionality to:
/// - Create and manage supply positions
/// - Execute borrows and repayments
/// - Query collateral and debt amounts
/// - Get token prices
#[multiversx_sc::module]
pub trait LendingModule: crate::system::utils::UtilsModule {
    /// Creates a new supply position in the lending protocol.
    ///
    /// Sends collateral tokens to the lending protocol and receives a position NFT
    /// that represents ownership of the lending position.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `supplied_token` - Token to supply as collateral
    /// - `amount` - Amount to supply
    /// - `lending_position_token` - Expected token identifier for the position NFT
    ///
    /// # Returns
    /// The nonce of the newly created lending position NFT.
    ///
    /// # Panics
    /// Panics if the returned position token doesn't match the expected token.
    fn create_supply_position(
        &self,
        lending_address: &ManagedAddress,
        supplied_token: EsdtTokenIdentifier,
        amount: &ManagedDecimal<Self::Api, NumDecimals>,
        lending_position_token: &EsdtTokenIdentifier,
    ) -> u64 {
        let back_transfers = self
            .tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .supply(OptionalValue::None::<u64>, OptionalValue::None::<u8>)
            .esdt(EsdtTokenPayment::new(
                supplied_token,
                0,
                self.md_to_biguint(amount),
            ))
            .returns(ReturnsBackTransfers)
            .sync_call();

        let lending_position_payment = back_transfers
            .into_multi_value()
            .into_iter()
            .last()
            .unwrap()
            .into_inner();

        require!(
            &lending_position_payment.token_identifier == lending_position_token,
            ERROR_INVALID_LENDING_POSITION_TOKEN
        );

        lending_position_payment.token_nonce
    }

    /// Supplies additional collateral to an existing lending position.
    ///
    /// Adds more collateral to increase the position's safety margin and
    /// borrowing capacity. The position NFT must be owned by this contract.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `supplied_token` - Token to supply as additional collateral
    /// - `amount` - Amount to supply
    /// - `lending_position_token` - NFT representing the lending position
    /// - `lending_position_nonce` - Nonce of the position NFT
    ///
    /// # Panics
    /// Panics if the returned position token or nonce doesn't match.
    fn execute_supply(
        &self,
        lending_address: &ManagedAddress,
        supplied_token: EsdtTokenIdentifier,
        amount: &ManagedDecimal<Self::Api, NumDecimals>,
        lending_position_token: EsdtTokenIdentifier,
        lending_position_nonce: u64,
    ) {
        let back_transfers = self
            .tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .supply(
                OptionalValue::Some(lending_position_nonce),
                OptionalValue::None::<u8>,
            )
            .esdt(EsdtTokenPayment::new(
                lending_position_token.clone(),
                lending_position_nonce,
                BigUint::from(1u8),
            ))
            .esdt(EsdtTokenPayment::new(
                supplied_token.clone(),
                0,
                self.md_to_biguint(amount),
            ))
            .returns(ReturnsBackTransfers)
            .sync_call();

        let bt_as_payment = back_transfers
            .into_multi_value()
            .into_iter()
            .last()
            .unwrap()
            .into_inner();
        require!(
            bt_as_payment.token_identifier == lending_position_token,
            ERROR_INVALID_LENDING_POSITION_TOKEN
        );
        require!(
            bt_as_payment.token_nonce == lending_position_nonce,
            ERROR_INVALID_LENDING_POSITION_NONCE
        );
    }

    /// Withdraws collateral from a lending position.
    ///
    /// Removes collateral from the position. This reduces the borrowing capacity
    /// and may fail if it would cause the position to become liquidatable.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `supplied_token` - Token to withdraw
    /// - `amount` - Amount to withdraw
    /// - `lending_position_token` - NFT representing the lending position
    /// - `lending_position_nonce` - Nonce of the position NFT
    ///
    /// # Panics
    /// - Panics if the position token or nonce doesn't match
    /// - Panics if the received amount doesn't match the requested amount
    fn execute_withdraw(
        &self,
        lending_address: &ManagedAddress,
        supplied_token: &EsdtTokenIdentifier,
        amount: &ManagedDecimal<Self::Api, NumDecimals>,
        lending_position_token: EsdtTokenIdentifier,
        lending_position_nonce: u64,
    ) {
        let mut collaterals: MultiValueEncoded<EgldOrEsdtTokenPayment> = MultiValueEncoded::new();
        collaterals.push(EgldOrEsdtTokenPayment::new(
            EgldOrEsdtTokenIdentifier::esdt(supplied_token.clone()),
            0,
            self.md_to_biguint(amount),
        ));

        let back_transfers = self
            .tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .withdraw(collaterals)
            .single_esdt(
                &lending_position_token,
                lending_position_nonce,
                &BigUint::from(1u8),
            )
            .returns(ReturnsBackTransfers)
            .sync_call();

        for back_transfer in back_transfers.into_multi_value().into_iter() {
            let bt_as_payment = back_transfer.into_inner();
            if bt_as_payment.token_identifier == lending_position_token {
                require!(
                    bt_as_payment.token_nonce == lending_position_nonce,
                    ERROR_INVALID_LENDING_POSITION_NONCE
                );
            } else if &bt_as_payment.token_identifier.unwrap_esdt() == supplied_token {
                require!(
                    bt_as_payment.amount == self.md_to_biguint(amount),
                    ERROR_RECEIVED_AMOUNT_MISMATCH
                )
            } else {
                sc_panic!(ERROR_UNEXPECTED_BACK_TRANSFER);
            }
        }
    }

    /// Executes a borrow against the lending position's collateral.
    ///
    /// Borrows tokens from the lending protocol using the position's collateral.
    /// This increases the debt and LTV ratio of the position.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `borrowed_token` - Token to borrow
    /// - `amount` - Amount to borrow
    /// - `lending_position_token` - NFT representing the lending position
    /// - `lending_position_nonce` - Nonce of the position NFT
    ///
    /// # Panics
    /// - Panics if the position token or nonce doesn't match
    /// - Panics if the received borrowed amount doesn't match
    fn execute_borrow(
        &self,
        lending_address: &ManagedAddress,
        borrowed_token: EsdtTokenIdentifier,
        amount: &ManagedDecimal<Self::Api, NumDecimals>,
        lending_position_token: EsdtTokenIdentifier,
        lending_position_nonce: u64,
    ) {
        let mut payments: MultiValueEncoded<EgldOrEsdtTokenPayment> = MultiValueEncoded::new();
        payments.push(EgldOrEsdtTokenPayment::new(
            EgldOrEsdtTokenIdentifier::esdt(borrowed_token.clone()),
            0,
            self.md_to_biguint(amount),
        ));

        let back_transfers = self
            .tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .borrow(payments)
            .esdt(EsdtTokenPayment::new(
                lending_position_token.clone(),
                lending_position_nonce,
                BigUint::from(1u8),
            ))
            .returns(ReturnsBackTransfers)
            .sync_call();

        for back_transfer in back_transfers.into_multi_value().into_iter() {
            let bt_as_payment = back_transfer.into_inner();

            if bt_as_payment.token_identifier == lending_position_token {
                require!(
                    bt_as_payment.token_nonce == lending_position_nonce,
                    ERROR_INVALID_LENDING_POSITION_NONCE
                );
            } else if bt_as_payment.token_identifier.unwrap_esdt() == borrowed_token {
                require!(
                    bt_as_payment.amount == self.md_to_biguint(amount),
                    ERROR_RECEIVED_AMOUNT_MISMATCH
                )
            } else {
                sc_panic!(ERROR_UNEXPECTED_BACK_TRANSFER);
            }
        }
    }

    /// Executes a debt repayment for the lending position.
    ///
    /// Repays borrowed tokens to reduce the position's debt.
    /// This improves the health factor and reduces liquidation risk.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `borrowed_token` - Token to repay
    /// - `lending_position_nonce` - Nonce of the position NFT
    /// - `amount` - Amount to repay
    fn execute_repay(
        &self,
        lending_address: &ManagedAddress,
        borrowed_token: &EsdtTokenIdentifier,
        lending_position_nonce: u64,
        amount: &ManagedDecimal<Self::Api, NumDecimals>,
    ) {
        self.tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .repay(lending_position_nonce)
            .single_esdt(borrowed_token, 0, &self.md_to_biguint(amount))
            .sync_call();
    }

    /// Executes a debt repayment by swapping collateral directly in the lending protocol.
    ///
    /// This is an atomic operation that:
    /// 1. Withdraws collateral from the position
    /// 2. Swaps it to the borrowed token via the lending protocol's router
    /// 3. Repays the debt with the swapped tokens
    ///
    /// Used for deleveraging without requiring external tokens.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `lending_position_token` - NFT representing the lending position
    /// - `lending_position_nonce` - Nonce of the position NFT
    /// - `supplied_token` - Collateral token to use for repayment
    /// - `supplied_amount` - Amount of collateral to swap and repay
    /// - `borrowed_token` - Token to repay
    /// - `swap_steps` - Swap route arguments for the internal DEX
    ///
    /// # Panics
    /// Panics if the position token or nonce doesn't match after the operation.
    fn execute_repay_with_collateral(
        &self,
        lending_address: &ManagedAddress,
        lending_position_token: EsdtTokenIdentifier,
        lending_position_nonce: u64,
        supplied_token: EsdtTokenIdentifier,
        supplied_amount: &ManagedDecimal<Self::Api, NumDecimals>,
        borrowed_token: EsdtTokenIdentifier,
        swap_steps: ManagedArgBuffer<Self::Api>,
    ) {
        let back_transfers = self
            .tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .repay_debt_with_collateral(
                supplied_token,
                &self.md_to_biguint(supplied_amount),
                borrowed_token,
                false,
                OptionalValue::Some(swap_steps),
            )
            .single_esdt(
                &lending_position_token,
                lending_position_nonce,
                &BigUint::from(1u8),
            )
            .returns(ReturnsBackTransfers)
            .sync_call();

        let bt_as_payment = back_transfers.to_single_esdt();
        require!(
            bt_as_payment.token_identifier == lending_position_token,
            ERROR_INVALID_LENDING_POSITION_TOKEN
        );
        require!(
            bt_as_payment.token_nonce == lending_position_nonce,
            ERROR_INVALID_LENDING_POSITION_NONCE
        );
    }

    /// Gets the total supplied (collateral) amount of a specific token.
    ///
    /// Queries the lending protocol for the current collateral balance.
    /// Returns zero if the vault has no collateral.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `lending_position_nonce` - Nonce of the position NFT
    /// - `supplied_token` - Token identifier to query
    /// - `has_collateral` - Whether the vault has active collateral
    ///
    /// # Returns
    /// Total supplied amount as ManagedDecimal.
    fn get_total_supplied(
        &self,
        lending_address: &ManagedAddress,
        lending_position_nonce: u64,
        supplied_token: &EsdtTokenIdentifier,
        has_collateral: bool,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        if !has_collateral {
            return self.md_zero(WAD_PRECISION);
        }

        self.tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .collateral_amount_for_token(lending_position_nonce, supplied_token)
            .returns(ReturnsResult)
            .sync_call_readonly()
    }

    /// Gets the total supplied (collateral) amount converted to EGLD value.
    ///
    /// Queries the lending protocol for the total collateral value in EGLD.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `lending_position_nonce` - Nonce of the position NFT
    ///
    /// # Returns
    /// Total collateral value in EGLD as ManagedDecimal.
    fn get_total_supplied_in_egld(
        &self,
        lending_address: &ManagedAddress,
        lending_position_nonce: u64,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        self.tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .total_collateral_in_egld(lending_position_nonce)
            .returns(ReturnsResult)
            .sync_call_readonly()
    }

    /// Gets the total borrowed (debt) amount of a specific token.
    ///
    /// Queries the lending protocol for the current debt balance.
    /// Returns zero if the vault has no debt.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `lending_position_nonce` - Nonce of the position NFT
    /// - `borrowed_token` - Token identifier to query
    /// - `has_debt` - Whether the vault has active debt
    ///
    /// # Returns
    /// Total borrowed amount as ManagedDecimal.
    fn get_total_borrowed(
        &self,
        lending_address: &ManagedAddress,
        lending_position_nonce: u64,
        borrowed_token: &EsdtTokenIdentifier,
        has_debt: bool,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        if !has_debt {
            return self.md_zero(WAD_PRECISION);
        }

        self.tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .borrow_amount_for_token(lending_position_nonce, borrowed_token)
            .returns(ReturnsResult)
            .sync_call_readonly()
    }

    /// Gets the total borrowed (debt) amount converted to EGLD value.
    ///
    /// Queries the lending protocol for the total debt value in EGLD.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `lending_position_nonce` - Nonce of the position NFT
    ///
    /// # Returns
    /// Total debt value in EGLD as ManagedDecimal.
    fn get_total_borrowed_in_egld(
        &self,
        lending_address: &ManagedAddress,
        lending_position_nonce: u64,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        self.tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .total_borrow_in_egld(lending_position_nonce)
            .returns(ReturnsResult)
            .sync_call_readonly()
    }

    /// Gets the USD price of a token from the lending protocol's oracle.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `token` - Token identifier (EGLD or ESDT)
    ///
    /// # Returns
    /// Token price in USD as ManagedDecimal.
    fn get_token_price_in_usd(
        &self,
        lending_address: &ManagedAddress,
        token: &EgldOrEsdtTokenIdentifier,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        self.tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .usd_price(token)
            .returns(ReturnsResult)
            .sync_call_readonly()
    }

    /// Gets the EGLD-denominated price of a token from the lending protocol's oracle.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `token` - Token identifier (EGLD or ESDT)
    ///
    /// # Returns
    /// Token price in EGLD as ManagedDecimal.
    fn get_token_price_in_egld(
        &self,
        lending_address: &ManagedAddress,
        token: &EgldOrEsdtTokenIdentifier,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        self.tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .egld_price(token)
            .returns(ReturnsResult)
            .sync_call_readonly()
    }

    /// Checks if the vault's lending position can be liquidated.
    ///
    /// A position becomes liquidatable when the health factor falls below 1,
    /// meaning the debt exceeds the safe collateral threshold.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `lending_position_nonce` - Nonce of the position NFT
    ///
    /// # Returns
    /// `true` if the position can be liquidated, `false` otherwise.
    fn can_be_liquidated(
        &self,
        lending_address: &ManagedAddress,
        lending_position_nonce: u64,
    ) -> bool {
        self.tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .can_be_liquidated(lending_position_nonce)
            .returns(ReturnsResult)
            .sync_call_readonly()
    }

    /// Gets the health factor of the vault's lending position.
    ///
    /// The health factor is a measure of the position's safety:
    /// - HF > 1: Position is safe
    /// - HF = 1: Position is at the liquidation threshold
    /// - HF < 1: Position can be liquidated
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `lending_position_nonce` - Nonce of the position NFT
    ///
    /// # Returns
    /// Health factor as ManagedDecimal.
    fn get_health_factor(
        &self,
        lending_address: &ManagedAddress,
        lending_position_nonce: u64,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        self.tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .health_factor(lending_position_nonce)
            .returns(ReturnsResult)
            .sync_call_readonly()
    }

    /// Gets the amount of collateral available for liquidation in EGLD value.
    ///
    /// When a position is liquidatable, this returns the amount of collateral
    /// that can be seized by liquidators. Returns zero if position is healthy.
    ///
    /// # Arguments
    /// - `lending_address` - Address of the lending controller
    /// - `lending_position_nonce` - Nonce of the position NFT
    ///
    /// # Returns
    /// Available liquidation collateral in EGLD as ManagedDecimal.
    fn get_liquidation_collateral_in_egld(
        &self,
        lending_address: &ManagedAddress,
        lending_position_nonce: u64,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        self.tx()
            .to(lending_address)
            .typed(xoxno_lending_controller_proxy::ControllerProxy)
            .liquidation_collateral_available(lending_position_nonce)
            .returns(ReturnsResult)
            .sync_call_readonly()
    }
}
