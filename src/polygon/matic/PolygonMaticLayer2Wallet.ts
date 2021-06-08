import Matic from '@maticnetwork/maticjs';
import { ethers } from 'ethers';
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

export class PolygonMaticLayer2Wallet implements Layer2Wallet {
  private readonly accountStream: AccountStream;

  private constructor(
    private readonly network: Network,
    private readonly ethersSigner: ethers.Signer,
    private readonly address: string,
    private readonly polygonMaticProvider: PolygonMaticLayer2Provider,
    private readonly tokenDataBySymbol: TokenDataDict,
    private readonly maticInstance: Matic
  ) {
    this.accountStream = new AccountStream(this);
  }

  static async newInstance(
    network: Network,
    ethersSigner: ethers.Signer,
    polygonMaticProvider: PolygonMaticLayer2Provider,
    maticInstance: Matic
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
      maticInstance
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
    throw new Error('Not implemented');
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
    if (!(deposit.tokenSymbol in this.tokenDataBySymbol)) {
      throw new Error(`Token ${deposit.tokenSymbol} not supported`);
    }

    throw new Error('Not implemented');
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
