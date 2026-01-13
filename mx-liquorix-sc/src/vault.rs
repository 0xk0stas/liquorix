//! # Vault Module
//!
//! Handles user deposits and withdrawals for the leveraged staking vault.
//!
//! ## Overview
//! Users can deposit EGLD or xEGLD tokens and receive share tokens representing
//! their proportional ownership of the vault.

use crate::{
    constants::WAD_PRECISION,
    errors::{
        ERROR_INSUFFICIENT_COLLATERAL_FOR_DEBT, ERROR_INVALID_COLLATERAL_TO_DEBT_RATIO,
        ERROR_INVALID_COLLATERAL_TO_WITHDRAW, ERROR_INVALID_DELEGATED_AMOUNT,
        ERROR_INVALID_DEPOSIT_AMOUNT, ERROR_INVALID_DEPOSIT_TOKEN,
        ERROR_INVALID_SHARE_TOKEN_PAYMENT, ERROR_LENDING_POSITION_ALREADY_EXISTS,
        ERROR_LENDING_POSITION_DOES_NOT_EXIST,
    },
    structs::{LendingInfo, LendingInfoMultiValue, ShareTokenAttributes},
};
use multiversx_sc::imports::*;

/// Module for user interactions with the leveraged staking vault.
///
/// ## Core Functionality
/// - **Deposits**: Accept EGLD or xEGLD and mint share tokens
/// - **Withdrawals**: Burn share tokens to redeem proportional collateral and debt
/// - **Views**: Query lending info, TVL, and position PnL
///
/// ## Share Token Accounting
/// Share tokens represent proportional ownership of the vault's equity
/// (total collateral minus total debt). The share price increases as
/// the vault earns yield from leveraged staking.
#[multiversx_sc::module]
pub trait VaultModule:
    crate::system::pause::PauseModule
    + crate::system::admins::AdminsModule
    + crate::system::storage::StorageModule
    + crate::system::utils::UtilsModule
    + crate::xoxno::liquid_staking::LiquidStakingModule
    + crate::xoxno::lending::LendingModule
    + crate::xoxno::swap_router::SwapRouterModule
    + crate::system::attributes::AttributesModule
{
    // === Endpoints ===

    /// Deposits EGLD or xEGLD tokens into the vault.
    ///
    /// When EGLD is deposited, it is first delegated to liquid staking to receive xEGLD.
    /// The xEGLD is then supplied to the lending protocol as collateral.
    /// The user receives share tokens proportional to their contribution.
    ///
    /// ## Share Calculation
    /// - First deposit: shares = deposit_amount (1:1 ratio)
    /// - Subsequent deposits: `shares = (total_shares * deposit_egld_value) / vault_equity`
    ///   where `vault_equity = total_collateral_in_egld - total_debt_in_egld`
    ///
    /// ## Payment
    /// - EGLD: Will be converted to xEGLD via liquid staking
    /// - xEGLD (supplied_token): Will be directly supplied to lending
    ///
    /// ## Returns
    /// Share token (DynamicMeta NFT) representing the user's share of the vault.
    /// The NFT attributes store the snapshot of total shares and supplied amount
    /// at the time of deposit for PnL calculations.
    ///
    /// ## Panics
    /// - If the contract is paused
    /// - If the deposit amount is zero
    /// - If the token is not EGLD or the configured supplied_token (xEGLD)
    #[payable]
    #[endpoint(deposit)]
    fn deposit(&self) -> EsdtTokenPayment {
        // TODO: Add optional argument for accepting a share token payment and merging it with the newly created share token

        self.require_not_paused();

        let payment = self.call_value().egld_or_single_esdt();
        require!(
            self.is_biguint_gt_zero(&payment.amount),
            ERROR_INVALID_DEPOSIT_AMOUNT
        );

        let supplied_token = self.supplied_token().get();
        let liquid_staking_address = self.liquid_staking_address().get();
        let payment_to_supply = if payment.token_identifier.is_egld() {
            let delagation_payment =
                self.execute_delegation(&liquid_staking_address, &payment.amount);
            require!(
                self.is_biguint_gt_zero(&delagation_payment.amount),
                ERROR_INVALID_DELEGATED_AMOUNT
            );
            delagation_payment
        } else {
            require!(
                payment.token_identifier == supplied_token,
                ERROR_INVALID_DEPOSIT_TOKEN
            );
            payment.unwrap_esdt()
        };

        let total_shares = self.total_shares().get();
        let lending_address = self.lending_address().get();
        let lending_position_token = self.lending_position_token().get();
        let lending_position_nonce = self.lending_position_nonce().get();
        let supply_amount_as_md = self.biguint_to_md(payment_to_supply.amount, WAD_PRECISION);

        let deposit_share = if self.is_md_eq_zero(&total_shares) {
            require!(
                lending_position_nonce == 0,
                ERROR_LENDING_POSITION_ALREADY_EXISTS
            );

            let lending_position_nonce = self.create_supply_position(
                &lending_address,
                supplied_token,
                &supply_amount_as_md,
                &lending_position_token,
            );

            self.lending_position_nonce().set(lending_position_nonce);

            supply_amount_as_md.clone()
        } else {
            require!(
                lending_position_nonce != 0,
                ERROR_LENDING_POSITION_DOES_NOT_EXIST
            );

            let share_amount = self.calculate_deposit_share_amount(
                total_shares,
                self.get_ls_value_in_egld(&liquid_staking_address, &supply_amount_as_md),
                self.get_total_supplied_in_egld(&lending_address, lending_position_nonce),
                self.get_total_borrowed_in_egld(&lending_address, lending_position_nonce),
            );

            require!(
                share_amount.gt(&self.md_zero(WAD_PRECISION)),
                ERROR_INVALID_DEPOSIT_AMOUNT
            );

            self.execute_supply(
                &lending_address,
                supplied_token,
                &supply_amount_as_md,
                lending_position_token,
                lending_position_nonce,
            );

            share_amount
        };

        self.has_collateral().set_if_empty(true);
        self.total_shares().update(|total_shares| {
            *total_shares += &deposit_share;
        });

        self.event_deposit(&supply_amount_as_md, &deposit_share);

        self.share_token().nft_create_and_send(
            &self.caller(),
            self.md_to_biguint(&deposit_share),
            &self.attributes_to_buffer(
                deposit_share,
                supply_amount_as_md,
                self.current_ts_millis(),
            ),
        )
    }

    /// Withdraws tokens from the vault by burning share tokens.
    ///
    /// Calculates the proportional share of collateral and debt based on
    /// the share tokens provided. If the vault has outstanding debt, the user's
    /// share of debt is first repaid using their collateral share, and then
    /// the remaining collateral is withdrawn and transferred to the caller.
    ///
    /// ## Withdrawal Logic
    /// 1. Calculate user's share of total collateral
    /// 2. Calculate user's share of total debt (if any)
    /// 3. If debt exists: repay debt using collateral via swap
    /// 4. Withdraw remaining collateral and transfer to user
    ///
    /// # Arguments
    /// - `swap_steps` - Optional swap route arguments for repaying debt with collateral.
    ///   Required when the vault has outstanding debt.
    ///
    /// # Payment
    /// Share token to be burned for withdrawal.
    ///
    /// # Transfers
    /// Sends the withdrawn collateral tokens (xEGLD) directly to the caller.
    ///
    /// # Panics
    /// - Panics if the contract is paused
    /// - Panics if the share token payment is invalid
    /// - Panics if the calculated withdrawal amount is zero
    /// - Panics if collateral is insufficient to cover the debt share
    #[payable]
    #[endpoint(withdraw)]
    fn withdraw(&self, swap_steps: OptionalValue<ManagedArgBuffer<Self::Api>>) {
        self.require_not_paused();

        let share_token = self.share_token().get_token_id();
        let share_payment = self.call_value().single_esdt();
        require!(
            share_payment.token_identifier == share_token
                && self.is_biguint_gt_zero(&share_payment.amount),
            ERROR_INVALID_SHARE_TOKEN_PAYMENT
        );

        let total_shares = self.total_shares().get();
        let share_amount_as_md = self.biguint_to_md(share_payment.amount.clone(), WAD_PRECISION);

        let lending_address = self.lending_address().get();
        let lending_position_nonce = self.lending_position_nonce().get();
        let lending_position_token = self.lending_position_token().get();
        let supplied_token = self.supplied_token().get();
        let borrowed_token = self.borrowed_token().get();
        let has_debt = self.has_debt().get();

        let total_collateral = self.get_total_supplied(
            &lending_address,
            lending_position_nonce,
            &supplied_token,
            self.has_collateral().get(),
        );

        let user_collateral_share = self.calculate_collateral_share_to_withdraw(
            total_shares.clone(),
            share_amount_as_md.clone(),
            total_collateral.clone(),
        );

        require!(
            self.is_md_gt_zero(&user_collateral_share),
            ERROR_INVALID_COLLATERAL_TO_WITHDRAW
        );

        let total_debt_in_egld =
            self.get_total_borrowed_in_egld(&lending_address, lending_position_nonce);

        let user_debt_share_in_egld = self.calculate_debt_share_to_repay(
            total_shares.clone(),
            share_amount_as_md.clone(),
            total_debt_in_egld.clone(),
        );

        let amount_to_send = if self.is_md_gt_zero(&user_debt_share_in_egld) && has_debt {
            let supplied_token_price_in_egld = self.get_token_price_in_egld(
                &lending_address,
                &EgldOrEsdtTokenIdentifier::esdt(supplied_token.clone()),
            );
            // let borrowed_token_price_in_egld = self.get_token_price_in_egld(
            //     &lending_address,
            //     &EgldOrEsdtTokenIdentifier::esdt(borrowed_token.clone()),
            // );

            let collateral_needed_for_repayment = user_debt_share_in_egld
                .mul(self.wad_as_md())
                .div(supplied_token_price_in_egld);

            require!(
                user_collateral_share >= collateral_needed_for_repayment,
                ERROR_INSUFFICIENT_COLLATERAL_FOR_DEBT
            );

            let swap_args = swap_steps.into_option().unwrap();

            self.execute_repay_with_collateral(
                &lending_address,
                lending_position_token.clone(),
                lending_position_nonce,
                supplied_token.clone(),
                &collateral_needed_for_repayment,
                borrowed_token.clone(),
                swap_args,
            );

            user_collateral_share.sub(collateral_needed_for_repayment)
        } else {
            user_collateral_share
        };

        if self.is_md_gt_zero(&amount_to_send) {
            self.execute_withdraw(
                &lending_address,
                &supplied_token,
                &amount_to_send,
                lending_position_token,
                lending_position_nonce,
            );

            self.tx()
                .to(&self.caller())
                .single_esdt(&supplied_token, 0, &self.md_to_biguint(&amount_to_send))
                .transfer();
        }

        let new_attributes = self
            .process_new_share_attributes(share_payment.token_nonce, share_amount_as_md.clone());

        if self.is_md_gt_zero(&new_attributes.total_share_supply) {
            self.share_token().nft_update_attributes(
                share_payment.token_nonce,
                &self.attributes_to_buffer(
                    new_attributes.total_share_supply,
                    new_attributes.total_initial_supplied_amount,
                    new_attributes.last_interaction_ts_millis,
                ),
            );
        }

        self.share_token()
            .nft_burn(share_payment.token_nonce, &share_payment.amount);

        if total_shares == share_amount_as_md {
            self.has_collateral().set(false);
            self.has_debt().set(false);
            self.lending_position_nonce().clear();
        } else {
            let remaining_collateral =
                self.get_total_supplied_in_egld(&lending_address, lending_position_nonce);
            if !self.is_md_gt_zero(&remaining_collateral) {
                self.has_collateral().set(false);
            }
            let remaining_debt =
                self.get_total_borrowed_in_egld(&lending_address, lending_position_nonce);
            if !self.is_md_gt_zero(&remaining_debt) {
                self.has_debt().set(false);
            }
        }
        self.total_shares().update(|total_shares| {
            *total_shares -= &share_amount_as_md;
        });

        self.event_withdraw(&amount_to_send, &share_amount_as_md);
    }

    // === Views ===

    /// Returns the lending info for the vault's position as a LendingInfo struct.
    #[view(getLendingInfo)]
    fn get_lending_info(&self) -> LendingInfo<Self::Api> {
        let lending_address = self.lending_address().get();
        let lending_position_nonce = self.lending_position_nonce().get();
        let supplied_token = self.supplied_token().get();
        let borrowed_token = self.borrowed_token().get();

        LendingInfo::new(
            self.get_total_supplied(
                &lending_address,
                lending_position_nonce,
                &supplied_token,
                self.has_collateral().get(),
            ),
            self.get_token_price_in_usd(
                &lending_address,
                &EgldOrEsdtTokenIdentifier::esdt(supplied_token),
            ),
            self.get_total_supplied_in_egld(&lending_address, lending_position_nonce),
            self.get_total_borrowed(
                &lending_address,
                lending_position_nonce,
                &borrowed_token,
                self.has_debt().get(),
            ),
            self.get_token_price_in_usd(
                &lending_address,
                &EgldOrEsdtTokenIdentifier::esdt(borrowed_token),
            ),
            self.get_total_borrowed_in_egld(&lending_address, lending_position_nonce),
            self.get_token_price_in_usd(&lending_address, &EgldOrEsdtTokenIdentifier::egld()),
            self.get_health_factor(&lending_address, lending_position_nonce),
            self.can_be_liquidated(&lending_address, lending_position_nonce),
            self.get_liquidation_collateral_in_egld(&lending_address, lending_position_nonce),
        )
    }

    /// Returns the lending info for the vault's position as a MultiValue type.
    #[view(getLendingInfoMultiValue)]
    fn get_lending_info_multi_value(&self) -> LendingInfoMultiValue<Self::Api> {
        self.get_lending_info().into_multi_value()
    }

    /// Returns the Total Value Locked (TVL) in USD.
    ///
    /// TVL = (total_supplied * supplied_token_price_in_usd) - (total_borrowed * borrowed_token_price_in_usd)
    #[view(getTvl)]
    fn get_tvl(&self) -> ManagedDecimal<Self::Api, NumDecimals> {
        let lending_info = self.get_lending_info();

        let total_supplied_value = lending_info
            .total_supplied
            .mul(lending_info.supplied_token_price_in_usd);
        let total_borrowed_value = lending_info
            .total_borrowed
            .mul(lending_info.borrowed_token_price_in_usd);

        total_supplied_value.sub(total_borrowed_value)
    }

    /// Returns the PnL (Profit and Loss) for a list of share token positions.
    ///
    /// Given an address and a list of share token nonces, calculates:
    /// - For each token: share_initial_value and share_current_value
    /// - Returns tuple of (pnl, pnl_percentage) where:
    ///   - pnl = total_share_current_value - total_share_initial_value
    ///   - pnl_percentage = pnl * 100 / total_share_initial_value
    ///
    /// # Validation
    /// - Skips any share tokens that do not have a balance for the given address
    /// or the address is from another shard.
    ///
    /// # Arguments
    /// - `address` - The address holding the share tokens
    /// - `nonces` - List of share token nonces to calculate PnL for
    ///
    /// # Returns
    /// The total PnL as a ManagedDecimal.
    #[view(getPositionsPnl)]
    fn get_positions_pnl(
        &self,
        address: ManagedAddress,
        nonces: MultiValueEncoded<u64>,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        let share_token_id = self.share_token().get_token_id();
        let total_shares = self.total_shares().get();
        let lending_info = self.get_lending_info();

        let mut total_share_initial_value = self.md_zero(WAD_PRECISION);
        let mut total_share_current_value = self.md_zero(WAD_PRECISION);

        for nonce in nonces.into_iter() {
            let share_balance =
                self.blockchain()
                    .get_esdt_balance(&address, &share_token_id, nonce);

            if self.is_biguint_eq_zero(&share_balance) {
                continue;
            }

            let share_amount = self.biguint_to_md(share_balance, WAD_PRECISION);
            let share_attributes = self.get_share_token_attributes_from_address(nonce, &address);

            let share_initial_value = share_amount
                .clone()
                .mul(share_attributes.total_initial_supplied_amount)
                .mul(lending_info.supplied_token_price_in_usd.clone())
                .div(share_attributes.total_share_supply);

            let share_current_value = share_amount
                .mul(lending_info.total_supplied.clone())
                .mul(lending_info.supplied_token_price_in_usd.clone())
                .div(total_shares.clone());

            total_share_initial_value = total_share_initial_value.add(share_initial_value);
            total_share_current_value = total_share_current_value.add(share_current_value);
        }

        total_share_current_value
            .clone()
            .sub(total_share_initial_value.clone())
    }

    // === Private ===

    /// Calculates the share tokens to mint for a deposit.
    ///
    /// Uses the formula: shares = (total_shares * deposit) / (total_supply - total_debt)
    ///
    /// # Arguments
    /// - `total_shares` - Current total share supply
    /// - `added_supply_in_egld` - Amount being deposited (in EGLD value)
    /// - `total_current_supply_in_egld` - Total collateral value (in EGLD)
    /// - `total_current_debt_in_egld` - Total borrowed value (in EGLD)
    fn calculate_deposit_share_amount(
        &self,
        total_shares: ManagedDecimal<Self::Api, NumDecimals>,
        added_supply_in_egld: ManagedDecimal<Self::Api, NumDecimals>,
        total_current_supply_in_egld: ManagedDecimal<Self::Api, NumDecimals>,
        total_current_debt_in_egld: ManagedDecimal<Self::Api, NumDecimals>,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        require!(
            total_current_supply_in_egld > total_current_debt_in_egld,
            ERROR_INVALID_COLLATERAL_TO_DEBT_RATIO
        );

        (total_shares.mul(added_supply_in_egld))
            .div(total_current_supply_in_egld.sub(total_current_debt_in_egld))
    }

    /// Calculates the collateral amount to withdraw for a given share amount.
    ///
    /// Uses the formula: collateral = (total_collateral * share_amount) / total_shares
    ///
    /// # Arguments
    /// - `total_shares` - Current total share supply
    /// - `share_amount` - Amount of share tokens being burned
    /// - `total_collateral` - Total collateral value
    fn calculate_collateral_share_to_withdraw(
        &self,
        total_shares: ManagedDecimal<Self::Api, NumDecimals>,
        share_amount: ManagedDecimal<Self::Api, NumDecimals>,
        total_collateral: ManagedDecimal<Self::Api, NumDecimals>,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        (total_collateral.mul(share_amount)).div(total_shares)
    }

    /// Calculates the debt amount to repay for a given share amount.
    ///
    /// Uses the formula: debt = (total_debt * share_amount) / total_shares
    ///
    /// # Arguments
    /// - `total_shares` - Current total share supply
    /// - `share_amount` - Amount of share tokens being burned
    /// - `total_debt` - Total borrowed value
    fn calculate_debt_share_to_repay(
        &self,
        total_shares: ManagedDecimal<Self::Api, NumDecimals>,
        share_amount: ManagedDecimal<Self::Api, NumDecimals>,
        total_debt: ManagedDecimal<Self::Api, NumDecimals>,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        (total_debt.mul(share_amount)).div(total_shares)
    }

    /// Updates the share token attributes after a withdrawal.
    ///
    /// # Arguments
    /// - `share_attributes` - Current attributes of the share token
    /// - `share_withdraw_amount` - Amount of share tokens being burned
    fn process_new_share_attributes(
        &self,
        share_token_nonce: u64,
        share_withdraw_amount: ManagedDecimal<Self::Api, NumDecimals>,
    ) -> ShareTokenAttributes<Self::Api> {
        let mut share_attributes = self.get_share_token_attributes(share_token_nonce);

        let new_total_share_supply = share_attributes
            .total_share_supply
            .clone()
            .sub(share_withdraw_amount.clone());

        let withdrawn_part_of_initial_supplied_amount = share_attributes
            .total_initial_supplied_amount
            .clone()
            .mul(share_withdraw_amount.clone())
            .div(share_attributes.total_share_supply.clone());

        let new_total_initial_supplied_amount = share_attributes
            .total_initial_supplied_amount
            .clone()
            .sub(withdrawn_part_of_initial_supplied_amount);

        share_attributes.update(
            new_total_share_supply,
            new_total_initial_supplied_amount,
            self.current_ts_millis(),
        );

        share_attributes
    }

    // === Events ===

    /// Emitted when a deposit is made.
    ///
    /// # Indexed Parameters
    /// - `supplied_amount` - Amount of tokens supplied
    /// - `share_returned` - Amount of share tokens minted
    #[event("deposit")]
    fn event_deposit(
        &self,
        #[indexed] supplied_amount: &ManagedDecimal<Self::Api, NumDecimals>,
        #[indexed] share_returned: &ManagedDecimal<Self::Api, NumDecimals>,
    );

    /// Emitted when a withdrawal is made.
    ///
    /// # Indexed Parameters
    /// - `withdrawn_amount` - Amount of tokens withdrawn
    /// - `share_burned` - Amount of share tokens burned
    #[event("withdraw")]
    fn event_withdraw(
        &self,
        #[indexed] withdrawn_amount: &ManagedDecimal<Self::Api, NumDecimals>,
        #[indexed] share_burned: &ManagedDecimal<Self::Api, NumDecimals>,
    );
}
