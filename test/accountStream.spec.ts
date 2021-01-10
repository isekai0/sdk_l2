import { mockDeep, MockProxy } from 'jest-mock-extended';
import { BigNumber } from 'ethers';

import { Network, AccountBalances } from '../src/types';
import { Layer2Wallet } from '../src/Layer2Wallet';

import AccountStream from '../src/AccountStream';

require('dotenv').config();

// Define 2-minute timeout.
jest.setTimeout(120_000);

// Global variables to all tests.
const SAMPLE_ADDRESS = '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7';
const ETH_BALANCE = BigNumber.from('100000000000000000');
const SAMPLE_NETWORK: Network = 'ropsten';

let layer2Wallet: MockProxy<Layer2Wallet> & Layer2Wallet;
let accountStream: AccountStream;
let mockAccountBalances: AccountBalances;

const getInitBalance = () => {
  const INIT_BALANCE: AccountBalances = {
    ETH: {
      symbol: 'ETH',
      balance: BigNumber.from('2000000000000000000'), // 2 ether
      state: 'pending',
    },
    DAI: {
      symbol: 'DAI',
      balance: BigNumber.from('4000000000000000000'), // 4 dai
      state: 'pending',
    },
  };

  return INIT_BALANCE;
};

describe('AccountStream testing', () => {
  // Common setup.
  beforeEach(async () => {
    // Obtain the layer-2 wallet from provider-specific options.
    layer2Wallet = mockDeep<Layer2Wallet>();
    accountStream = new AccountStream(layer2Wallet);

    mockAccountBalances = getInitBalance();

    // Mock setup.
    // Fake upgrade to signing wallet method.
    (layer2Wallet as any).upgradeToSigningWallet = () => Promise.resolve();
    layer2Wallet.getAccountTokenBalances.mockReturnValue(
      Promise.resolve(mockAccountBalances)
    );
  });

  it('should emit event on balance update', async () => {
    // Test setup.
    const emitter = accountStream.getAccountEvents();
    expect.assertions(2);

    // Method under test.
    await accountStream.start();

    emitter.on('balanceUpdate', (event) => {
      console.log(`got event ${JSON.stringify(event)}`);
      // Expectations.
      expect(event).toBeDefined();
      expect(event).toBe(mockAccountBalances);
    });
    // simulate received some either and balance changed
    mockAccountBalances.ETH.balance = BigNumber.from('4000000000000000000');

    await new Promise((resolve) => setTimeout(resolve, 1000));

    accountStream.stop();
  });

  it('should not trigger any event when balance is not updated', async () => {
    // Test setup.
    const emitter = accountStream.getAccountEvents();

    // Method under test.
    await accountStream.start();

    emitter.on('balanceUpdate', (event) => {
      console.log(`got event ${JSON.stringify(event)}`);
      fail(new Error('should not reach here'));
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    accountStream.stop();
  });
});
