enum Layer2Type {
  ZK_SYNC = "ZK_SYNC",
  LOOPRING = "LRC",
}

enum OperationType {
  Deposit = "Deposit",
  Transfer = "Transfer",
  Withdrawal = "Withdrawal",
}

type Operation = {
  address: string;
  amount: string;
  fee: string;
};

type Deposit = Operation & {
  type: OperationType.Deposit;
};
type Transfer = Operation & {
  type: OperationType.Transfer;
};
type Withdrawal = Operation & {
  type: OperationType.Withdrawal;
};

type TokenDeposit = Deposit & {
  token: string;
  approveForErc20: boolean;
};

type TokenTransfer = Transfer & {
  token: string;
};

type TokenWithdrawal = Withdrawal & {
  token: string;
};

type Receipt = {
  operationType: any;
  from: string;
  to: string;
  token: string; // ETH in case of no token
  amount: string;
  fee: string;
  blockNumber: number;
  nonce: number;
  hash: string;
  createdAt: string;
  failReason?: string;
  committed: boolean;
  verified: boolean;
  l2_data?: any;
};

type DepositReceipt = Receipt & {
  operationType: OperationType.Deposit;
  l2_data: {
    accountId: string;
  };
};

type TransferReceipt = Receipt & {
  operationType: OperationType.Transfer;
  l2_data: {
    accountId: string;
    signature: {
      pubKey: string;
      signature: string;
    };
  };
};

type WithdrawalReceipt = Receipt & {
  operationType: OperationType.Withdrawal;
  l2_data: {
    accountId: string;
    signature: {
      pubKey: string;
      signature: string;
    };
  };
};
