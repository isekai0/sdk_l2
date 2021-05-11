import { Network, OperationType, Layer2Type } from '../src/types';
import { Layer2Manager } from '../src/Layer2Manager';
import { Layer2Provider } from '../src/Layer2Provider';
import { Layer2WalletBuilder } from '../src/Layer2WalletBuilder';
import { Layer2Wallet } from '../src/Layer2Wallet';

import { ethers } from 'ethers';

require('dotenv').config();

// Define 10-second timeout.
jest.setTimeout(10_000);

let layer2ProviderManager: Layer2Manager;
let provider: Layer2Provider;
let layer2WalletBuilder: Layer2WalletBuilder;
let layer2Wallet: Layer2Wallet;

describe('Integration tests (require connection to a real service)', () => {
  const network: Network = 'mainnet';

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
