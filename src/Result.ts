interface Result {
  getReceipt(): Promise<Receipt>;
  getReceiptVerify(): Promise<Receipt>;
}
interface DepositResult extends Result {
  getReceipt(): Promise<DepositReceipt>;
  getReceiptVerify(): Promise<DepositReceipt>;
}

interface TransferResult extends Result {
  getReceipt(): Promise<TransferReceipt>;
  getReceiptVerify(): Promise<TransferReceipt>;
}

interface WithdrawalResult extends Result {
  getReceipt(): Promise<TransferReceipt>;
  getReceiptVerify(): Promise<TransferReceipt>;
}
