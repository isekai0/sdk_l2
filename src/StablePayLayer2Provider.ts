import { Wallet } from "Wallet";

export interface StablePayLayer2Provider {
  getName(): string;
  getDescription(): string;
  getWallet(): Wallet;
  getSupportedLayer2Type(): Layer2Type;
  getSupportedTokens(): Set<string>;

  getBalance(token: string): string;
  getBalanceVerified(token: string): string;
  getWithdrawalFee(address: string, token: string): string;
  getTransferFee(address: string, token: string): string;

  getReceipt(txHash: string): Receipt;

  performDeposit(deposit: Deposit): DepositResult;
  performTransfer(transfer: Transfer): TransferResult;
  performWithdrawal(withdrawal: Withdrawal): WithdrawalResult;
}
