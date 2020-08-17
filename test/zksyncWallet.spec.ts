import { MockProxy } from 'jest-mock-extended';
import { Wallet as ZkSyncWallet, Provider as ZkSyncProvider } from 'zksync';
import { Network, OperationType, Layer2Type } from '../src/types';
import { Deposit, Withdrawal, Transfer } from '../src/Operation';
import { StablePayLayer2Manager } from '../src/StablePayLayer2Manager';
import { StablePayLayer2Provider } from '../src/StablePayLayer2Provider';
import { ethers, BigNumber } from 'ethers';
import { Layer2WalletBuilder } from '../src/Layer2WalletBuilder';
import { Layer2Wallet } from '../src/Layer2Wallet';
import { ZkSyncLayer2Wallet } from '../src/zksync/ZkSyncLayer2Wallet';

import { buildMockSigner, buildMockWallet, buildMockProvider } from './helpers';

require('dotenv').config();

// Define 2-minute timeout.
jest.setTimeout(120_000);

// Global variables to all tests.
const SAMPLE_ADDRESS = '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7';
const ETH_BALANCE = BigNumber.from('100000000000000000');

let layer2ProviderManager: StablePayLayer2Manager;
let provider: StablePayLayer2Provider;
let layer2WalletBuilder: Layer2WalletBuilder;
let ethersSigner: MockProxy<ethers.Signer> & ethers.Signer;
let zkSyncWallet: MockProxy<ZkSyncWallet> & ZkSyncWallet;
let zkSyncProvider: MockProxy<ZkSyncProvider> & ZkSyncProvider;
let layer2Wallet: Layer2Wallet;

// TODO: add more unit tests
describe('zkSync Wallet-related functionality testing', () => {
  const network: Network = 'rinkeby';

  // Common setup.
  beforeAll(async () => {
    ethersSigner = buildMockSigner();
    zkSyncWallet = buildMockWallet();
    zkSyncProvider = buildMockProvider();

    // Obtain the layer-2 wallet from provider-specific options.
    layer2Wallet = new ZkSyncLayer2Wallet(
      zkSyncWallet,
      ethersSigner,
      zkSyncProvider
    );

    // mock setup
    zkSyncWallet.address.mockReturnValue(SAMPLE_ADDRESS);
    zkSyncWallet.getBalance.mockReturnValue(
      Promise.resolve(ETH_BALANCE),
    );
  });


  it('should get balance info from wallet', async () => {
    const address = await layer2Wallet.getAddress();
    expect(address).toBe(SAMPLE_ADDRESS);

    const walletBalance = await layer2Wallet.getBalance();
    expect(walletBalance).toBe(ETH_BALANCE.toString());
  });
});
