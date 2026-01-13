//! # Structs Module
//!
//! Defines data structures used throughout the smart contract.

use multiversx_sc::{derive_imports::*, imports::*};

use crate::constants::WAD_PRECISION;

/// Type alias for timestamps in milliseconds.
pub type TimestampInMillis = u64;

/// Contains complete system state information.
///
/// Used by views to return all relevant contract configuration and state.
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, ManagedVecItem)]
pub struct SystemInfo<M: ManagedTypeApi> {
    pub paused: bool,
    pub share_token: EsdtTokenIdentifier<M>,
    pub total_shares: ManagedDecimal<M, NumDecimals>,
    pub supplied_token: EsdtTokenIdentifier<M>,
    pub borrowed_token: EsdtTokenIdentifier<M>,
    pub liquid_staking_token: EsdtTokenIdentifier<M>,
    pub liquid_staking_nonce: u64,
    pub has_collateral: bool,
    pub has_debt: bool,
    pub liquid_staking_address: ManagedAddress<M>,
    pub lending_address: ManagedAddress<M>,
    pub swap_router: ManagedAddress<M>,
    pub bot_address: ManagedAddress<M>,
    pub admins: ManagedVec<M, ManagedAddress<M>>,
}
impl<M: ManagedTypeApi> SystemInfo<M> {
    pub fn new(
        paused: bool,
        share_token: EsdtTokenIdentifier<M>,
        total_shares: ManagedDecimal<M, NumDecimals>,
        supplied_token: EsdtTokenIdentifier<M>,
        borrowed_token: EsdtTokenIdentifier<M>,
        liquid_staking_token: EsdtTokenIdentifier<M>,
        liquid_staking_nonce: u64,
        has_collateral: bool,
        has_debt: bool,
        liquid_staking_address: ManagedAddress<M>,
        lending_address: ManagedAddress<M>,
        swap_router: ManagedAddress<M>,
        bot_address: ManagedAddress<M>,
        admins: ManagedVec<M, ManagedAddress<M>>,
    ) -> Self {
        SystemInfo {
            paused,
            share_token,
            total_shares,
            supplied_token,
            borrowed_token,
            liquid_staking_token,
            liquid_staking_nonce,
            has_collateral,
            has_debt,
            liquid_staking_address,
            lending_address,
            swap_router,
            bot_address,
            admins,
        }
    }

    pub fn into_multi_value(self) -> SystemInfoType<M> {
        MultiValue14::from((
            self.paused,
            self.share_token,
            self.total_shares,
            self.supplied_token,
            self.borrowed_token,
            self.liquid_staking_token,
            self.liquid_staking_nonce,
            self.has_collateral,
            self.has_debt,
            self.liquid_staking_address,
            self.lending_address,
            self.swap_router,
            self.bot_address,
            MultiValueEncoded::from(self.admins),
        ))
    }
}

/// Type alias for system info returned as MultiValue for ABI compatibility.
pub type SystemInfoType<M> = MultiValue14<
    bool,
    EsdtTokenIdentifier<M>,
    ManagedDecimal<M, NumDecimals>,
    EsdtTokenIdentifier<M>,
    EsdtTokenIdentifier<M>,
    EsdtTokenIdentifier<M>,
    u64,
    bool,
    bool,
    ManagedAddress<M>,
    ManagedAddress<M>,
    ManagedAddress<M>,
    ManagedAddress<M>,
    MultiValueEncoded<M, ManagedAddress<M>>,
>;

/// Attributes stored in each share token NFT.
///
/// These attributes track the state at the time of share creation
/// for fair value calculation during withdrawals.
#[type_abi]
#[derive(
    TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug, ManagedVecItem,
)]
pub struct ShareTokenAttributes<M: ManagedTypeApi> {
    /// Total share supply at time of creation.
    pub total_share_supply: ManagedDecimal<M, NumDecimals>,
    /// Total supplied amount in the vault at creation.
    pub total_initial_supplied_amount: ManagedDecimal<M, NumDecimals>,
    /// Timestamp in milliseconds of the last interaction.
    pub last_interaction_ts_millis: TimestampInMillis,
}
impl<M: ManagedTypeApi> Default for ShareTokenAttributes<M> {
    fn default() -> Self {
        Self {
            total_share_supply: ManagedDecimal::from_raw_units(BigUint::zero(), WAD_PRECISION),
            total_initial_supplied_amount: ManagedDecimal::from_raw_units(
                BigUint::zero(),
                WAD_PRECISION,
            ),
            last_interaction_ts_millis: 0,
        }
    }
}
impl<M: ManagedTypeApi> ShareTokenAttributes<M> {
    pub fn new(
        total_share_supply: ManagedDecimal<M, NumDecimals>,
        total_initial_supplied_amount: ManagedDecimal<M, NumDecimals>,
        last_interaction_ts_millis: TimestampInMillis,
    ) -> Self {
        ShareTokenAttributes {
            total_share_supply,
            total_initial_supplied_amount,
            last_interaction_ts_millis,
        }
    }

    pub fn update(
        &mut self,
        total_share_supply: ManagedDecimal<M, NumDecimals>,
        total_initial_supplied_amount: ManagedDecimal<M, NumDecimals>,
        last_interaction_ts_millis: TimestampInMillis,
    ) {
        self.total_share_supply = total_share_supply;
        self.total_initial_supplied_amount = total_initial_supplied_amount;
        self.last_interaction_ts_millis = last_interaction_ts_millis;
    }
}

/// Contains complete information about the vault's lending position.
///
/// Used by views to return all relevant lending position metrics.
/// Specifically, the following useful data can be derived:
///
/// - Share token price in EGLD:
///   `share_token_price_in_egld = (total_supplied_in_egld - total_debt_in_egld) / total_shares`
/// - Share token price in USD:
///   `share_token_price_in_usd = share_token_price_in_egld * egld_price_in_usd`
/// - Total supplied value in USD:
///   `total_supplied_in_usd = total_supplied * supplied_token_price_in_usd`
/// - Total borrowed value in USD:
///   `total_borrowed_in_usd = total_borrowed * borrowed_token_price_in_usd`
/// - Equity value in EGLD:
///   `equity_in_egld = total_supplied_in_egld - total_debt_in_egld`
/// - Equity value in USD:
///   `equity_in_usd = equity_in_egld * egld_price_in_usd`
/// - Loan-to-Value (LTV or Risk) ratio:
///   `ltv_ratio = total_debt_in_egld / total_supply_in_egld`
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub struct LendingInfo<M: ManagedTypeApi> {
    pub total_supplied: ManagedDecimal<M, NumDecimals>,
    pub supplied_token_price_in_usd: ManagedDecimal<M, NumDecimals>,
    pub total_supply_in_egld: ManagedDecimal<M, NumDecimals>,
    pub total_borrowed: ManagedDecimal<M, NumDecimals>,
    pub borrowed_token_price_in_usd: ManagedDecimal<M, NumDecimals>,
    pub total_debt_in_egld: ManagedDecimal<M, NumDecimals>,
    pub egld_price_in_usd: ManagedDecimal<M, NumDecimals>,
    pub health_factor: ManagedDecimal<M, NumDecimals>,
    pub can_be_liquidated: bool,
    pub liquidation_collateral_available_in_egld: ManagedDecimal<M, NumDecimals>,
}
impl<M: ManagedTypeApi> LendingInfo<M> {
    pub fn new(
        total_supplied: ManagedDecimal<M, NumDecimals>,
        supplied_token_price_in_usd: ManagedDecimal<M, NumDecimals>,
        total_supply_in_egld: ManagedDecimal<M, NumDecimals>,
        total_borrowed: ManagedDecimal<M, NumDecimals>,
        borrowed_token_price_in_usd: ManagedDecimal<M, NumDecimals>,
        total_debt_in_egld: ManagedDecimal<M, NumDecimals>,
        egld_price_in_usd: ManagedDecimal<M, NumDecimals>,
        health_factor: ManagedDecimal<M, NumDecimals>,
        can_be_liquidated: bool,
        liquidation_collateral_available_in_egld: ManagedDecimal<M, NumDecimals>,
    ) -> Self {
        LendingInfo {
            total_supplied,
            supplied_token_price_in_usd,
            total_supply_in_egld,
            total_borrowed,
            borrowed_token_price_in_usd,
            total_debt_in_egld,
            egld_price_in_usd,
            health_factor,
            can_be_liquidated,
            liquidation_collateral_available_in_egld,
        }
    }

    pub fn into_multi_value(self) -> LendingInfoMultiValue<M> {
        LendingInfoMultiValue::from((
            self.total_supplied,
            self.supplied_token_price_in_usd,
            self.total_supply_in_egld,
            self.total_borrowed,
            self.borrowed_token_price_in_usd,
            self.total_debt_in_egld,
            self.egld_price_in_usd,
            self.health_factor,
            self.can_be_liquidated,
            self.liquidation_collateral_available_in_egld,
        ))
    }
}

/// Type alias for lending info returned as MultiValue for ABI compatibility.
pub type LendingInfoMultiValue<M> = MultiValue10<
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    bool,
    ManagedDecimal<M, NumDecimals>,
>;

/// Enum representing the action the bot should take.
///
/// Based on the current LTV ratio (LTV = debt/collateral),
/// the bot decides whether to leverage, deleverage, or do nothing.
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum BotAction {
    /// No action needed - LTV ratio is within safe bounds.
    Inaction,
    /// Increase leverage by borrowing more and supplying as collateral.
    Leverage,
    /// Decrease leverage by repaying debt with collateral.
    Deleverage,
}

/// Contains information for the bot to make leverage/deleverage decisions.
///
/// LTV ratio thresholds (configurable, defaults shown):
/// - Safe threshold: 40% (4000 BPS) - the target ratio
/// - Inaction zone: 35%-45% (safe ± 5% = ± 500 BPS)
///
/// Decision logic:
/// - If ltv_ratio > safe + inaction_zone (45%): Deleverage to safe threshold (40%)
/// - If ltv_ratio in [safe - inaction_zone, safe + inaction_zone] (35%-45%): Do nothing
/// - If ltv_ratio < safe - inaction_zone (35%): Leverage to safe threshold (40%)
#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub struct BotInfo<M: ManagedTypeApi> {
    pub suggested_action: BotAction,
    pub current_ltv_ratio_bps: ManagedDecimal<M, NumDecimals>,
    pub safe_threshold_bps_md: ManagedDecimal<M, NumDecimals>,
    pub inaction_zone_bps: ManagedDecimal<M, NumDecimals>,
    pub adjustment_amount_in_egld: ManagedDecimal<M, NumDecimals>,
    pub total_collateral_in_egld: ManagedDecimal<M, NumDecimals>,
    pub total_debt_in_egld: ManagedDecimal<M, NumDecimals>,
    pub supplied_token_price_in_egld: ManagedDecimal<M, NumDecimals>,
    pub borrowed_token_price_in_egld: ManagedDecimal<M, NumDecimals>,
    pub can_be_liquidated: bool,
}
impl<M: ManagedTypeApi> BotInfo<M> {
    pub fn new(
        suggested_action: BotAction,
        current_ltv_ratio_bps: ManagedDecimal<M, NumDecimals>,
        safe_threshold_bps_md: ManagedDecimal<M, NumDecimals>,
        inaction_zone_bps: ManagedDecimal<M, NumDecimals>,
        adjustment_amount_in_egld: ManagedDecimal<M, NumDecimals>,
        total_collateral_in_egld: ManagedDecimal<M, NumDecimals>,
        total_debt_in_egld: ManagedDecimal<M, NumDecimals>,
        supplied_token_price_in_egld: ManagedDecimal<M, NumDecimals>,
        borrowed_token_price_in_egld: ManagedDecimal<M, NumDecimals>,
        can_be_liquidated: bool,
    ) -> Self {
        BotInfo {
            suggested_action,
            current_ltv_ratio_bps,
            safe_threshold_bps_md,
            inaction_zone_bps,
            adjustment_amount_in_egld,
            total_collateral_in_egld,
            total_debt_in_egld,
            supplied_token_price_in_egld,
            borrowed_token_price_in_egld,
            can_be_liquidated,
        }
    }

    pub fn into_multi_value(self) -> BotInfoType<M> {
        BotInfoType::from((
            self.suggested_action,
            self.current_ltv_ratio_bps,
            self.safe_threshold_bps_md,
            self.inaction_zone_bps,
            self.adjustment_amount_in_egld,
            self.total_collateral_in_egld,
            self.total_debt_in_egld,
            self.supplied_token_price_in_egld,
            self.borrowed_token_price_in_egld,
            self.can_be_liquidated,
        ))
    }
}

/// Type alias for bot info returned as MultiValue for ABI compatibility.
pub type BotInfoType<M> = MultiValue10<
    BotAction,
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    ManagedDecimal<M, NumDecimals>,
    bool,
>;
