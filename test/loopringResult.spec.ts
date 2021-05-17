import { Deposit } from '../src/Operation';
import { LoopringResult } from '../src/loopring/LoopringResult';

import { ethers } from 'ethers';

describe('Loopring transaction result tests', () => {
  it('Verify correct fee calculation on deposits', async () => {
    // Test setup.
    const myAddress = '0x89Ac2c53dD852Fe896176CC18D73384844606247';
    // Data for fee calculation.
    // Gas price of 50 GWei
    const sampleGasPriceHex = '0xba43b7400';
    const sampleGasUsed = 73_512;
    const expectedFee = '0.0036756';

    // Create Deposit data.
    const deposit = Deposit.createDeposit({
      toAddress: myAddress,
      amount: '0.1', // Desired amount
      fee: '0', // Desired fee. This is a LAYER ONE regular fee.
    });

    // Sample received transactions.
    const tx: ethers.Transaction & Record<string, any> = {
      chainId: 1,
      nonce: 5,
      data: 'dummy data',
      gasLimit: ethers.BigNumber.from('300000'),
      gasPrice: ethers.BigNumber.from(sampleGasPriceHex),
      value: ethers.BigNumber.from('0x470de4df820000'),
    };

    // Sample transaction receipt.
    const txReceipt: ethers.ContractReceipt = {
      to: myAddress,
      from: myAddress,
      contractAddress: '0x2e76EBd1c7c0C8e7c2B875b6d505a260C525d25e',
      transactionIndex: 0,
      gasUsed: ethers.BigNumber.from(sampleGasUsed),
      logsBloom: '',
      blockHash: 'ha',
      blockNumber: 4,
      confirmations: 2,
      transactionHash: '',
      logs: [],
      cumulativeGasUsed: ethers.BigNumber.from('0x0ba43b7400'),
      byzantium: true,
    };

    // Mock wait() async function to return the transaction's receipt.
    tx['wait'] = async (): Promise<ethers.ContractReceipt> => {
      return txReceipt;
    };

    // Fake Loopring operation result.
    const loopringResult = new LoopringResult(tx, deposit);

    // Method under test.
    const receipt = await loopringResult.getReceipt();

    // Expectations.
    // Expect correct fee calculation.
    expect(receipt.fee).toBe(expectedFee);
  });
});
