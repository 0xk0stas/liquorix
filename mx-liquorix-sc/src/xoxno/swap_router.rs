//! # Swap Router Module
//!
//! Contains integrations with XOXNO swap router services.
//!
//! Provides functionality to swap tokens via XOXNO swap router.

use multiversx_sc::imports::*;

/// Module for XOXNO swap router interactions.
/// Provides functionality to:
/// - Execute token swaps via the XOXNO swap router
#[multiversx_sc::module]
pub trait SwapRouterModule: crate::system::utils::UtilsModule {
    /// Executes a token swap via the XOXNO swap router.
    ///
    /// # Arguments
    /// - `swap_router_address` - Address of the swap router contract
    /// - `from_token` - Token identifier of the token to swap from
    /// - `from_amount` - Amount of the from_token to swap
    /// - `wanted_token` - Token identifier of the desired token to receive
    /// - `refunds_receiver` - Address to receive any refunded tokens
    /// - `args` - Additional arguments for the swap router call
    ///
    /// # Returns
    /// ESDT payment containing the swapped token and amount.
    fn execute_swap(
        &self,
        swap_router_address: &ManagedAddress,
        from_token: &EsdtTokenIdentifier,
        from_amount: &BigUint,
        wanted_token: &EgldOrEsdtTokenIdentifier,
        refunds_receiver: &ManagedAddress,
        args: ManagedArgBuffer<Self::Api>,
    ) -> EgldOrEsdtTokenPayment {
        let back_transfers = self
            .tx()
            .to(swap_router_address)
            .raw_call(ManagedBuffer::new_from_bytes(b"xo"))
            .arguments_raw(args)
            .single_esdt(from_token, 0, from_amount)
            .returns(ReturnsBackTransfers)
            .sync_call();

        let mut wanted_payment =
            EgldOrEsdtTokenPayment::new(wanted_token.clone(), 0, BigUint::from(0u8));

        let mut refunds = ManagedVec::new();

        for payment in back_transfers.payments {
            if &payment.token_identifier == wanted_token {
                wanted_payment.amount += &payment.amount;
            } else if &payment.token_identifier == from_token && &payment.amount == from_amount {
                // Skip the borrow transfer that might be present in the back transfers
                // Note: The swap will be executed after a loan is taken, so the borrowed amount should not be refunded
                continue;
            } else {
                refunds.push(payment.clone());
            }
        }

        if !refunds.is_empty() {
            self.tx()
                .to(refunds_receiver)
                .payment(refunds)
                .transfer_if_not_empty();
        }

        wanted_payment
    }
}
