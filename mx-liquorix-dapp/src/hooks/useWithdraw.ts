import {
    Address,
    Transaction,
    useGetAccount,
    useGetNetworkConfig,
    ProxyNetworkProvider,
    AbiRegistry,
    SmartContractController,
} from '@/lib';
import { signAndSendTransactions } from '@/helpers/signAndSendTransactions';
import { contractAddress, usdcTokenId, xeGLDTokenId, xoxnoSwapApiUrl } from '@/config';
import liquorixAbi from '@/contracts/liquorix.abi.json';
import axios from 'axios';

/**
 * Hook to handle withdrawals from the Liquorix vault.
 * 
 * Performance Note: We query the contract state immediately before the transaction 
 * to ensure the most accurate swap data for debt repayment.
 */
export const useWithdraw = () => {
    const { address } = useGetAccount();
    const { network } = useGetNetworkConfig();

    /**
     * Helper to safely convert any value to a BigInt with the specified precision.
     */
    const toBigIntNormalized = (val: any, decimals: number = 18): bigint => {
        if (val === undefined || val === null) return 0n;
        const s = val.toString();

        if (s.includes('e')) {
            return BigInt(Math.floor(Number(s) * Math.pow(10, decimals)));
        }

        if (s.includes('.')) {
            const [int, frac = ""] = s.split('.');
            const res = BigInt(int) * (10n ** BigInt(decimals)) +
                BigInt(frac.padEnd(decimals, '0').slice(0, decimals));
            return res;
        }

        try {
            return BigInt(s);
        } catch (e) {
            return 0n;
        }
    };

    const withdraw = async (amount: number | string, tokenId: string, nonce: number = 0, onSuccess?: () => void) => {
        if (!address) {
            return;
        }

        try {

            // 1. Determine Precise Share Amount (Atomic Units - 18 decimals)
            let shareAmountRaw: bigint;
            const amountStr = amount.toString();
            if (!amountStr.includes('.')) {
                shareAmountRaw = BigInt(amountStr);
            } else {
                const [int, frac = ""] = amountStr.split('.');
                shareAmountRaw = BigInt(int) * (10n ** 18n);
                if (frac) {
                    shareAmountRaw += BigInt(frac.padEnd(18, '0').slice(0, 18));
                }
            }

            if (shareAmountRaw <= 0n) {
                return;
            }

            // 2. Query Contract for latest values
            const proxy = new ProxyNetworkProvider(network.apiAddress);
            const abi = AbiRegistry.create(liquorixAbi as any);
            const scController = new SmartContractController({
                chainID: network.chainId,
                networkProvider: proxy,
                abi,
            });

            const contract = Address.newFromBech32(contractAddress);

            const getMdData = (md: any, expectedDecimals: number = 18) => {
                if (!md) return { value: 0n, decimals: expectedDecimals };
                const val = (md.valueOf && typeof md.valueOf === 'function') ? md.valueOf() : md;
                if (val && val.value !== undefined) {
                    return { value: toBigIntNormalized(val.value, 0), decimals: Number(val.decimals || expectedDecimals) };
                }
                return { value: toBigIntNormalized(val, expectedDecimals), decimals: expectedDecimals };
            };


            const [siResult, liResult] = await Promise.all([
                scController.query({ contract, function: 'getSystemInfo', arguments: [] }),
                scController.query({ contract, function: 'getLendingInfo', arguments: [] })
            ]).catch(err => {
                return [null, null];
            });

            if (!siResult || !liResult) {
                throw new Error("Failed to fetch contract data for swap calculation");
            }

            let si = (siResult as any).valueOf?.() || siResult;
            if (Array.isArray(si)) si = si[0];
            let li = (liResult as any).valueOf?.() || liResult;
            if (Array.isArray(li)) li = li[0];

            const sharesData = getMdData(si.total_shares, 18);
            const borrowedData = getMdData(li.total_borrowed, 6); // USDC
            const priceData = getMdData(li.supplied_token_price_in_usd, 18);



            // 3. Calculate Swap Amount In
            let amountInSwap = 0n;
            if (sharesData.value > 0n && borrowedData.value > 0n && priceData.value > 0n) {
                const power = BigInt(18 + priceData.decimals - borrowedData.decimals);
                amountInSwap = (shareAmountRaw * borrowedData.value * (10n ** power)) / (sharesData.value * priceData.value);
            }



            // 4. Fetch Swap Data from XOXNO
            let packedArgsHex = "";
            if (amountInSwap > 0n) {
                try {
                    const quoteUrl = `${xoxnoSwapApiUrl}/quote?from=${xeGLDTokenId}&to=${usdcTokenId}&amountIn=${amountInSwap.toString()}&slippage=0.01&sender=${address}&referralId=2`;
                    const { data: quote } = await axios.get(quoteUrl);

                    if (quote && quote.transaction && quote.transaction.data) {
                        const decodedData = atob(quote.transaction.data);


                        const parts = decodedData.split('@');

                        // Identify start of arguments (skipping method name)
                        let argsStartIdx = -1;
                        if (parts[0] === 'ESDTTransfer') {
                            argsStartIdx = 4; // ESDTTransfer@Token@Amount@Method@Arg1...
                        } else if (parts[0] === 'ESDTNFTTransfer') {
                            argsStartIdx = 6; // ESDTNFTTransfer@Token@Nonce@Amount@Dest@Method@Arg1...
                        } else if (parts[0] === 'MultiESDTNFTTransfer') {
                            const numTokens = parseInt(parts[2]);
                            argsStartIdx = 4 + (numTokens * 3); // MultiESDTNFTTransfer@Dest@NumTokens@[T1@N1@A1]@...@Method@Arg1...
                        } else {
                            // Fallback: If it's a direct swap call or unknown, assume arguments start after the first word
                            argsStartIdx = 1;
                        }

                        if (argsStartIdx !== -1 && argsStartIdx < parts.length) {
                            const argsHexStrings = parts.slice(argsStartIdx);


                            // MultiESDTNFTTransfer / List<bytes> nested encoding: [ItemLen(4bytes)][ItemData]
                            const bufferParts = argsHexStrings.map(hex => Buffer.from(hex, 'hex'));
                            const nestedBuffer = Buffer.concat(bufferParts.map(part => {
                                const lenBuf = Buffer.alloc(4);
                                lenBuf.writeUInt32BE(part.length, 0);
                                // Using 'as any' to bypass a TypeScript incompatibility between Buffer and Uint8Array 
                                // that occurs in some environments due to SharedArrayBuffer typing.
                                return Buffer.concat([lenBuf, part] as any);
                            }) as any);

                            packedArgsHex = nestedBuffer.toString('hex');

                        }
                    }
                } catch (swapErr) {
                }
            }

            // 5. Build Transaction Data
            const toHex = (str: string) => Buffer.from(str).toString('hex');
            const tokenIdHex = toHex(tokenId);
            const amountHex = shareAmountRaw.toString(16).length % 2 === 0 ? shareAmountRaw.toString(16) : '0' + shareAmountRaw.toString(16);
            const functionNameHex = toHex('withdraw');

            let data = '';
            let txReceiver = new Address(contractAddress);
            const argsPart = packedArgsHex ? `@${packedArgsHex}` : '';

            if (nonce > 0) {
                // MetaESDT Transfer: ESDTNFTTransfer@Token@Nonce@Amount@Dest@Method[@Args...]
                txReceiver = new Address(address);
                const nonceHex = nonce.toString(16).length % 2 === 0 ? nonce.toString(16) : '0' + nonce.toString(16);
                const destHex = new Address(contractAddress).toHex();
                data = `ESDTNFTTransfer@${tokenIdHex}@${nonceHex}@${amountHex}@${destHex}@${functionNameHex}${argsPart}`;
            } else {
                // Standard ESDT Transfer: ESDTTransfer@Token@Amount@Method[@Args...]
                data = `ESDTTransfer@${tokenIdHex}@${amountHex}@${functionNameHex}${argsPart}`;
            }



            const tx = new Transaction({
                value: 0n,
                data: new TextEncoder().encode(data),
                receiver: txReceiver,
                sender: new Address(address),
                gasLimit: 450_000_000n,
                chainID: network.chainId
            });

            const sessionId = await signAndSendTransactions({
                transactions: [tx],
                transactionsDisplayInfo: {
                    processingMessage: 'Processing Withdrawal...',
                    errorMessage: 'Withdrawal failed',
                    successMessage: 'Withdrawal successful'
                },
                onSuccess
            });

            return sessionId;
        } catch (error) {
        }
    };

    return { withdraw };
};
