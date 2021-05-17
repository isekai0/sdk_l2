import { Receipt, Result } from '../types';
import { Operation } from '../Operation';
import { BigNumber } from '@ethersproject/bignumber';
import { ethers } from 'ethers';

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
    return this.getReceiptInternal();
  }

  getReceiptVerify(): Promise<Receipt> {
    return this.getReceipt();
  }

  private async getReceiptInternal(): Promise<Receipt> {
    let result: Receipt = {
      hash: this.hash,
      to: this.operation.toAddress,
      tokenSymbol: this.operation.tokenSymbol, // ETH in case of no token
      amount: this.operation.amount,
      operationType: this.operation.type,
      fee: '0',
    };

    try {
      const receipt = await this.resultHolder.wait();

      // TODO: Customize this operations different from deposit.
      const ethFee = this.calculateFee(
        receipt.gasUsed,
        this.resultHolder.gasPrice
      );

      // Create transaction receipt.
      result = {
        ...result,
        blockNumber: receipt.blockNumber, // TODO: get from tx
        fee: ethFee,
        committed: true, // TODO: get from layer 2 on transfers and withdrawals
        verified: true, // TODO: get from layer 2 on transfers and withdrawals
      };
    } catch (err) {
      result = {
        ...result,
        blockNumber: undefined, // Did not make it into any block.
        committed: false,
        verified: false,
      };

      console.error('ERROR GETTING RECEIPT');
      console.error(err);
      throw err;
    }

    return result;
  }

  private calculateFee(gasUsed: BigNumber, gasPrice: BigNumber): string {
    // gasUsed and gasPrice are both in Wei.
    const feeInWei = gasUsed.mul(gasPrice);
    const ethFeeString = ethers.utils.formatEther(feeInWei);
    return ethFeeString;
  }
}
