interface OperationResult {
  awaitReceipt(): Receipt;
  awaitReceiptVerify(): Receipt;
}

interface DepositResult extends OperationResult {}

interface TransferResult extends OperationResult {}

interface WithdrawalResult extends OperationResult {}
