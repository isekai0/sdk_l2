import { Network, OperationType, Layer2Type } from '../src/types';
import { Layer2Manager } from '../src/Layer2Manager';
import { Layer2Provider } from '../src/Layer2Provider';
import { Layer2WalletBuilder } from '../src/Layer2WalletBuilder';
import { Layer2Wallet } from '../src/Layer2Wallet';
import { LoopringClientService } from '../src/loopring/LoopringClientService';
import { LoopringLayer2Provider } from '../src/loopring/LoopringLayer2Provider';
import { LoopringLayer2Wallet } from '../src/loopring/LoopringLayer2Wallet';
import { UrlEddsaSignHelper } from '../src/loopring/EddsaSignHelper';

import { Deposit } from '../src/Operation';

import { ethers } from 'ethers';
import { AxiosRequestConfig } from 'axios';

require('dotenv').config();

// Define 10-second timeout.
jest.setTimeout(10_000);

const network: Network = 'goerli';

let layer2ProviderManager: Layer2Manager;
let layer2Provider: Layer2Provider;
let layer2WalletBuilder: Layer2WalletBuilder;
let layer2Wallet: Layer2Wallet;
let loopringClientService: LoopringClientService;

describe('Integration tests (require connection to a real service)', () => {
  // Common setup.
  beforeAll(async () => {
    layer2ProviderManager = Layer2Manager.Instance;

    // Obtain reference to the L2 provider.
    layer2Provider = await layer2ProviderManager.getProviderByLayer2Type(
      Layer2Type.LOOPRING,
      network
    );

    // Obtain layer-2 wallet builder.
    layer2WalletBuilder = layer2Provider.getLayer2WalletBuilder();

    // Show how to obtain the ethers Signer.
    const ethersSigner = getMockedSigner(network);

    // Obtain the layer-2 wallet from provider-specific options.
    layer2Wallet = await layer2WalletBuilder.fromOptions({ ethersSigner });

    // Required expectations.
    expect(layer2Provider.getSupportedLayer2Type()).toBe(Layer2Type.LOOPRING);
    expect(layer2Provider.getName().length).toBeGreaterThan(0);
    expect(layer2Wallet).toBeTruthy();
  });

  afterAll(async () => {
    if (layer2Provider) {
      await layer2Provider.disconnect();
    }
  });

  // TODO: Most of these will be omitted since they call real services before mocking.
  xit('Get collection of supported tokens', async () => {
    // Test Setup.
    // Method under test.
    const supportedTokens = await layer2Provider.getSupportedTokens();

    // Expectations.
    // Expect it has some contents.
    expect(supportedTokens.size).toBeGreaterThan(0);
    // Expect it contains Ethereum.
    expect(supportedTokens.has('ETH')).toBeTruthy();
  });

  xit('Do deposit operation L1 -> L2', async () => {
    // Test setup.
    // I am going to deposit to my own address in L2.
    const myAddress = layer2Wallet.getAddress();

    // Create Deposit data.
    const deposit = Deposit.createDeposit({
      toAddress: myAddress,
      amount: '1.2', // Desired amount
      fee: '0.01', // Desired fee. This is a LAYER ONE regular fee.
    });

    // Method under test. Perform DEPOSIT operation.
    const result = await layer2Wallet.deposit(deposit);

    // The result object contains the necessary methods to obtain a receipt.
    const receipt = await result.getReceipt();

    // Expectations.
    expect(receipt.operationType).toBe(OperationType.Deposit);
    expect(receipt.to).toBe(myAddress);
    expect(receipt.committed).toBeTruthy();
  });

  xit('Register/update account EDDSA key', async () => {
    const provider = layer2Provider as LoopringLayer2Provider;
    const wallet = layer2Wallet as LoopringLayer2Wallet;
    const clientService = wallet.getClientService();
    const userInfo = await clientService.getUserInfo();

    const nonce = userInfo.nonce as number;
    expect(nonce).toBeTruthy();

    const contractAddress = provider.getLoopringExchangeContractAddressByNetwork(
      network
    );
    const newKeyPair = await clientService.getAccountKeyPair(
      contractAddress,
      nonce
    );
  });

  xit('Check account key generation used to sign REST API requests', async () => {
    // Test setup.
    const loopringProvider = layer2Provider as LoopringLayer2Provider;
    const contractAddress = loopringProvider.getLoopringExchangeContractAddressByNetwork(
      network
    );

    const clientService = (layer2Wallet as LoopringLayer2Wallet).getClientService();
    const nonce = 0;

    // Method under test
    const accountKeyPair = await clientService.getAccountKeyPair(
      contractAddress,
      nonce
    );

    // Collect results.
    const accountKey = clientService.keyPairConcat(accountKeyPair);

    // Expectations.
    expect(accountKey.length).toBe(2 + 64 * 3);
  });

  xit('Get accounts api key for off-chain requests', async () => {
    const wallet = layer2Wallet as LoopringLayer2Wallet;
    const clientService = wallet.getClientService();
    const userInfo = await clientService.getUserInfo();

    clientService.initUrlSignHelper(getEddsaKey());

    const accountId = userInfo.accountId;
    const key = await clientService.getUserOffchainApiKey(accountId);
    console.log(key);
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

function getEddsaKey(): string {
  const DO_NOT_REVEAL_THIS_EDDSA_KEY: string = process.env
    .TEST_EDDSA_PRIVATE_KEY!;
  expect(DO_NOT_REVEAL_THIS_EDDSA_KEY).toBeTruthy();

  return DO_NOT_REVEAL_THIS_EDDSA_KEY;
}
