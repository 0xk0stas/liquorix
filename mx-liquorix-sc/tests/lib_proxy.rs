// Proxy module for tests - adapted from output/lib_proxy.rs
// The inner attributes are removed to allow this file to be used as a module

#[allow(dead_code)]
#[allow(clippy::all)]
use multiversx_sc::proxy_imports::*;

pub struct LiquorixProxy;

impl<Env, From, To, Gas> TxProxyTrait<Env, From, To, Gas> for LiquorixProxy
where
    Env: TxEnv,
    From: TxFrom<Env>,
    To: TxTo<Env>,
    Gas: TxGas<Env>,
{
    type TxProxyMethods = LiquorixProxyMethods<Env, From, To, Gas>;

    fn proxy_methods(self, tx: Tx<Env, From, To, (), Gas, (), ()>) -> Self::TxProxyMethods {
        LiquorixProxyMethods { wrapped_tx: tx }
    }
}

pub struct LiquorixProxyMethods<Env, From, To, Gas>
where
    Env: TxEnv,
    From: TxFrom<Env>,
    To: TxTo<Env>,
    Gas: TxGas<Env>,
{
    wrapped_tx: Tx<Env, From, To, (), Gas, (), ()>,
}

#[rustfmt::skip]
impl<Env, From, Gas> LiquorixProxyMethods<Env, From, (), Gas>
where
    Env: TxEnv,
    Env::Api: VMApi,
    From: TxFrom<Env>,
    Gas: TxGas<Env>,
{
    pub fn init<
        Arg0: ProxyArg<EsdtTokenIdentifier<Env::Api>>,
        Arg1: ProxyArg<EsdtTokenIdentifier<Env::Api>>,
        Arg2: ProxyArg<EsdtTokenIdentifier<Env::Api>>,
        Arg3: ProxyArg<ManagedAddress<Env::Api>>,
        Arg4: ProxyArg<ManagedAddress<Env::Api>>,
        Arg5: ProxyArg<ManagedAddress<Env::Api>>,
        Arg6: ProxyArg<ManagedAddress<Env::Api>>,
    >(
        self,
        supplied_token: Arg0,
        borrowed_token: Arg1,
        lending_position_token: Arg2,
        liquid_staking_address: Arg3,
        lending_address: Arg4,
        swap_router_address: Arg5,
        bot_address: Arg6,
    ) -> TxTypedDeploy<Env, From, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_deploy()
            .argument(&supplied_token)
            .argument(&borrowed_token)
            .argument(&lending_position_token)
            .argument(&liquid_staking_address)
            .argument(&lending_address)
            .argument(&swap_router_address)
            .argument(&bot_address)
            .original_result()
    }
}

#[rustfmt::skip]
impl<Env, From, To, Gas> LiquorixProxyMethods<Env, From, To, Gas>
where
    Env: TxEnv,
    Env::Api: VMApi,
    From: TxFrom<Env>,
    To: TxTo<Env>,
    Gas: TxGas<Env>,
{
    pub fn upgrade(
        self,
    ) -> TxTypedUpgrade<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_upgrade()
            .original_result()
    }
}

#[rustfmt::skip]
impl<Env, From, To, Gas> LiquorixProxyMethods<Env, From, To, Gas>
where
    Env: TxEnv,
    Env::Api: VMApi,
    From: TxFrom<Env>,
    To: TxTo<Env>,
    Gas: TxGas<Env>,
{
    pub fn set_supplied_token<
        Arg0: ProxyArg<EsdtTokenIdentifier<Env::Api>>,
    >(
        self,
        token: Arg0,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("setSuppliedToken")
            .argument(&token)
            .original_result()
    }

    pub fn set_borrowed_token<
        Arg0: ProxyArg<EsdtTokenIdentifier<Env::Api>>,
    >(
        self,
        token: Arg0,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("setBorrowedToken")
            .argument(&token)
            .original_result()
    }

    pub fn set_liquid_staking_address<
        Arg0: ProxyArg<ManagedAddress<Env::Api>>,
    >(
        self,
        address: Arg0,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("setLiquidStakingAddress")
            .argument(&address)
            .original_result()
    }

    pub fn set_lending_address<
        Arg0: ProxyArg<ManagedAddress<Env::Api>>,
    >(
        self,
        address: Arg0,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("setLendingAddress")
            .argument(&address)
            .original_result()
    }

    pub fn set_swap_router_address<
        Arg0: ProxyArg<ManagedAddress<Env::Api>>,
    >(
        self,
        address: Arg0,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("setSwapRouterAddress")
            .argument(&address)
            .original_result()
    }

    pub fn set_bot_address<
        Arg0: ProxyArg<ManagedAddress<Env::Api>>,
    >(
        self,
        address: Arg0,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("setBotAddress")
            .argument(&address)
            .original_result()
    }

    pub fn set_risk_thresholds<
        Arg0: ProxyArg<u64>,
        Arg1: ProxyArg<u64>,
    >(
        self,
        safe_threshold_bps: Arg0,
        inaction_zone_bps: Arg1,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("setRiskThresholds")
            .argument(&safe_threshold_bps)
            .argument(&inaction_zone_bps)
            .original_result()
    }

    pub fn get_system_info(
        self,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, SystemInfo<Env::Api>> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("getSystemInfo")
            .original_result()
    }

    pub fn add_admin<
        Arg0: ProxyArg<MultiValueEncoded<Env::Api, ManagedAddress<Env::Api>>>,
    >(
        self,
        addresses: Arg0,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("addAdmins")
            .argument(&addresses)
            .original_result()
    }

    pub fn remove_admin<
        Arg0: ProxyArg<MultiValueEncoded<Env::Api, ManagedAddress<Env::Api>>>,
    >(
        self,
        addresses: Arg0,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("removeAdmins")
            .argument(&addresses)
            .original_result()
    }

    pub fn pause(
        self,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("pause")
            .original_result()
    }

    pub fn unpause(
        self,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("unpause")
            .original_result()
    }

    pub fn deposit(
        self,
    ) -> TxTypedCall<Env, From, To, (), Gas, EsdtTokenPayment<Env::Api>> {
        self.wrapped_tx
            .raw_call("deposit")
            .original_result()
    }

    pub fn withdraw<
        Arg0: ProxyArg<OptionalValue<ManagedArgBuffer<Env::Api>>>,
    >(
        self,
        swap_steps: Arg0,
    ) -> TxTypedCall<Env, From, To, (), Gas, ()> {
        self.wrapped_tx
            .raw_call("withdraw")
            .argument(&swap_steps)
            .original_result()
    }

    pub fn get_lending_info(
        self,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, LendingInfo<Env::Api>> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("getLendingInfo")
            .original_result()
    }

    pub fn get_tvl(
        self,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ManagedDecimal<Env::Api, usize>> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("getTvl")
            .original_result()
    }

    pub fn leverage<
        Arg0: ProxyArg<BigUint<Env::Api>>,
        Arg1: ProxyArg<usize>,
        Arg2: ProxyArg<ManagedArgBuffer<Env::Api>>,
    >(
        self,
        borrowed_amount: Arg0,
        decimals: Arg1,
        swap_args: Arg2,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("leverage")
            .argument(&borrowed_amount)
            .argument(&decimals)
            .argument(&swap_args)
            .original_result()
    }

    pub fn deleverage<
        Arg0: ProxyArg<BigUint<Env::Api>>,
        Arg1: ProxyArg<ManagedArgBuffer<Env::Api>>,
    >(
        self,
        collateral_amount: Arg0,
        swap_steps: Arg1,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, ()> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("deleverage")
            .argument(&collateral_amount)
            .argument(&swap_steps)
            .original_result()
    }

    pub fn get_bot_info<
        Arg0: ProxyArg<OptionalValue<BigUint<Env::Api>>>,
    >(
        self,
        opt_target_ltv_ratio_bps: Arg0,
    ) -> TxTypedCall<Env, From, To, NotPayable, Gas, BotInfo<Env::Api>> {
        self.wrapped_tx
            .payment(NotPayable)
            .raw_call("getBotInfo")
            .argument(&opt_target_ltv_ratio_bps)
            .original_result()
    }
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, ManagedVecItem)]
pub struct SystemInfo<Api>
where
    Api: ManagedTypeApi,
{
    pub paused: bool,
    pub share_token: EsdtTokenIdentifier<Api>,
    pub total_shares: ManagedDecimal<Api, usize>,
    pub supplied_token: EsdtTokenIdentifier<Api>,
    pub borrowed_token: EsdtTokenIdentifier<Api>,
    pub liquid_staking_token: EsdtTokenIdentifier<Api>,
    pub liquid_staking_nonce: u64,
    pub has_collateral: bool,
    pub has_debt: bool,
    pub liquid_staking_address: ManagedAddress<Api>,
    pub lending_address: ManagedAddress<Api>,
    pub swap_router: ManagedAddress<Api>,
    pub bot_address: ManagedAddress<Api>,
    pub admins: ManagedVec<Api, ManagedAddress<Api>>,
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub struct LendingInfo<Api>
where
    Api: ManagedTypeApi,
{
    pub total_supplied: ManagedDecimal<Api, usize>,
    pub supplied_token_price_in_usd: ManagedDecimal<Api, usize>,
    pub total_supply_in_egld: ManagedDecimal<Api, usize>,
    pub total_borrowed: ManagedDecimal<Api, usize>,
    pub borrowed_token_price_in_usd: ManagedDecimal<Api, usize>,
    pub total_debt_in_egld: ManagedDecimal<Api, usize>,
    pub egld_price_in_usd: ManagedDecimal<Api, usize>,
    pub health_factor: ManagedDecimal<Api, usize>,
    pub can_be_liquidated: bool,
    pub liquidation_collateral_available_in_egld: ManagedDecimal<Api, usize>,
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub struct BotInfo<Api>
where
    Api: ManagedTypeApi,
{
    pub suggested_action: BotAction,
    pub current_ltv_ratio_bps: ManagedDecimal<Api, usize>,
    pub safe_threshold_bps_md: ManagedDecimal<Api, usize>,
    pub inaction_zone_bps: ManagedDecimal<Api, usize>,
    pub adjustment_amount_in_egld: ManagedDecimal<Api, usize>,
    pub total_collateral_in_egld: ManagedDecimal<Api, usize>,
    pub total_debt_in_egld: ManagedDecimal<Api, usize>,
    pub supplied_token_price_in_egld: ManagedDecimal<Api, usize>,
    pub borrowed_token_price_in_egld: ManagedDecimal<Api, usize>,
    pub can_be_liquidated: bool,
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Clone, Debug)]
pub enum BotAction {
    Inaction,
    Leverage,
    Deleverage,
}
