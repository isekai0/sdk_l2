import { Network, OperationType, Layer2Type } from '../src/types';
import { Layer2Manager } from '../src/Layer2Manager';
import { Layer2Provider } from '../src/Layer2Provider';
import { Layer2WalletBuilder } from '../src/Layer2WalletBuilder';
import { Layer2Wallet } from '../src/Layer2Wallet';
import { Deposit, Withdrawal, Transfer } from '../src/Operation';
import { LoopringResult } from '../src/loopring/LoopringResult';

import { ethers } from 'ethers';

require('dotenv').config();

// Define 10-second timeout.
jest.setTimeout(10_000);

const network: Network = 'goerli';

let layer2ProviderManager: Layer2Manager;
let provider: Layer2Provider;
let layer2WalletBuilder: Layer2WalletBuilder;
let layer2Wallet: Layer2Wallet;

describe('Integration tests (require connection to a real service)', () => {
  // Common setup.
  beforeAll(async () => {
    layer2ProviderManager = Layer2Manager.Instance;

    // Obtain reference to the L2 provider.
    provider = await layer2ProviderManager.getProviderByLayer2Type(
      Layer2Type.LOOPRING,
      network
    );

    // Obtain layer-2 wallet builder.
    layer2WalletBuilder = provider.getLayer2WalletBuilder();

    // Show how to obtain the ethers Signer.
    const ethersSigner = getMockedSigner(network);

    // Obtain the layer-2 wallet from provider-specific options.
    layer2Wallet = await layer2WalletBuilder.fromOptions({ ethersSigner });

    // Required expectations.
    expect(provider.getSupportedLayer2Type()).toBe(Layer2Type.LOOPRING);
    expect(provider.getName().length).toBeGreaterThan(0);
    expect(layer2Wallet).toBeTruthy();
  });

  afterAll(async () => {
    if (provider) {
      await provider.disconnect();
    }
  });

  // TODO: Most of these will be omitted since they call real services before mocking.
  xit('Get collection of supported tokens', async () => {
    // Test Setup.
    // Method under test.
    const supportedTokens = await provider.getSupportedTokens();

    // Expectations.
    // Expect it has some contents.
    expect(supportedTokens.size).toBeGreaterThan(0);
    // Expect it contains Ethereum.
    expect(supportedTokens.has('ETH')).toBeTruthy();
  });

  xit('Check deposit operation L1 -> L2', async () => {
    // Test setup.
    // I am going to deposit to my own address in L2.
    const myAddress = layer2Wallet.getAddress();

    // Create Deposit data.
    const deposit = Deposit.createDeposit({
      toAddress: myAddress,
      amount: '0.1', // Desired amount
      fee: '0.01', // Desired fee. This is a LAYER ONE regular fee.
    });

    // Method under test. Perform DEPOSIT operation.
    const result = await layer2Wallet.deposit(deposit);

    // The result object contains the necessary methods to obtain a receipt
    // either Verified or non-verified. Verified takes long.
    const receipt = await result.getReceipt();

    // Expectations.
    expect(receipt.operationType).toBe(OperationType.Deposit);
    expect(receipt.to).toBe(myAddress);
    expect(receipt.committed).toBeTruthy();
  });

  it('Verify correct fee calculation on deposits', async () => {
    // Test setup.
    // I am going to deposit to my own address in L2.
    const myAddress = layer2Wallet.getAddress();
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

// Utility functions
function getMockedSigner(network: Network): ethers.Signer {
  // TODO: See what's going on here.
  const ethers = require('ethers');

  const ethersProvider = new ethers.getDefaultProvider(network);

  const DO_NOT_REVEAL_THESE_MNEMONICS = process.env.TEST_MNEMONICS;
  expect(DO_NOT_REVEAL_THESE_MNEMONICS).toBeTruthy();

  // Create ethereum wallet using ethers.js
  // TODO: Obtain signer from mocked blocknative and provider.
  const ethersWallet = ethers.Wallet.fromMnemonic(
    DO_NOT_REVEAL_THESE_MNEMONICS
  ).connect(ethersProvider);

  return ethersWallet;
}
