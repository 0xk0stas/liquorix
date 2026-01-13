//! # Constants Module
//!
//! Defines precision constants used for decimal arithmetic in the smart contract.

/// RAY value representing 1e27, used for high-precision calculations in lending protocols.
pub const RAY: u128 = 1_000_000_000_000_000_000_000_000_000;

/// RAY precision (27 decimals) for high-precision rate calculations.
pub const RAY_PRECISION: usize = 27;

/// WAD value representing 1e18, the standard precision for token amounts.
pub const WAD: u128 = 1_000_000_000_000_000_000;

/// WAD precision (18 decimals) matching standard ESDT token decimals.
pub const WAD_PRECISION: usize = 18;

/// Basis points value representing 100% (10,000 BPS).
pub const BPS: usize = 10_000;

/// BPS precision (4 decimals) for percentage calculations.
pub const BPS_PRECISION: usize = 4;

/// Default safe threshold for LTV ratio in BPS (40%).
pub const DEFAULT_SAFE_THRESHOLD_BPS: u64 = 4_000;

/// Default inaction zone in BPS around the safe threshold (5%).
pub const DEFAULT_INACTION_ZONE_BPS: u64 = 500;
