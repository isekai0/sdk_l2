import { Receipt, Result } from '../types';
import { Operation } from '../Operation';

export class LoopringResult implements Result {
  // The result holder is an awaited transaction as a result of calling the
  // the smart contract's method.
  constructor(private resultHolder: any, private operation: Operation) {}

  get hash(): string {
    // Obtain transaction hash from result object.
    const txHash = this.resultHolder.hash;
    return txHash;
  }

  getReceipt(): Promise<Receipt> {
    return this.getReceiptInternal(false);
  }

  getReceiptVerify(): Promise<Receipt> {
    return this.getReceipt();
  }

  private async getReceiptInternal(doVerify: boolean): Promise<Receipt> {
    let result: Receipt;
    try {
      const receipt = await this.resultHolder.wait();

      // Create transaction receipt.
      result = {
        hash: this.hash,
        to: this.operation.toAddress,
        tokenSymbol: this.operation.tokenSymbol, // ETH in case of no token
        amount: this.operation.amount,
        fee: this.operation.fee,
        blockNumber: 0, // TODO: get from tx
        committed: true, // TODO: get from layer 2 op
        verified: true, // TODO: get from layer 2 op
        operationType: this.operation.type,
      };
    } catch (err) {
      console.error('ERROR GETTING RECEIPT');
      console.error(err);
      throw err;
    }

    return result;
  }
}
