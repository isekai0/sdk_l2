import { Receipt, Result } from '../../types';
import { Operation } from '../../Operation';
import { ethers } from 'ethers';

export class PolygonMaticResult implements Result {
  // The result holder is an awaited transaction as a result of calling the
  // the smart contract's method.
  constructor(
    private resultHolder: { hash: string; awaitable: any },
    private operation: Operation,
    private gasPrice: ethers.BigNumber,
    private exitFromPolygonCallback?: (
      burnTxHash: string,
      burnTxBlockNumber: number
    ) => Promise<any>
  ) {
    if (!this.exitFromPolygonCallback) {
      this.exitFromPolygonCallback = (
        _burnTxHash: string,
        _burnTxBlockNumber: number
      ) => Promise.resolve({});
    }
    // Left empty.
  }

  get hash(): string {
    // Obtain transaction hash from result object.
    const txHash = this.resultHolder.hash;
    return txHash;
  }

  getReceipt(): Promise<Receipt> {
    return this.getReceiptInternal();
  }

  getReceiptVerify(): Promise<Receipt> {
    return this.getReceipt();
  }

  private async getReceiptInternal(): Promise<Receipt> {
    let receipt: Receipt = {
      hash: this.hash,
      to: this.operation.toAddress,
      tokenSymbol: this.operation.tokenSymbol, // ETH in case of no token
      amount: this.operation.amount,
      operationType: this.operation.type,
      fee: '0', // Default value when failed.
      waitForNewBalance: () => Promise.resolve({}), // Default resolved promise when failure.
    };

    try {
      // As soon as we receive a receipt of the burn transaction in the child
      // chain, proceed to release funds back to the owner.
      const childChainReceipt = await this.resultHolder.awaitable;

      // Calculate the transaction fee for this operation.
      const ethFee = this.calculateFee(
        ethers.BigNumber.from(childChainReceipt.gasUsed),
        this.gasPrice
      );

      // Proceed to free funds in parent chain (L1) and get the promise so the
      // front end application may await it until funds are released.
      const exitFromPolygonPromise = this.exitFromPolygonCallback!(
        this.hash,
        childChainReceipt.blockNumber
      );

      // Create transaction receipt.
      receipt = {
        ...receipt,
        blockNumber: childChainReceipt.blockNumber,
        fee: ethFee,
        committed: true,
        verified: false, // In Polygon/Matic balance is updated after 5-7 minutes.
        waitForNewBalance: () => exitFromPolygonPromise,
      };
    } catch (err) {
      receipt = {
        ...receipt,
        blockNumber: undefined, // Did not make it into any block.
        committed: false,
        verified: false,
      };
    }

    return receipt;
  }

  private calculateFee(
    gasUsed: ethers.BigNumber,
    gasPrice: ethers.BigNumber
  ): string {
    // gasUsed and gasPrice are both in Wei.
    const feeInWei = gasUsed.mul(gasPrice);
    const ethFeeString = ethers.utils.formatEther(feeInWei);
    return ethFeeString;
  }
}
