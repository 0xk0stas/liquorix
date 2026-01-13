# Liquorix - Leveraged Liquid Staking Smart Contract

A MultiversX smart contract enabling **automated leveraged liquid staking** through integration with XOXNO's liquid staking and lending protocols.

## Overview

Liquorix allows users to deposit EGLD or xEGLD and participate in leveraged staking strategies. The contract automates position management through a bot-controlled system that maintains optimal LTV ratios while maximizing yield.

**Core Flow:**
1. Users deposit EGLD → converted to xEGLD via liquid staking
2. xEGLD supplied as collateral to lending protocol
3. Bot borrows against collateral and re-stakes (leverage loop)
4. Users receive share tokens representing vault equity

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Liquorix Contract                       │
├─────────────┬─────────────┬─────────────────┬───────────────────┤
│   Vault     │    Bot      │     System      │      XOXNO        │
│  Module     │   Module    │    Modules      │   Integrations    │
├─────────────┼─────────────┼─────────────────┼───────────────────┤
│ • deposit   │ • leverage  │ • manage        │ • liquid_staking  │
│ • withdraw  │ • deleverage│ • admins        │ • lending         │
│ • views     │ • getBotInfo│ • pause         │ • swap_router     │
└─────────────┴─────────────┴─────────────────┴───────────────────┘
```

---

## Vault Module

The vault handles user interactions with the leveraged staking system through share-based accounting.

### Endpoints

#### `deposit()`
Deposits EGLD or xEGLD into the vault.

| Aspect | Details |
|--------|---------|
| **Payment** | EGLD or xEGLD (supplied_token) |
| **Returns** | `EsdtTokenPayment` - Share token (DynamicMeta NFT) |
| **Access** | Public (requires unpaused) |

**Logic:**
- EGLD deposits are delegated to liquid staking → xEGLD
- xEGLD supplied as collateral to lending protocol
- Share tokens minted proportionally to contribution

**Share Calculation:**
```
First deposit:  shares = deposit_amount
Subsequent:     shares = (total_shares × deposit_egld_value) / vault_equity
                where vault_equity = total_collateral_in_egld - total_debt_in_egld
```

**Share Token Attributes:**
- `total_share_supply` - Total shares at creation
- `total_initial_supplied_amount` - Supplied amount at creation
- `last_interaction_ts_millis` - Timestamp of creation

---

#### `withdraw(swap_steps: OptionalValue<ManagedArgBuffer>)`
Burns share tokens to redeem proportional collateral and debt.

| Aspect | Details |
|--------|---------|
| **Payment** | Share token NFT |
| **Transfers** | xEGLD (remaining collateral after debt repayment) |
| **Arguments** | `swap_steps` - Swap route for debt repayment (required if vault has debt) |
| **Access** | Public (requires unpaused) |

**Logic:**
1. Calculate user's share of collateral: `(total_collateral × share_amount) / total_shares`
2. Calculate user's share of debt: `(total_debt × share_amount) / total_shares`
3. If debt exists: repay via collateral swap
4. Withdraw remaining collateral and transfer to user
5. Burn share tokens

---

### Views

| View | Returns | Description |
|------|---------|-------------|
| `getLendingInfo()` | `LendingInfo` | Complete lending position metrics |
| `getTvl()` | `ManagedDecimal` | Total Value Locked in USD |
| `getPositionsPnl(address, nonces)` | `ManagedDecimal` | PnL for given share positions |

**LendingInfo Fields:**
- `total_supplied`, `total_borrowed` - Token amounts
- `supplied_token_price_in_usd`, `borrowed_token_price_in_usd`
- `total_supply_in_egld`, `total_debt_in_egld`
- `health_factor`, `can_be_liquidated`
- `liquidation_collateral_available_in_egld`

**Derived Metrics:**
```
share_price_in_egld = (total_supplied_in_egld - total_debt_in_egld) / total_shares
ltv_ratio = total_debt_in_egld / total_supply_in_egld
equity_in_egld = total_supplied_in_egld - total_debt_in_egld
```

---

## Bot Module

Automated leverage management with configurable risk parameters.

### Risk Management Algorithm

The bot uses a **Loan-to-Value (LTV)** based approach:

```
ltv_ratio_bps = (total_debt × BPS) / total_collateral
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `safe_threshold_bps` | 4000 (40%) | Target LTV ratio |
| `inaction_zone_bps` | 500 (5%) | Buffer zone around threshold |

**Decision Logic:**
```
├── ltv_ratio > 45% (upper_bound)  → Deleverage
├── ltv_ratio ∈ [35%, 45%]         → Inaction (do nothing)
└── ltv_ratio < 35% (lower_bound)  → Leverage
```

**Adjustment Amount Formula:**
```
adjustment = |debt - collateral × target_ratio| / (1 - target_ratio)
```

---

### Endpoints

#### `leverage(borrowed_amount, decimals, swap_args)`
Increases vault leverage by borrowing and re-staking.

| Aspect | Details |
|--------|---------|
| **Access** | Bot address or owner only |
| **Arguments** | `borrowed_amount` - Amount to borrow<br>`decimals` - Token decimals<br>`swap_args` - Swap route arguments |

**Flow:**
1. Borrow tokens from lending protocol
2. Swap borrowed tokens → EGLD
3. Delegate EGLD → xEGLD via liquid staking
4. Supply xEGLD as additional collateral
5. Validate new LTV ratio within bounds

---

#### `deleverage(collateral_amount, swap_steps)`
Decreases vault leverage by repaying debt with collateral.

| Aspect | Details |
|--------|---------|
| **Access** | Bot address or owner only |
| **Arguments** | `collateral_amount` - Collateral to use<br>`swap_steps` - Swap route for repayment |

**Flow:**
1. Withdraw collateral from lending position
2. Swap collateral → borrowed token
3. Repay debt to lending protocol
4. Validate new LTV ratio within bounds

**Constraints:**
- `collateral_amount ≤ total_collateral`
- `collateral_to_withdraw_in_egld ≤ total_debt_in_egld`

---

### Views

#### `getBotInfo(opt_target_ltv_ratio_bps)`
Returns decision information for the bot.

| Field | Type | Description |
|-------|------|-------------|
| `suggested_action` | `BotAction` | `Leverage`, `Deleverage`, or `Inaction` |
| `current_ltv_ratio_bps` | `ManagedDecimal` | Current LTV in basis points |
| `adjustment_amount_in_egld` | `ManagedDecimal` | EGLD value to adjust |
| `total_collateral_in_egld` | `ManagedDecimal` | Total collateral value |
| `total_debt_in_egld` | `ManagedDecimal` | Total debt value |
| `supplied_token_price_in_egld` | `ManagedDecimal` | xEGLD price |
| `borrowed_token_price_in_egld` | `ManagedDecimal` | Borrowed token price |
| `can_be_liquidated` | `bool` | Liquidation risk flag |

---

## System Modules

### Storage

| Mapper | Type | Description |
|--------|------|-------------|
| `share_token` | `NonFungibleTokenMapper` | Share NFT token |
| `total_shares` | `ManagedDecimal` | Total share supply |
| `supplied_token` | `EsdtTokenIdentifier` | Collateral token (xEGLD) |
| `borrowed_token` | `EsdtTokenIdentifier` | Borrow token (EGLD/USDC) |
| `lending_position_token` | `EsdtTokenIdentifier` | Lending position NFT |
| `lending_position_nonce` | `u64` | Current position nonce |
| `has_collateral` | `bool` | Collateral state flag |
| `has_debt` | `bool` | Debt state flag |
| `safe_threshold_bps` | `u64` | Target LTV ratio (BPS) |
| `inaction_zone_bps` | `u64` | LTV buffer zone (BPS) |

### Admin Endpoints

| Endpoint | Access | Description |
|----------|--------|-------------|
| `issueShareToken(name, ticker)` | Owner | Issue vault share NFT |
| `setSuppliedToken(token)` | Owner | Set collateral token |
| `setBorrowedToken(token)` | Owner | Set borrow token |
| `setLiquidStakingAddress(addr)` | Owner | Set liquid staking contract |
| `setLendingAddress(addr)` | Owner | Set lending controller |
| `setSwapRouterAddress(addr)` | Owner | Set swap router |
| `setBotAddress(addr)` | Owner | Set authorized bot |
| `setRiskThresholds(safe, zone)` | Owner | Configure risk parameters |
| `pause()` / `resume()` | Admin | Emergency controls |
| `addAdmin(addr)` / `removeAdmin(addr)` | Owner | Manage admins |

---

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `WAD` | 10^18 | Standard token precision |
| `RAY` | 10^27 | High-precision calculations |
| `BPS` | 10,000 | 100% in basis points |
| `DEFAULT_SAFE_THRESHOLD_BPS` | 4,000 | 40% target LTV |
| `DEFAULT_INACTION_ZONE_BPS` | 500 | ±5% buffer |

---

## Initialization

```rust
init(
    supplied_token,           // xEGLD token ID
    borrowed_token,           // EGLD/USDC token ID  
    lending_position_token,   // Lending NFT token ID
    liquid_staking_address,   // XOXNO liquid staking SC
    lending_address,          // XOXNO lending controller SC
    swap_router_address,      // XOXNO swap router SC
    bot_address               // Authorized bot address
)
```

---

## Events

| Event | Indexed Fields |
|-------|----------------|
| `deposit` | `supplied_amount`, `share_returned` |
| `withdraw` | `withdrawn_amount`, `share_burned` |
| `deleverage` | `collateral_amount`, `collateral_in_egld`, `new_debt_in_egld` |
| `shareTokenSet` | `token` |
| `riskThresholdsSet` | `safe_threshold_bps`, `inaction_zone_bps` |

---

## Build & Deploy

```bash
# Build contract
cd interaction && ./build.sh

# Deploy (devnet)
./run.sh D

# Interact
./run.sh <command>
```

---

## Dependencies

- `multiversx-sc` v0.64.0
- `multiversx-sc-modules` v0.64.0
- `common-structs` (local)

## License

MIT
