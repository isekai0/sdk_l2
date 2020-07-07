enum Layer2Type {
  ZK_SYNC = "ZK_SYNC",
  LOOPRING = "LRC",
}

type Operation = {
  address: string;
  amount: string;
};

type Deposit = Operation & {};
type Transfer = Operation & {};
type Withdrawal = Operation & {};

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
