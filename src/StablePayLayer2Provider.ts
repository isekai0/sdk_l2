import { Wallet } from "Wallet";

export interface StablePayLayer2Provider {
  getName(): string;
  getDescription(): string;
  getWallet(): Wallet;
  getBalance(token: string): string;
  getBalanceVerified(token: string): string;
  getSupportedLayer2Type(): Layer2Type;
  getSupportedTokens(): Set<string>;

  performDeposit(deposit: Deposit): DepositResult;
  performTransfer(transfer: Transfer): TransferResult;
  performWithdrawal(withdrawal: Withdrawal): WithdrawalResult;
}
