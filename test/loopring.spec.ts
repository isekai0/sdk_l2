import { ethers, BigNumber } from 'ethers';

import { Network, OperationType, Layer2Type } from '../src/types';
import { Deposit } from '../src/Operation';
import { Layer2Manager } from '../src/Layer2Manager';
import { Layer2Provider } from '../src/Layer2Provider';
import { Layer2WalletBuilder } from '../src/Layer2WalletBuilder';
import { Layer2Wallet } from '../src/Layer2Wallet';

import { LoopringLayer2Provider } from '../src/loopring/LoopringLayer2Provider';
import { LoopringLayer2Wallet } from '../src/loopring/LoopringLayer2Wallet';
import {
  EthSignType,
  WeiFeeInfo,
  UpdateAccountMessageRequest,
} from '../src/loopring/types';
import { EIP712Helper } from '../src/loopring/EIP712Helper';

require('dotenv').config();

// Define 10-second timeout.
jest.setTimeout(10_000);

const network: Network = 'goerli';

let layer2ProviderManager: Layer2Manager;
let layer2Provider: Layer2Provider;
let layer2WalletBuilder: Layer2WalletBuilder;
let layer2Wallet: Layer2Wallet;

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
    // Test setup.
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

    const accountId = userInfo.accountId;

    const maxFee: WeiFeeInfo = {
      tokenId: 0, // ETH
      volume: '600000000000000', // <-- That could be an initial safe value.
    };

    // Method under test.
    await clientService.updateAccountEcDSA(
      newKeyPair,
      accountId,
      nonce,
      maxFee
    );

    // Collect result(s).
    const updatedUserInfo = await clientService.getUserInfo();
    const newPublicKeyX = BigNumber.from(newKeyPair.publicKeyX);
    const newPublicKeyY = BigNumber.from(newKeyPair.publicKeyY);
    const updatedPublicKeyX = BigNumber.from(updatedUserInfo.publicKey.x);
    const updatedPublicKeyY = BigNumber.from(updatedUserInfo.publicKey.y);

    // Expectations.
    // Expect that the account got updated with the new public key.
    expect(updatedPublicKeyX).toEqual(newPublicKeyX);
    expect(updatedPublicKeyY).toEqual(newPublicKeyY);
  });

  xit('update_account_ecdsa_sig_uat', async () => {
    const domainData = {
      name: 'Loopring Protocol',
      version: '3.6.0',
      chainId: 1337,
      verifyingContract: '0x7489DE8c7C1Ee35101196ec650931D7bef9FdAD2',
    };

    const eip712Helper = new EIP712Helper(domainData);

    const req: UpdateAccountMessageRequest = {
      exchange: '0x7489DE8c7C1Ee35101196ec650931D7bef9FdAD2',
      owner: '0x23a51c5f860527f971d0587d130c64536256040d',
      accountId: 10004,
      publicKey: {
        x: '0x2442c9e22d221abac0582cf764028d21114c9676b743f590741ffdf1f8a735ca',
        y: '0x08a42c954bc114b967bdd77cf7a1780e07fe10a4ebbef00b567ef2876e997d1a',
      },
      maxFee: {
        tokenId: 0,
        volume: '4000000000000000',
      },
      validUntil: 1_700_000_000,
      nonce: 1,
    };

    function bufferToHex(buffer: Uint8Array) {
      return [...new Uint8Array(buffer)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    const hash = eip712Helper.createUpdateAccountMessage(req);
    const hashHex = `0x${bufferToHex(hash)}`;

    expect(hashHex).toBe(
      '0x031fac4223887173ca741460e3b1e642d9d73371a64cd42b46212cc159877f03'
    );

    const ethersSigner = getMockedSigner(network);

    const typedData = eip712Helper.createUpdateAccountTypedData(req);
    const xApiSig = await eip712Helper.signTypedData(typedData, ethersSigner);

    expect(xApiSig).toBe(
      '0x1d5c8314893ce0ceccf0b872758ef8f1e5096a6383fe2729686f18396f6e2bcd47ab43819446d0422f700763f51a4221bb28c7e69b6a6b6f44fb351d5a9cd0c21b' +
        EthSignType.EIP_712
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
function getMockedSigner(network: Network): ethers.Wallet {
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
