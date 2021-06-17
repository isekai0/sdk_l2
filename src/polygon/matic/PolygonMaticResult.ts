import { Receipt, Result } from '../../types';
import { Operation } from '../../Operation';
import { ethers } from 'ethers';

export class PolygonMaticResult implements Result {
    // The result holder is an awaited transaction as a result of calling the
    // the smart contract's method.
    constructor(
        private resultHolder: { hash: string, awaitable: any },
        private operation: Operation,
        private gasPrice: ethers.BigNumber
    ) {
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
        let result: Receipt = {
            hash: this.hash,
            to: this.operation.toAddress,
            tokenSymbol: this.operation.tokenSymbol, // ETH in case of no token
            amount: this.operation.amount,
            operationType: this.operation.type,
            fee: '0', // Default value when failed.
        };

        try {
            const receipt = await this.resultHolder.awaitable;

            // Calculate the transaction fee for this operation.
            const ethFee = this.calculateFee(
                ethers.BigNumber.from(receipt.gasUsed),
                this.gasPrice
            );

            // Create transaction receipt.
            result = {
                ...result,
                blockNumber: receipt.blockNumber,
                fee: ethFee,
                committed: true,
                verified: false, // In Polygon/Matic balance is updated after 5-7 minutes.
            };
        } catch (err) {
            result = {
                ...result,
                blockNumber: undefined, // Did not make it into any block.
                committed: false,
                verified: false,
            };
        }

        return result;
    }

    private calculateFee(gasUsed: ethers.BigNumber, gasPrice: ethers.BigNumber): string {
        // gasUsed and gasPrice are both in Wei.
        const feeInWei = gasUsed.mul(gasPrice);
        const ethFeeString = ethers.utils.formatEther(feeInWei);
        return ethFeeString;
    }
}
