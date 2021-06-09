import { Network, OperationType, Layer2Type } from '../src/types';
import { Deposit, Withdrawal, Transfer } from '../src/Operation';
import { Layer2Manager } from '../src/Layer2Manager';
import { Layer2Provider } from '../src/Layer2Provider';
import { ethers } from 'ethers';
import { Layer2WalletBuilder } from '../src/Layer2WalletBuilder';
import { Layer2Wallet } from '../src/Layer2Wallet';

require('dotenv').config();

// Define 2-minute timeout.
jest.setTimeout(120_000);

// Global variables to all tests.
const SAMPLE_ADDRESS = '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7';

let layer2ProviderManager: Layer2Manager;
let provider: Layer2Provider;
let layer2WalletBuilder: Layer2WalletBuilder;
let ethersSigner: ethers.Signer;
let layer2Wallet: Layer2Wallet;

describe('Query-related tests', () => {
  const network: Network = 'goerli';

  // Common setup.
  beforeAll(async () => {
    layer2ProviderManager = Layer2Manager.Instance;

    // Obtain reference to the L2 provider.
    provider = await layer2ProviderManager.getProviderByLayer2Type(
      Layer2Type.POLYGON_MATIC,
      network
    );

    // Obtain layer-2 wallet builder.
    layer2WalletBuilder = provider.getLayer2WalletBuilder();

    // Show how to obtain the ethers Signer.
    ethersSigner = getMockedSigner(network);

    // Obtain the layer-2 wallet from provider-specific options.
    layer2Wallet = await layer2WalletBuilder.fromOptions({ ethersSigner });

    // Required expectations.
    expect(provider.getSupportedLayer2Type()).toBe(Layer2Type.POLYGON_MATIC);
    expect(provider.getName().length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    if (provider) {
      await provider.disconnect();
    }
  });

  // TODO: Re-enable tests when they do not longer invoke remote calls.

  xit('Bring supported tokens', async () => {
    // Test Setup.

    // Method under test.
    const tokenSet: Set<string> = await provider.getSupportedTokens();

    // Expectations.
    // Expect at least one token retrieved.
    expect(tokenSet.size).toBeGreaterThan(0);
  });

  xit('Query L2 Balance', async () => {
    await layer2Wallet.getAccountBalances();
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
