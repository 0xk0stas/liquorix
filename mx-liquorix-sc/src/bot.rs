//! # Bot Module
//!
//! Provides automated leverage and deleverage operations for the leveraged staking vault.
//!
//! ## Overview
//! Only the authorized bot address can execute these operations to manage
//! the leveraged position safely and efficiently within configured risk parameters.
//!
//! ## Risk Management Algorithm
//! The bot uses an LTV ratio (LTV = debt/collateral) based approach:
//! - **Safe threshold**: Target LTV ratio (default: 40%)
//! - **Inaction zone**: Range around safe threshold where no action is needed (default: ±5%)
//!
//! Decision logic:
//! - If ltv_ratio > upper_bound (45%): Deleverage to reduce risk
//! - If ltv_ratio in [35%, 45%]: No action needed
//! - If ltv_ratio < lower_bound (35%): Leverage to increase yield

use crate::constants::{BPS, BPS_PRECISION, WAD_PRECISION};
use crate::errors::{
    ERROR_INVALID_COLLATERAL_TO_WITHDRAW, ERROR_INVALID_COLLATERAL_TO_WITHDRAW_WRT_DEBT,
    ERROR_INVALID_TARGET_LTV_RATIO_BPS,
};
use crate::structs::{BotAction, BotInfo, BotInfoType};
use multiversx_sc::imports::*;

/// Module for automated bot operations on the leveraged position.
///
/// The bot is responsible for:
/// - Increasing leverage by borrowing and supplying more collateral
/// - Decreasing leverage by repaying debt and reducing collateral
#[multiversx_sc::module]
pub trait BotModule:
    crate::system::manage::ManageModule
    + crate::system::admins::AdminsModule
    + crate::system::pause::PauseModule
    + crate::system::storage::StorageModule
    + crate::xoxno::lending::LendingModule
    + crate::xoxno::swap_router::SwapRouterModule
    + crate::system::utils::UtilsModule
    + crate::xoxno::liquid_staking::LiquidStakingModule
    // + crate::vault::VaultModule
    + crate::system::attributes::AttributesModule
{
    // === Endpoints ===

    /// Increases the leverage of the vault position.
    ///
    /// This endpoint borrows additional tokens and supplies them as collateral
    /// to increase the overall yield.
    ///
    /// # Arguments
    /// - `amount_to_borrow` - Amount of the borrowed token to borrow
    /// - `decimals` - Number of decimals for the borrowed token
    /// - `swap_args` - Arguments for the swap operation (e.g. USDC -> EGLD)
    ///
    /// # Access Control
    /// Only callable by the authorized bot address.
    #[endpoint(leverage)]
    fn leverage(
        &self,
        borrowed_amount: BigUint,
        decimals: usize,
        swap_args: ManagedArgBuffer<Self::Api>,
    ) {
        self.require_is_bot(&self.caller());

        let lending_address = self.lending_address().get();
        let lending_position_token = self.lending_position_token().get();
        let lending_position_nonce = self.lending_position_nonce().get();
        let borrowed_token = self.borrowed_token().get();
        let supplied_token = self.supplied_token().get();
        let swap_router_address = self.swap_router_address().get();

        let borrow_amount_md = self.biguint_to_md(borrowed_amount.clone(), decimals);

        let total_collateral_in_egld =
            self.get_total_supplied_in_egld(&lending_address, lending_position_nonce);
        let total_debt_in_egld =
            self.get_total_borrowed_in_egld(&lending_address, lending_position_nonce);

        let borrowed_token_price_in_egld = self.get_token_price_in_egld(
            &lending_address,
            &EgldOrEsdtTokenIdentifier::esdt(borrowed_token.clone()),
        );
        let borrow_amount_in_egld = borrow_amount_md.clone().mul(borrowed_token_price_in_egld);

        let new_total_collateral_in_egld =
            total_collateral_in_egld.add(borrow_amount_in_egld.clone());
        let new_total_debt_in_egld = total_debt_in_egld.add(borrow_amount_in_egld);

        let new_ltv_ratio_bps =
            self.calculate_ltv_ratio_bps(new_total_collateral_in_egld, new_total_debt_in_egld);
        self.require_target_ltv_ratio_within_suggested_bounds(
            &new_ltv_ratio_bps,
            &self.biguint_to_md(
                BigUint::from(self.safe_threshold_bps().get()),
                BPS_PRECISION,
            ),
            &self.biguint_to_md(BigUint::from(self.inaction_zone_bps().get()), BPS_PRECISION),
        );

        self.execute_borrow(
            &lending_address,
            borrowed_token.clone(),
            &borrow_amount_md,
            lending_position_token.clone(),
            lending_position_nonce,
        );

        let egld_payment = self.execute_swap(
            &swap_router_address,
            &borrowed_token,
            &borrowed_amount,
            &EgldOrEsdtTokenIdentifier::egld(),
            &self.caller(),
            swap_args,
        );

        let xegld_payment =
            self.execute_delegation(&self.liquid_staking_address().get(), &egld_payment.amount);

        let supply_amount_md = self.biguint_to_md(xegld_payment.amount, WAD_PRECISION);
        self.execute_supply(
            &lending_address,
            supplied_token,
            &supply_amount_md,
            lending_position_token,
            lending_position_nonce,
        );

        self.has_debt().set_if_empty(true);
    }

    /// Decreases the leverage of the vault position.
    ///
    /// This endpoint repays borrowed tokens using collateral to reduce risk exposure.
    /// Uses the lending protocol's built-in swap functionality to convert collateral
    /// to borrowed token and repay debt in a single transaction.
    ///
    /// # Arguments
    /// - `collateral_amount` - Amount of the collateral token to use for repayment
    /// - `swap_steps` - Steps for the internal swap operation (e.g. xEGLD -> USDC)
    ///
    /// # Access Control
    /// Only callable by the authorized bot address.
    #[endpoint(deleverage)]
    fn deleverage(&self, collateral_amount: BigUint, swap_steps: ManagedArgBuffer<Self::Api>) {
        self.require_is_bot(&self.caller());

        let lending_address = self.lending_address().get();
        let lending_position_token = self.lending_position_token().get();
        let lending_position_nonce = self.lending_position_nonce().get();
        let supplied_token = self.supplied_token().get();
        let borrowed_token = self.borrowed_token().get();
        let has_collateral = self.has_collateral().get();

        let collateral_amount_md = self.biguint_to_md(collateral_amount, WAD_PRECISION);
        let total_collateral = self.get_total_supplied(
            &lending_address,
            lending_position_nonce,
            &supplied_token,
            has_collateral,
        );
        require!(
            collateral_amount_md.le(&total_collateral),
            ERROR_INVALID_COLLATERAL_TO_WITHDRAW
        );

        let total_collateral_in_egld =
            self.get_total_supplied_in_egld(&lending_address, lending_position_nonce);
        let collateral_to_withdraw_in_egld = collateral_amount_md
            .clone()
            .mul(total_collateral_in_egld.clone())
            .div(total_collateral);
        let total_debt_in_egld =
            self.get_total_borrowed_in_egld(&lending_address, lending_position_nonce);
        require!(
            collateral_to_withdraw_in_egld.le(&total_debt_in_egld),
            ERROR_INVALID_COLLATERAL_TO_WITHDRAW_WRT_DEBT
        );

        let new_total_collateral_in_egld =
            total_collateral_in_egld.sub(collateral_to_withdraw_in_egld.clone());
        let new_total_debt_in_egld = total_debt_in_egld
            .clone()
            .sub(collateral_to_withdraw_in_egld.clone());
        let new_ltv_ratio_bps = self
            .calculate_ltv_ratio_bps(new_total_collateral_in_egld, new_total_debt_in_egld.clone());
        self.require_target_ltv_ratio_within_suggested_bounds(
            &new_ltv_ratio_bps,
            &self.biguint_to_md(
                BigUint::from(self.safe_threshold_bps().get()),
                BPS_PRECISION,
            ),
            &self.biguint_to_md(BigUint::from(self.inaction_zone_bps().get()), BPS_PRECISION),
        );

        self.execute_repay_with_collateral(
            &lending_address,
            lending_position_token,
            lending_position_nonce,
            supplied_token,
            &collateral_amount_md,
            borrowed_token,
            swap_steps,
        );

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

        self.event_deleverage(
            &collateral_amount_md,
            &collateral_to_withdraw_in_egld,
            &new_total_debt_in_egld,
        );
    }

    // === Views ===

    /// Returns information for the bot to decide whether to leverage, deleverage, or do nothing.
    ///
    /// Decision logic based on LTV ratio (LTV = debt/collateral):
    /// - Safe threshold: 40% (4000 BPS) - the target ratio
    /// - Inaction zone: 35%-45% (safe ± 5%)
    /// - If ltv_ratio > 45%: Deleverage to 40% (safe threshold)
    /// - If ltv_ratio in [35%, 45%]: Do nothing
    /// - If ltv_ratio < 35%: Leverage to 40% (safe threshold)
    ///
    /// # Arguments
    /// - `opt_target_ltv_ratio_bps` - Optional target LTV ratio in BPS (basis points).
    ///   If not provided, defaults to the safe threshold.
    ///
    /// The target LTV ratio must be within the inaction zone bounds.
    /// It allows the bot to adjust its target dynamically while ensuring safety.
    ///
    /// # Returns
    /// BotInfo containing the action to take and amounts to adjust.
    #[view(getBotInfo)]
    fn get_bot_info(
        &self,
        opt_target_ltv_ratio_bps: OptionalValue<BigUint>,
    ) -> BotInfo<Self::Api> {
        let safe_threshold_bps_md = self.biguint_to_md(
            BigUint::from(self.safe_threshold_bps().get()),
            BPS_PRECISION,
        );
        let inaction_zone_bps_md =
            self.biguint_to_md(BigUint::from(self.inaction_zone_bps().get()), BPS_PRECISION);
        let target_ltv_ratio_bps_md = match opt_target_ltv_ratio_bps {
            OptionalValue::Some(value) => self.biguint_to_md(value.clone(), BPS_PRECISION),
            OptionalValue::None => safe_threshold_bps_md.clone(),
        };
        let (inaction_lower_bound_bps_md, inaction_upper_bound_bps_md) = self
            .get_ltv_ratio_zone_bounds_md(
                target_ltv_ratio_bps_md.clone(),
                inaction_zone_bps_md.clone(),
            );
        self.require_target_ltv_ratio_within_suggested_bounds(
            &target_ltv_ratio_bps_md,
            &safe_threshold_bps_md,
            &inaction_zone_bps_md,
        );

        let lending_address = self.lending_address().get();
        let lending_position_nonce = self.lending_position_nonce().get();

        let total_collateral_in_egld =
            self.get_total_supplied_in_egld(&lending_address, lending_position_nonce);
        let total_debt_in_egld =
            self.get_total_borrowed_in_egld(&lending_address, lending_position_nonce);
        let can_be_liquidated = self.can_be_liquidated(&lending_address, lending_position_nonce);

        let current_ltv_ratio_bps = self
            .calculate_ltv_ratio_bps(total_collateral_in_egld.clone(), total_debt_in_egld.clone());

        let suggested_action = if current_ltv_ratio_bps.gt(&inaction_upper_bound_bps_md) {
            BotAction::Deleverage
        } else if current_ltv_ratio_bps.ge(&inaction_lower_bound_bps_md) {
            BotAction::Inaction
        } else {
            BotAction::Leverage
        };

        let adjustment_amount_in_egld = self.calculate_adjustment_amount_in_egld(
            total_collateral_in_egld.clone(),
            total_debt_in_egld.clone(),
            target_ltv_ratio_bps_md.clone(),
        );

        let supplied_token_price_in_egld = self.get_token_price_in_egld(
            &lending_address,
            &EgldOrEsdtTokenIdentifier::esdt(self.supplied_token().get()),
        );
        let borrowed_token_price_in_egld = self.get_token_price_in_egld(
            &lending_address,
            &EgldOrEsdtTokenIdentifier::esdt(self.borrowed_token().get()),
        );

        BotInfo::new(
            suggested_action,
            current_ltv_ratio_bps,
            safe_threshold_bps_md,
            inaction_zone_bps_md,
            adjustment_amount_in_egld,
            total_collateral_in_egld,
            total_debt_in_egld,
            supplied_token_price_in_egld,
            borrowed_token_price_in_egld,
            can_be_liquidated,
        )
    }

    /// Returns the BotInfo as a Multi Value.
    #[view(getBotInfoMultiValue)]
    fn get_bot_info_multi_value(
        &self,
        opt_target_ltv_ratio_bps: OptionalValue<BigUint>,
    ) -> BotInfoType<Self::Api> {
        self.get_bot_info(opt_target_ltv_ratio_bps)
            .into_multi_value()
    }

    // === Private ===

    /// Calculates the amount needed to adjust the position to reach the target LTV ratio.
    ///
    /// Uses the formula:
    /// `adjustment = |debt - collateral * target_ratio| / (1 - target_ratio)`
    ///
    /// This represents the EGLD value that needs to be borrowed (leverage) or
    /// repaid (deleverage) to bring the LTV ratio to the target.
    ///
    /// # Arguments
    /// - `total_collateral_in_egld` - Total collateral value (in EGLD)
    /// - `total_debt_in_egld` - Total borrowed value (in EGLD)
    /// - `target_ltv_ratio_bps` - Target LTV ratio in BPS
    ///
    /// # Returns
    /// Adjustment amount in EGLD as ManagedDecimal.
    fn calculate_adjustment_amount_in_egld(
        &self,
        total_collateral_in_egld: ManagedDecimal<Self::Api, NumDecimals>,
        total_debt_in_egld: ManagedDecimal<Self::Api, NumDecimals>,
        target_ltv_ratio_bps: ManagedDecimal<Self::Api, NumDecimals>,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        // adjustment_amount = |debt - collateral * target_ratio | / (1 - target_ratio)
        let bps_multiplier_md = self.biguint_to_md(BigUint::from(BPS), BPS_PRECISION);
        let target_ratio_complement_md =
            bps_multiplier_md.clone().sub(target_ltv_ratio_bps.clone());
        let desired_debt_md = total_collateral_in_egld
            .mul(target_ltv_ratio_bps)
            .div(bps_multiplier_md.clone());
        self.abs_difference_md(total_debt_in_egld, desired_debt_md).mul(bps_multiplier_md)
            .div(target_ratio_complement_md)
    }

    /// Calculates the current LTV ratio in basis points (BPS).
    ///
    /// The LTV ratio represents the Loan-to-Value ratio of the position.
    /// Uses the formula: `ltv_ratio_bps = (total_debt * BPS) / total_collateral`
    ///
    /// A higher ratio means more risk (closer to liquidation).
    /// Returns 0 if there's no collateral.
    ///
    /// # Arguments
    /// - `total_collateral_in_egld` - Total collateral value (in EGLD)
    /// - `total_debt_in_egld` - Total borrowed value (in EGLD)
    ///
    /// # Returns
    /// LTV ratio in BPS as ManagedDecimal (e.g., 4000 = 40%).
    fn calculate_ltv_ratio_bps(
        &self,
        total_collateral_in_egld: ManagedDecimal<Self::Api, NumDecimals>,
        total_debt_in_egld: ManagedDecimal<Self::Api, NumDecimals>,
    ) -> ManagedDecimal<Self::Api, NumDecimals> {
        let bps_multiplier_md = self.biguint_to_md(BigUint::from(BPS), BPS_PRECISION);

        if self.is_md_gt_zero(&total_collateral_in_egld) {
            let debt_scaled = total_debt_in_egld.clone().mul(bps_multiplier_md.clone());
            debt_scaled.div(total_collateral_in_egld.clone())
        } else {
            self.md_zero(BPS_PRECISION)
        }
    }

    /// Returns the allowed bounds for the target LTV ratio based on the inaction zone.
    ///
    /// # Arguments
    /// - `target_ltv_ratio_bps` - The target LTV ratio in BPS
    /// - `inaction_zone_bps_md` - The inaction zone in BPS
    ///
    /// # Returns
    /// A tuple containing the lower and upper bounds as ManagedDecimal.
    fn get_ltv_ratio_zone_bounds_md(
        &self,
        target_ltv_ratio_bps: ManagedDecimal<Self::Api, NumDecimals>,
        inaction_zone_bps_md: ManagedDecimal<Self::Api, NumDecimals>,
    ) -> (
        ManagedDecimal<Self::Api, NumDecimals>,
        ManagedDecimal<Self::Api, NumDecimals>,
    ) {
        let inaction_lower_bound_bps_md = target_ltv_ratio_bps
            .clone()
            .sub(inaction_zone_bps_md.clone());
        let inaction_upper_bound_bps_md = target_ltv_ratio_bps
            .clone()
            .add(inaction_zone_bps_md.clone());

        (inaction_lower_bound_bps_md, inaction_upper_bound_bps_md)
    }

    /// Ensures the target LTV ratio is within the suggested inaction zone bounds.
    ///
    /// # Arguments
    /// - `target_ltv_ratio_bps` - The target LTV ratio in BPS
    /// - `safe_threshold_bps_md` - The safe threshold in BPS
    /// - `inaction_zone_bps_md` - The inaction zone in BPS
    ///
    /// # Panics
    /// Panics if the target LTV ratio is outside the suggested inaction zone bounds.
    fn require_target_ltv_ratio_within_suggested_bounds(
        &self,
        target_ltv_ratio_bps: &ManagedDecimal<Self::Api, NumDecimals>,
        safe_threshold_bps_md: &ManagedDecimal<Self::Api, NumDecimals>,
        inaction_zone_bps_md: &ManagedDecimal<Self::Api, NumDecimals>,
    ) {
        let (inaction_lower_bound_bps_md, inaction_upper_bound_bps_md) = self
            .get_ltv_ratio_zone_bounds_md(
                safe_threshold_bps_md.clone(),
                inaction_zone_bps_md.clone(),
            );

        require!(
            target_ltv_ratio_bps.ge(&inaction_lower_bound_bps_md)
                && target_ltv_ratio_bps.le(&inaction_upper_bound_bps_md),
            ERROR_INVALID_TARGET_LTV_RATIO_BPS
        );
    }

    // === Events ===

    // #[event("deposit")]
    // fn event_deposit(
    //     &self,
    //     #[indexed] supplied_amount: &ManagedDecimal<Self::Api, NumDecimals>,
    //     #[indexed] share_returned: &ManagedDecimal<Self::Api, NumDecimals>,
    // );

    /// Event emitted when a deleverage operation is executed.
    #[event("deleverage")]
    fn event_deleverage(
        &self,
        #[indexed] collateral_amount: &ManagedDecimal<Self::Api, NumDecimals>,
        #[indexed] collateral_in_egld: &ManagedDecimal<Self::Api, NumDecimals>,
        #[indexed] new_debt_in_egld: &ManagedDecimal<Self::Api, NumDecimals>,
    );
}
