import liquorixAbi from '@/contracts/liquorix.abi.json';
import axios from 'axios';
import {
    AbiRegistry,
    Address,
    ProxyNetworkProvider,
    SmartContractController,
    useGetAccount,
    useGetNetworkConfig,
} from '@/lib';
import { BinaryCodec, BigUIntType, FieldDefinition, StructType, U64Type, U32Type } from '@multiversx/sdk-core';
import { useEffect, useState } from 'react';

import { contractAddress, API_URL, xeGLDTokenId, lqrxTokenId } from '@/config';

export interface LendingPosition {
    total_supplied: string;
    supplied_token_price_in_usd: string;
    total_supply_in_egld: string;
    total_borrowed: string;
    borrowed_token_price_in_usd: string;
    total_debt_in_egld: string;
    egld_price_in_usd: string;
    health_factor: string;
    can_be_liquidated: boolean;
    liquidation_collateral_available_in_egld: string;
}

export interface SystemState {
    paused: boolean;
    share_token: string;
    total_shares: number;
    supplied_token: string;
    borrowed_token: string;
    liquid_staking_token: string;
    liquid_staking_nonce: number;
    has_collateral: boolean;
    has_debt: boolean;
    liquid_staking_address: string;
    lending_address: string;
    swap_router: string;
    bot_address: string;
}

export const useLiquorixInfo = () => {
    const { network } = useGetNetworkConfig();
    const { address: userAddress } = useGetAccount();
    const proxy = new ProxyNetworkProvider(network.apiAddress);

    const [systemInfo, setSystemInfo] = useState<SystemState | null>(null);
    const [lendingInfo, setLendingInfo] = useState<LendingPosition | null>(null);
    const [lqrxTokens, setLqrxTokens] = useState<any[]>([]);
    const [xegldToken, setXegldToken] = useState<any>(null);
    const [totalUserShares, setTotalUserShares] = useState<bigint>(0n);
    const [finalBalanceEgld, setFinalBalanceEgld] = useState<string>('0');
    const [finalBalanceUsd, setFinalBalanceUsd] = useState<string>('0');
    const [sharePriceEgld, setSharePriceEgld] = useState<number>(0);
    const [sharePriceUsd, setSharePriceUsd] = useState<string>('0');

    // PNL Integers (Floats really, but representing financial data)
    const [pnl, setPnl] = useState<number>(0);
    const [pnlPercentage, setPnlPercentage] = useState<number>(0);
    // Intermediate sum for "Initial Underlying" across all tokens
    const [aggregatedInitialUnderlying, setAggregatedInitialUnderlying] = useState<number>(0);



    const queryContract = async () => {
        try {
            const abi = AbiRegistry.create(liquorixAbi);
            const scController = new SmartContractController({
                chainID: network.chainId,
                networkProvider: proxy,
                abi,
            });

            const contract = Address.newFromBech32(contractAddress);
            let fetchedShareTokenId: string | undefined;

            const parseBigNumber = (v: any) => v?.toFixed ? Number(v) : (v?.toString ? Number(v.toString()) : 0);
            const parseAddress = (v: any) => v?.bech32 ? v.bech32() : (v?.toString ? v.toString() : '');

            // 1. Get System Info
            let totalSharesRaw = 0;
            try {
                const result = await scController.query({
                    contract,
                    function: 'getSystemInfo',
                    arguments: [],
                });

                if (result) {
                    let si = (result as any).valueOf?.() || result;
                    if (Array.isArray(si)) si = si[0];

                    if (si) {
                        const parsedSi: SystemState = {
                            paused: si.paused,
                            share_token: si.share_token?.toString(),
                            total_shares: parseBigNumber(si.total_shares),
                            supplied_token: si.supplied_token?.toString(),
                            borrowed_token: si.borrowed_token?.toString(),
                            liquid_staking_token: si.liquid_staking_token?.toString(),
                            liquid_staking_nonce: parseBigNumber(si.liquid_staking_nonce),
                            has_collateral: si.has_collateral,
                            has_debt: si.has_debt,
                            liquid_staking_address: parseAddress(si.liquid_staking_address),
                            lending_address: parseAddress(si.lending_address),
                            swap_router: parseAddress(si.swap_router),
                            bot_address: parseAddress(si.bot_address),
                        };


                        setSystemInfo(parsedSi);

                        fetchedShareTokenId = si.share_token?.toString();

                        const ts = si.total_shares;
                        totalSharesRaw = ts?.toFixed ? Number(ts) : Number(ts || 0);
                    }
                }
            } catch (err) {
                // Silently handle
            }

            // 2. Get Lending Info
            try {
                let result = await scController.query({
                    contract,
                    function: 'getLendingInfo',
                    arguments: [],
                });

                if (result) {
                    let info = (result as any).valueOf?.() || result;
                    if (Array.isArray(info)) info = info[0];

                    if (info) {
                        // Formatting with 2 decimals as requested
                        const v = (d: any) => parseBigNumber(d).toFixed(2);

                        setLendingInfo({
                            total_supplied: v(info.total_supplied),
                            supplied_token_price_in_usd: v(info.supplied_token_price_in_usd),
                            total_supply_in_egld: v(info.total_supply_in_egld),
                            total_borrowed: v(info.total_borrowed),
                            borrowed_token_price_in_usd: v(info.borrowed_token_price_in_usd),
                            total_debt_in_egld: v(info.total_debt_in_egld),
                            egld_price_in_usd: v(info.egld_price_in_usd),
                            health_factor: v(info.health_factor),
                            can_be_liquidated: info.can_be_liquidated,
                            liquidation_collateral_available_in_egld: v(info.liquidation_collateral_available_in_egld),
                        });

                        // 3. Derived Metrics (from ABI docs)
                        const supply = parseBigNumber(info.total_supply_in_egld);
                        const debt = parseBigNumber(info.total_debt_in_egld);
                        const price = parseBigNumber(info.egld_price_in_usd);
                        const equity = supply - debt;

                        const calculatedSharePriceEgld = totalSharesRaw > 0 ? equity / totalSharesRaw : 0;
                        setSharePriceEgld(calculatedSharePriceEgld);

                        const calculatedSharePriceUsdValue = calculatedSharePriceEgld * price;
                        setSharePriceUsd(calculatedSharePriceUsdValue.toFixed(4));

                        console.log("--- Share Price Calculation ---");
                        console.log(`Supply (EGLD): ${supply}`);
                        console.log(`Debt (EGLD): ${debt}`);
                        console.log(`Equity (EGLD): ${equity}`);
                        console.log(`Total Shares Raw: ${totalSharesRaw}`);
                        console.log(`Share Price (EGLD/LQRX): ${calculatedSharePriceEgld}`);
                        console.log(`EGLD Price (USD): ${price}`);
                        console.log(`Share Price (USD/LQRX): ${calculatedSharePriceUsdValue}`);
                        console.log("-------------------------------");
                    }
                }
            } catch (err) {
                // Set default/empty values so UI doesn't crash or show nothing
                setLendingInfo({
                    total_supplied: "0",
                    supplied_token_price_in_usd: "0",
                    total_supply_in_egld: "0",
                    total_borrowed: "0",
                    borrowed_token_price_in_usd: "0",
                    total_debt_in_egld: "0",
                    egld_price_in_usd: "0",
                    health_factor: "0",
                    can_be_liquidated: false,
                    liquidation_collateral_available_in_egld: "0",
                });
            }

            // 3. Fetch Tokens from API
            if (userAddress) {
                // Fetch Share Token (LQRX or dynamic)
                try {
                    // Use the identifier from System Info if available, otherwise search LQRX
                    const identifier = systemInfo?.share_token;
                    /* 
                       Note: In a single execution of queryContract, 'systemInfo' state might not be updated yet 
                       if we just called setSystemInfo above. We should use a local variable if possible, 
                       but since this is an async function and state updates are scheduled, we might need 
                       to rely on the 'si' variable we extracted earlier.
                       However, that 'si' was local to the try block. 
                       Let's declare a variable 'fetchedShareTokenId' outside.
                    */

                    const searchParam = fetchedShareTokenId ? `identifier=${fetchedShareTokenId}` : `identifier=${lqrxTokenId}`;
                    const response = await axios.get(`${API_URL}/accounts/${userAddress}/tokens?size=100&${searchParam}&includeMetaESDT=true`);
                    const tokens = response.data;

                    if (Array.isArray(tokens) && tokens.length > 0) {
                        setLqrxTokens(tokens);

                        // Decoder for ShareTokenAttributes
                        // Struct in Rust:
                        // total_share_supply: ManagedDecimal (BigUint value, u32 decimals)
                        // total_initial_supplied_amount: ManagedDecimal (BigUint value, u32 decimals)
                        // last_interaction_ts_millis: u64

                        const managedDecimalType = new StructType('ManagedDecimal', [
                            new FieldDefinition('value', '', new BigUIntType()),
                            new FieldDefinition('decimals', '', new U32Type())
                        ]);

                        const shareAttributesType = new StructType('ShareTokenAttributes', [
                            new FieldDefinition('total_share_supply', '', managedDecimalType),
                            new FieldDefinition('total_initial_supplied_amount', '', managedDecimalType),
                            new FieldDefinition('last_interaction_ts_millis', '', new U64Type())
                        ]);
                        const codec = new BinaryCodec();

                        let totalShares = 0n;
                        let totalInitialUnderlyingSum = 0; // Float aggregation

                        for (const token of tokens) {
                            const userBalanceBig = BigInt(token.balance || 0);
                            totalShares += userBalanceBig;

                            // Calculate Initial Value contribution per token
                            if (token.attributes) {
                                try {
                                    const buffer = Buffer.from(token.attributes, 'base64');
                                    const decoded = codec.decodeTopLevel(buffer, shareAttributesType).valueOf();

                                    // Decoded structure: { total_share_supply: { value: BigInt, decimals: number }, ... }

                                    // Helper to extract value from ManagedDecimal result
                                    const rawTotalShares = decoded['total_share_supply']?.['value'];
                                    const rawInitSupplied = decoded['total_initial_supplied_amount']?.['value'];

                                    // Helper to safely get BigInt
                                    const toBig = (v: any) => v?.toFixed ? BigInt(v.toFixed(0)) : BigInt(v?.toString() || 0);

                                    const initTotalShares = toBig(rawTotalShares);
                                    const initSupplied = toBig(rawInitSupplied);

                                    // FLOAT MATH STRICTLY AS REQUESTED
                                    // 1. Convert everything to float (decimals)
                                    const tokenBalanceFloat = Number(userBalanceBig) / 1e18;
                                    const initTotalSharesFloat = Number(initTotalShares) / 1e18;
                                    const initSuppliedFloat = Number(initSupplied) / 1e18;

                                    // 2. Apply Formula: (share.amount * share_total_initial_supplied_amount / total_share_supply)
                                    if (initTotalSharesFloat > 0) {
                                        const initialUnderlying = (tokenBalanceFloat * initSuppliedFloat) / initTotalSharesFloat;
                                        totalInitialUnderlyingSum += initialUnderlying;
                                    } else {
                                        totalInitialUnderlyingSum += tokenBalanceFloat;
                                    }

                                } catch (e) {
                                    console.error("Failed to decode attributes for token:", token.identifier, e);
                                }
                            }
                        }

                        setTotalUserShares(totalShares);
                        setAggregatedInitialUnderlying(totalInitialUnderlyingSum);




                    } else {
                        setLqrxTokens([]);
                        setTotalUserShares(0n);
                    }
                } catch (err) {
                    // Silently handle
                }

                // Fetch XEGLD
                try {
                    const response = await axios.get(`${API_URL}/accounts/${userAddress}/tokens?size=100&identifier=${xeGLDTokenId}`);
                    const tokens = response.data;

                    if (Array.isArray(tokens) && tokens.length > 0) {
                        setXegldToken(tokens[0]);
                    } else {
                        setXegldToken(null);
                    }
                } catch (err) {
                    // Silently handle
                }
            }
        } catch (err) {
            // Silently handle
        }
    };

    // New useEffect to handle both balances once we have shares and prices
    useEffect(() => {
        if (totalUserShares > 0n) {
            const shares = Number(totalUserShares) / 1e18;

            // EGLD Balance = Total Shares * Share Price in EGLD
            if (sharePriceEgld > 0) {
                setFinalBalanceEgld((shares * sharePriceEgld).toFixed(4));
            }

            // USD Balance = Total Shares * Share Price in USD
            if (sharePriceUsd !== '0') {
                const price = parseFloat(sharePriceUsd);
                setFinalBalanceUsd((shares * price).toFixed(2));
            }
        } else {
            setFinalBalanceEgld('0');
            setFinalBalanceUsd('0.00');
        }
    }, [totalUserShares, sharePriceEgld, sharePriceUsd]);

    // PNL Calculation Effect
    useEffect(() => {
        if (aggregatedInitialUnderlying > 0 && lendingInfo && systemInfo && totalUserShares > 0n) {
            // 1. Common Variables (Float)
            const suppliedAmt = parseFloat(lendingInfo.total_supplied);
            const suppliedPrice = parseFloat(lendingInfo.supplied_token_price_in_usd);
            const borrowedAmt = parseFloat(lendingInfo.total_borrowed);
            const borrowedPrice = parseFloat(lendingInfo.borrowed_token_price_in_usd);
            const totalUserSharesFloat = Number(totalUserShares) / 1e18;
            const totalGlobalShares = systemInfo.total_shares > 1_000_000
                ? systemInfo.total_shares / 1e18
                : systemInfo.total_shares;

            // 2. Net TVL (Equity Value in USD)
            const totalSuppliedValue = suppliedAmt * suppliedPrice;
            const totalBorrowedValue = borrowedAmt * borrowedPrice;
            const tvl = totalSuppliedValue - totalBorrowedValue;

            // 3. Total Share Current Value ($)
            // Formula: (share.amount * tvl) / total_shares
            let totalShareCurrentValue = 0;
            if (totalGlobalShares > 0) {
                totalShareCurrentValue = (totalUserSharesFloat * tvl) / totalGlobalShares;
            }

            // 4. Total Share Initial Value ($)
            // Formula: sum((share.amount * share_total_initial_supplied_amount / total_share_supply) * supplied_token_price_in_usd)
            const adjustedInitialUnderlying = aggregatedInitialUnderlying > 1_000_000
                ? aggregatedInitialUnderlying / 1e18
                : aggregatedInitialUnderlying;

            const totalShareInitialValue = adjustedInitialUnderlying * suppliedPrice;

            // 5. Final PNL
            const pnlValue = totalShareCurrentValue - totalShareInitialValue;
            const pnlPerc = totalShareInitialValue > 0 ? (pnlValue * 100) / totalShareInitialValue : 0;

            setPnl(pnlValue);
            setPnlPercentage(pnlPerc);
        } else {
            setPnl(0);
            setPnlPercentage(0);
        }
    }, [aggregatedInitialUnderlying, lendingInfo, systemInfo, totalUserShares]);


    useEffect(() => {
        queryContract();
    }, [network.apiAddress, network.chainId, userAddress]);

    return {
        queryContract,
        systemInfo,
        lendingInfo,
        lqrxTokens,
        lqrxToken: lqrxTokens.length > 0 ? lqrxTokens[0] : null,
        xegldToken,
        finalBalanceEgld,
        finalBalanceUsd,
        sharePriceUsd,
        sharePriceEgld,
        totalUserShares,
        pnl,
        pnlPercentage
    };
};
