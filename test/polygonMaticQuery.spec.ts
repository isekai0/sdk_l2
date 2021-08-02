import { Network, OperationType, Layer2Type, Receipt } from '../src/types';
import { Deposit, Withdrawal, Transfer } from '../src/Operation';
import { Layer2Manager } from '../src/Layer2Manager';
import { Layer2Provider } from '../src/Layer2Provider';
import { ethers } from 'ethers';
import { Layer2WalletBuilder } from '../src/Layer2WalletBuilder';
import { Layer2Wallet } from '../src/Layer2Wallet';
import { PolygonMaticLayer2Wallet } from '../src/polygon/matic/PolygonMaticLayer2Wallet';

require('dotenv').config();

// Define 2-minute timeout.
jest.setTimeout(1_200_000);

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

  xit('Query ETH Balance in L2', async () => {
    // Method under test.
    const balance = await layer2Wallet.getBalance();

    // Expectations.
    // Expect some truthy value.
    expect(balance).toBeTruthy();
  });

  xit('Query ERC-20 Token Balance in L2', async () => {
    // Method under test.
    const balance = await layer2Wallet.getTokenBalance('DAI');

    // Expectations.
    // Expect some truthy value.
    expect(balance).toBeTruthy();
  });

  xit('Multiple batch balance', async () => {
    // Method under test.
    const tokenBalances = await layer2Wallet.getAccountTokenBalances();

    // Expectations.
    // ETH must always be there in the result.
    expect(tokenBalances['ETH']['verified']).toBeTruthy();
  });

  xit('Do Ether deposit', async () => {
    // Test setup.
    const myAddress = layer2Wallet.getAddress();

    // Create Deposit data.
    const deposit = Deposit.createDeposit({
      toAddress: myAddress,
      amount: '0.06', // Desired amount
      fee: '0.01', // Desired fee. This is a LAYER ONE regular fee.
    });

    // Method under test.
    const depositResult = await layer2Wallet.deposit(deposit);

    // Get receipt.
    const depositReceipt: Receipt = await depositResult.getReceipt();

    // Expectations.
    expect(depositResult.hash).toBeTruthy();
    expect(depositReceipt.blockNumber).toBeTruthy();
    expect(depositReceipt.blockNumber).toBeGreaterThan(0);
  });

  xit('Do ERC-20 deposit', async () => {
    // Test setup.
    const myAddress = layer2Wallet.getAddress();

    // Create Deposit data.
    const deposit: Deposit = Deposit.createTokenDeposit({
      tokenSymbol: 'DAI',
      toAddress: myAddress,
      amount: '30.0', // Desired amount.
      fee: '0.01',
      approveForErc20: true,
    });

    // Method under test.
    const depositResult = await layer2Wallet.deposit(deposit);

    // Get receipt.
    const depositReceipt: Receipt = await depositResult.getReceipt();

    // Expectations.
    expect(depositResult.hash).toBeTruthy();
    expect(depositReceipt.blockNumber).toBeTruthy();
    expect(depositReceipt.blockNumber).toBeGreaterThan(0);
  });

  xit('Transfer ETH within Polygon', async () => {
    // Test setup.
    const toAddress = '0xA01880D867237157Dd680192565D9CBA774Bd664';

    // Create Transfer data.
    const transfer: Transfer = new Transfer({
      tokenSymbol: 'ETH',
      toAddress,
      amount: '0.15',
      fee: '0.01',
    });

    // Method under test.
    const transferResult = await layer2Wallet.transfer(transfer);

    // Get receipt.
    const transferReceipt: Receipt = await transferResult.getReceipt();

    // Expectations.
    expect(transferResult.hash).toBeTruthy();
    expect(transferReceipt.blockNumber).toBeTruthy();
    expect(transferReceipt.blockNumber).toBeGreaterThan(0);
  });

  xit('Transfer ERC20 tokens within Polygon', async () => {
    // Test setup.
    const toAddress = '0xA01880D867237157Dd680192565D9CBA774Bd664';

    // Create Transfer data.
    const transfer: Transfer = new Transfer({
      tokenSymbol: 'DAI',
      toAddress,
      amount: '15',
      fee: '0.01',
    });

    // Method under test.
    const transferResult = await layer2Wallet.transfer(transfer);

    // Get receipt.
    const transferReceipt: Receipt = await transferResult.getReceipt();

    // Expectations.
    expect(transferResult.hash).toBeTruthy();
    expect(transferReceipt.blockNumber).toBeTruthy();
    expect(transferReceipt.blockNumber).toBeGreaterThan(0);
  });

  xit('Withdraw ETH from Polygon', async () => {
    // Test setup.

    // Withdraw back to the LAYER 1 wallet's address.
    const myAddress = layer2Wallet.getAddress();

    // A withdrawal fee from LAYER TWO.
    const withdrawalFee = '0.01';

    const withdrawal = new Withdrawal({
      toAddress: myAddress,
      amount: '0.07', // Desired amount to withdraw.
      fee: withdrawalFee, // Desired fee to pay. This is a LAYER TWO fee.
      tokenSymbol: 'ETH',
    });

    // Method under test.
    const withdrawResult = await layer2Wallet.withdraw(withdrawal);

    // Get receipt.
    const withdrawReceipt: Receipt = await withdrawResult.getReceipt();

    // Await balance update in L1.
    const newBalanceResult = await withdrawReceipt.waitForNewBalance();

    // Expectations.
    expect(withdrawResult.hash).toBeTruthy();
    expect(withdrawReceipt.blockNumber).toBeTruthy();
    expect(withdrawReceipt.blockNumber).toBeGreaterThan(0);
    expect(newBalanceResult).toBeTruthy();
  });

  xit('Withdraw ERC20 token from Polygon', async () => {
    // Test setup.

    // Withdraw back to the LAYER 1 wallet's address.
    const myAddress = layer2Wallet.getAddress();

    // A withdrawal fee from LAYER TWO.
    const withdrawalFee = '0.01';

    const withdrawal = new Withdrawal({
      toAddress: myAddress,
      amount: '15', // Desired amount to withdraw.
      fee: withdrawalFee, // Desired fee to pay. This is a LAYER TWO fee.
      tokenSymbol: 'DAI',
    });

    // Method under test.
    const withdrawResult = await layer2Wallet.withdraw(withdrawal);

    // Get receipt.
    const withdrawReceipt: Receipt = await withdrawResult.getReceipt();

    // Await balance update in L1.
    const newBalanceResult = await withdrawReceipt.waitForNewBalance();

    // Expectations.
    expect(withdrawResult.hash).toBeTruthy();
    expect(withdrawReceipt.blockNumber).toBeTruthy();
    expect(withdrawReceipt.blockNumber).toBeGreaterThan(0);
    expect(newBalanceResult).toBeTruthy();
  });

  xit('Exit from Polygon', async () => {
    // Use the code mostly for freeing funds in case the "exit" operation was not
    // executed after burning the tokens in L2.
    const polygonWallet = layer2Wallet as PolygonMaticLayer2Wallet;
    const burnTxHash =
      '0x9a971b76eb8b4e5ebfa97f258efc3704428db54463278823315e77aaf389abb6';
    const burnTxBlockNumber = 17487357;

    // Method under test.
    const result = await polygonWallet.exitFromPolygon(
      burnTxHash,
      burnTxBlockNumber,
      true
    );

    // Expectations.
    expect(result).toBeTruthy();
  });

  xit('', async () => {
    const events = await layer2Wallet.getAccountEvents();
    console.log(events);
  });
});

// Utility functions

function getMockedSigner(network: Network): ethers.Signer {
  // TODO: See what's going on here.
  const ethers = require('ethers');

  const ethersProvider = ethers.getDefaultProvider(network, {
    // alchemy: process.env.TEST_ALCHEMY_API_TOKEN,
    // infura: process.env.TEST_INFURA_PROJECT_ID
  });

  const DO_NOT_REVEAL_THESE_MNEMONICS = process.env.TEST_MNEMONICS;
  expect(DO_NOT_REVEAL_THESE_MNEMONICS).toBeTruthy();

  // Create ethereum wallet using ethers.js
  // TODO: Obtain signer from mocked blocknative and provider.
  const ethersWallet = ethers.Wallet.fromMnemonic(
    DO_NOT_REVEAL_THESE_MNEMONICS
  ).connect(ethersProvider);

  return ethersWallet;
}
