import {
    Address,
    Transaction,
    useGetAccount,
    useGetNetworkConfig,
} from '@/lib';
import { signAndSendTransactions } from '@/helpers/signAndSendTransactions';
import { contractAddress } from '@/config';

export const useDeposit = () => {
    const { address } = useGetAccount();
    const { network } = useGetNetworkConfig();

    const deposit = async (amount: number, tokenIdentifier?: string, onSuccess?: () => void) => {
        if (!address) {
            console.error('Wallet not connected');
            return;
        }

        try {
            // Ensure amount is valid
            if (amount <= 0) {
                console.error('Invalid amount:', amount);
                return;
            }

            const value = BigInt(Math.floor(amount * 10 ** 18));
            const receiverAddress = new Address(contractAddress);
            const senderAddress = new Address(address);

            let tx;

            if (tokenIdentifier && tokenIdentifier !== 'EGLD') {
                // ESDT Transfer Logic
                console.log(`--- Initiating Devnet ESDT Deposit (${tokenIdentifier}) ---`);
                console.log(`Amount: ${amount} ${tokenIdentifier}`);

                // ESDTTransfer argument format:
                // Function: ESDTTransfer
                // Args:
                // 1. Token Identifier (hex)
                // 2. Amount (hex)
                // 3. Function to call on destination (hex) - "deposit"

                const tokenHex = Buffer.from(tokenIdentifier).toString('hex');
                // Ensure even length for hex string
                let amountHex = value.toString(16);
                if (amountHex.length % 2 !== 0) amountHex = '0' + amountHex;

                const funcHex = Buffer.from("deposit").toString('hex');

                const dataString = `ESDTTransfer@${tokenHex}@${amountHex}@${funcHex}`;

                tx = new Transaction({
                    value: 0n, // 0 EGLD for ESDT transfer
                    data: new TextEncoder().encode(dataString),
                    receiver: receiverAddress,
                    sender: senderAddress,
                    gasLimit: 100_000_000n, // Increased gas for ESDT transfer
                    chainID: network.chainId
                });

            } else {
                // EGLD Deposit Logic (Standard)
                console.log(`--- Initiating Devnet EGLD Deposit ---`);
                console.log(`Amount: ${amount} EGLD`);

                tx = new Transaction({
                    value: value,
                    data: new TextEncoder().encode("deposit"),
                    receiver: receiverAddress,
                    sender: senderAddress,
                    gasLimit: 100_000_000n,
                    chainID: network.chainId
                });
            }

            const sessionId = await signAndSendTransactions({
                transactions: [tx],
                transactionsDisplayInfo: {
                    processingMessage: 'Processing Deposit...',
                    errorMessage: 'Deposit failed',
                    successMessage: 'Deposit successful'
                },
                onSuccess
            });

            return sessionId;
        } catch (error) {
            console.error('Deposit transaction failed:', error);
        }
    };

    return { deposit };
};
