import { MaticPOSClient } from '@maticnetwork/maticjs';
import { BigNumber, ethers } from 'ethers';
import { EventEmitter } from 'events';

import { PolygonMaticLayer2Provider } from './PolygonMaticLayer2Provider';
import { Deposit, Transfer, Withdrawal, Operation } from '../../Operation';
import { Layer2Wallet } from '../../Layer2Wallet';
import AccountStream from '../../AccountStream';

// TYPES
import { TokenDataDict } from './types';
import {
  AccountBalanceState,
  Result,
  AccountBalances,
  Network,
  BigNumberish,
} from '../../types';

import BN from 'bn.js';
import { PolygonMaticResult } from './PolygonMaticResult';

export class PolygonMaticLayer2Wallet implements Layer2Wallet {
  private readonly accountStream: AccountStream;

  private constructor(
    private readonly network: Network,
    private readonly ethersSigner: ethers.Signer,
    private readonly address: string,
    private readonly polygonMaticProvider: PolygonMaticLayer2Provider,
    private readonly tokenDataBySymbol: TokenDataDict,
    private readonly maticPOSClient: MaticPOSClient
  ) {
    this.accountStream = new AccountStream(this);
  }

  static async newInstance(
    network: Network,
    ethersSigner: ethers.Signer,
    polygonMaticProvider: PolygonMaticLayer2Provider,
    maticPOSClient: MaticPOSClient
  ): Promise<PolygonMaticLayer2Wallet> {
    // Load Loopring ExchangeV3 ABI.
    const address = await ethersSigner.getAddress();
    const tokenDataBySymbol = await polygonMaticProvider.getTokenDataBySymbol();

    // Create promise for new instance.
    const layer2Wallet = new PolygonMaticLayer2Wallet(
      network,
      ethersSigner,
      address,
      polygonMaticProvider,
      tokenDataBySymbol,
      maticPOSClient
    );

    return layer2Wallet;
  }

  getNetwork(): Network {
    return this.network;
  }

  getAddress(): string {
    return this.address;
  }

  async getBalance(): Promise<BigNumberish> {
    // TODO: Figure out what the correct ERC20 token symbol corresponds to ETH
    // in the Matic network.
    // NOTE: There is going to be a separate Pull Request specifically for this.
    const tokenAddress = this.tokenDataBySymbol['WETH'].address;
    const balance: string = await this.maticPOSClient.balanceOfERC20(
      this.address,
      tokenAddress,
      { parent: false }
    );

    return balance;
  }

  async getBalanceVerified(): Promise<BigNumberish> {
    throw new Error('Not implemented');
  }

  async getTokenBalance(tokenSymbol: string): Promise<BigNumberish> {
    throw new Error('Not implemented');
  }
  async getTokenBalanceVerified(tokenSymbol: string): Promise<BigNumberish> {
    throw new Error('Not implemented');
  }

  // TODO: deprecate to use getAccountTokenBalances or refactor to use getAccountTokenBalances impl
  async getAccountBalances(): Promise<[string, string, AccountBalanceState][]> {
    throw new Error('Not implemented');
  }

  async getAccountTokenBalances(): Promise<AccountBalances> {
    throw new Error('Not implemented');
  }

  async deposit(deposit: Deposit): Promise<Result> {
    if (deposit.tokenSymbol !== 'ETH') {
      // Check if token other than ETH is supported.
      if (!(deposit.tokenSymbol in this.tokenDataBySymbol)) {
        throw new Error(`Token ${deposit.tokenSymbol} not supported`);
      }
    }

    if (deposit.toAddress !== this.address) {
      throw new Error(
        `Making deposit to an address different from wallet's is not supported. Address: ${deposit.toAddress}`
      );
    }

    const depositAmountWei = ethers.utils.parseEther(deposit.amount);
    const depositAmountWeiBN = new BN(depositAmountWei.toString());

    // TODO: Add gas price to Deposit operation. If not defined, get the gas
    // price like here.
    const gasPrice: BigNumber = await this.ethersSigner.getGasPrice();

    const result = new Promise<Result>((resolveResult, rejectResult) => {
      // Deposit awaitable is the final transaction receipt.
      const receiptAwaitable = new Promise((resolveReceipt) => {
        this.maticPOSClient.depositEtherForUser(
          this.address, // from the current user's address.
          depositAmountWeiBN,
          {
            from: this.address,
            gasPrice: gasPrice.toString(),
            onTransactionHash: (hash: any) => {
              // Instantiate Polygon/Matic transaction result. As soon as we get
              // a transaction hash, we can resolve result with hash and the
              // receipt awaitable.
              const polygonMaticDepositResult = new PolygonMaticResult({
                hash,
                awaitable: receiptAwaitable
              }, deposit, gasPrice);

              // Resolve promise with result.
              resolveResult(polygonMaticDepositResult);
            },
            onReceipt: (receipt: any) => {
              // Resolve receipt promise.
              resolveReceipt(receipt);
            },
            onError: (err: any) => {
              // Reject promise in case of error.
              rejectResult(err);
            }
          }
        );
      });
    });

    return result;
  }

  async transfer(transfer: Transfer): Promise<Result> {
    throw new Error('Not implemented');
  }

  async withdraw(withdrawal: Withdrawal): Promise<Result> {
    throw new Error('Not implemented');
  }

  async getAccountEvents(): Promise<EventEmitter> {
    throw new Error('Not implemented');
  }
}
