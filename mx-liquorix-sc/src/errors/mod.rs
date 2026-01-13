//! # Errors Module
//!
//! Defines error message constants used throughout the smart contract.

/// Error when attempting an operation while the contract is paused.
pub static ERROR_PAUSED: &[u8] =
    b"Contract is currently paused. Please wait for admin to resume operations.";

/// Error when attempting to unpause an already unpaused contract.
pub static ERROR_NOT_PAUSED: &[u8] = b"Contract is already active and not paused.";

/// Error when a non-admin attempts an admin-only operation.
pub static ERROR_NOT_ADMIN: &[u8] = b"Access denied: This operation requires admin privileges.";

/// Error when a non-bot address attempts a bot-only operation.
pub static ERROR_NOT_BOT: &[u8] =
    b"Access denied: This operation can only be performed by an authorized bot address.";

/// Error when delegation to liquid staking fails.
pub static ERROR_DELEGATE_FAILED: &[u8] =
    b"Delegation to liquid staking protocol failed. Please try again or contact support.";

/// Error when depositing an unsupported token.
pub static ERROR_INVALID_DEPOSIT_TOKEN: &[u8] =
    b"Unsupported token: Only EGLD deposits are accepted.";

/// Error when deposit amount is zero or invalid.
pub static ERROR_INVALID_DEPOSIT_AMOUNT: &[u8] =
    b"Invalid deposit: Amount must be greater than zero.";

/// Error when delegated amount returned is invalid.
pub static ERROR_INVALID_DELEGATED_AMOUNT: &[u8] =
    b"Delegation error: Received invalid or zero amount from staking protocol.";

/// Error when initial deposit for lending position creation is invalid.
pub static ERROR_INVALID_INITIAL_DEPOSIT: &[u8] =
    b"Initial deposit required: Cannot create lending position without a valid deposit.";

/// Error when lending position token is invalid.
pub static ERROR_INVALID_LENDING_POSITION_TOKEN: &[u8] =
    b"Invalid lending position token: Cannot create lending position without a valid token.";

pub static ERROR_INVALID_LENDING_POSITION_NONCE: &[u8] =
    b"Invalid lending position nonce: Cannot operate on a lending position with an invalid nonce.";

/// Error when lending position already exists.
pub static ERROR_LENDING_POSITION_ALREADY_EXISTS: &[u8] =
    b"Lending position already exists: Cannot create lending position with an existing token.";

/// Error when total supply is less than total debt.
pub static ERROR_INVALID_COLLATERAL_TO_DEBT_RATIO: &[u8] =
    b"Invalid collateral: Total supply must be greater than total debt.";

/// Error when lending position does not exist.
pub static ERROR_LENDING_POSITION_DOES_NOT_EXIST: &[u8] =
    b"Lending position does not exist: Cannot operate on a non-existent lending position.";

/// Error when received amount does not match expected value.
pub static ERROR_RECEIVED_AMOUNT_MISMATCH: &[u8] =
    b"Mismatch in received amount: Received amount does not match expected value.";

/// Error when an unexpected back transfer is received.
pub static ERROR_UNEXPECTED_BACK_TRANSFER: &[u8] =
    b"Unexpected back transfer received from borrow operation.";

/// Error when share token in withdrawal is invalid.
pub static ERROR_INVALID_SHARE_TOKEN_PAYMENT: &[u8] =
    b"Invalid share token: Withdrawal requires valid share token payment.";

/// Error when collateral to withdraw is invalid.
pub static ERROR_INVALID_COLLATERAL_TO_WITHDRAW: &[u8] =
    b"Invalid collateral: Amount to withdraw must be greater than zero and less than or equal to available collateral.";

/// Error when safe threshold exceeds 100%.
pub static ERROR_SAFE_THRESHOLD_TOO_HIGH: &[u8] =
    b"Invalid threshold: Safe threshold must be <= 100% (10000 BPS).";

/// Error when inaction zone upper bound exceeds 100%.
pub static ERROR_INACTION_ZONE_UPPER_BOUND_TOO_HIGH: &[u8] =
    b"Invalid threshold: Upper bound of inaction zone must be <= 100% (10000 BPS).";

/// Error when inaction zone is not less than safe threshold.
pub static ERROR_INACTION_ZONE_TOO_LARGE: &[u8] =
    b"Invalid threshold: Inaction zone must be less than safe threshold.";

/// Error when target LTV ratio BPS is invalid.
pub static ERROR_INVALID_TARGET_LTV_RATIO_BPS: &[u8] =
    b"Invalid target LTV ratio: Must be within the suggested zone bounds.";

/// Error when withdrawing collateral would exceed safe threshold with respect to debt.
pub static ERROR_INVALID_COLLATERAL_TO_WITHDRAW_WRT_DEBT: &[u8] =
    b"Invalid withdrawal: Cannot withdraw collateral that would cause LTV ratio to exceed safe threshold with respect to outstanding debt.";

/// Error when collateral is insufficient to cover the user's share of debt.
pub static ERROR_INSUFFICIENT_COLLATERAL_FOR_DEBT: &[u8] =
    b"Insufficient collateral: User's share of collateral is less than their share of debt.";
