import { ethers, BigNumber } from 'ethers';
import { EventEmitter } from 'events';

import {
  LoopringLayer2Provider,
  TokenDataDict,
} from './LoopringLayer2Provider';
import { Deposit, Transfer, Withdrawal, Operation } from '../Operation';
import { Layer2Wallet } from '../Layer2Wallet';
import ExchangeV3Abi from './abi/ExchangeV3.abi';
import AccountStream from '../AccountStream';

// TYPES
import {
  AccountBalanceState,
  Result,
  AccountBalances,
  Network,
  BigNumberish,
} from '../types';

export class LoopringLayer2Wallet implements Layer2Wallet {
  private accountStream: AccountStream;
  private exchangeContract: ethers.Contract;

  private constructor(
    private readonly network: Network,
    private readonly ethersSigner: ethers.Signer,
    private readonly address: string,
    private readonly loopringProvider: LoopringLayer2Provider,
    private readonly tokenDataBySymbol: TokenDataDict
  ) {
    this.accountStream = new AccountStream(this);

    // Instantiate Loopring exchange address contract.
    const contractAddress = loopringProvider.getLoopringExchangeContractAddressByNetwork(
      network
    );
    this.exchangeContract = new ethers.Contract(
      contractAddress,
      ExchangeV3Abi,
      ethersSigner
    );
  }

  static async newInstance(
    network: Network,
    ethersSigner: ethers.Signer,
    loopringProvider: LoopringLayer2Provider
  ): Promise<LoopringLayer2Wallet> {
    // Load Loopring ExchangeV3 ABI.
    const address = await ethersSigner.getAddress();
    const tokenDataBySymbol = await loopringProvider.getTokenDataBySymbol();
    // Create promise for new instance.
    return new Promise((resolve, reject) => {
      try {
        resolve(
          new LoopringLayer2Wallet(
            network,
            ethersSigner,
            address,
            loopringProvider,
            tokenDataBySymbol!
          )
        );
      } catch (err) {
        reject(err);
      }
    });
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
    const tokenData = this.tokenDataBySymbol[deposit.tokenSymbol];

    // TODO: Complete deposit call.
    const tx = this.exchangeContract.deposit();

    tokenData.address;
    throw new Error('Not finished');
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
