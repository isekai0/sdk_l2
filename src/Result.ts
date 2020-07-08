interface Result {
  awaitReceipt(): Receipt;
  awaitReceiptVerify(): Receipt;
}
interface DepositResult extends Result {
  awaitReceipt(): DepositReceipt;
  awaitReceiptVerify(): DepositReceipt;
}

interface TransferResult extends Result {
  awaitReceipt(): TransferReceipt;
  awaitReceiptVerify(): TransferReceipt;
}

interface WithdrawalResult extends Result {
  awaitReceipt(): TransferReceipt;
  awaitReceiptVerify(): TransferReceipt;
}
