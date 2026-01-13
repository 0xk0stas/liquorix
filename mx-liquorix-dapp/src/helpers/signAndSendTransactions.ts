import {
  getAccountProvider,
  Transaction,
  TransactionManager,
  TransactionsDisplayInfoType
} from 'lib';

type SignAndSendTransactionsProps = {
  transactions: Transaction[];
  transactionsDisplayInfo?: TransactionsDisplayInfoType;
  onSuccess?: () => void;
  onFail?: () => void;
};

export const signAndSendTransactions = async ({
  transactions,
  transactionsDisplayInfo,
  onSuccess,
  onFail
}: SignAndSendTransactionsProps) => {
  const provider = getAccountProvider();
  const txManager = TransactionManager.getInstance();

  const signedTransactions = await provider.signTransactions(transactions);
  const sentTransactions = await txManager.send(signedTransactions);
  const sessionId = await txManager.track(sentTransactions, {
    transactionsDisplayInfo,
    ...(onSuccess ? { onSuccess: async () => onSuccess() } : {}),
    ...(onFail ? { onFail: async () => onFail() } : {})
  });

  return sessionId;
};
