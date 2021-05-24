import { ethers } from 'ethers';
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
import { LoopringResult } from './LoopringResult';
import { LoopringClientService } from './LoopringClientService';
import { LoopringWalletOptions } from './types';

export class LoopringLayer2Wallet implements Layer2Wallet {
  private static readonly DEFAULT_GAS_LIMIT = 300_000;

  private readonly accountStream: AccountStream;
  private readonly exchangeContract: ethers.Contract;

  // This field is lazily initialized.
  private offchainApiKey: string | undefined = undefined;

  private constructor(
    private readonly network: Network,
    private readonly host: string,
    private readonly walletOptions: LoopringWalletOptions,
    private readonly address: string,
    private readonly loopringProvider: LoopringLayer2Provider,
    private readonly clientService: LoopringClientService,
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
      walletOptions.ethersSigner
    );
  }

  static async newInstance(
    network: Network,
    walletOptions: LoopringWalletOptions,
    loopringProvider: LoopringLayer2Provider
  ): Promise<LoopringLayer2Wallet> {
    // Load Loopring ExchangeV3 ABI.
    const address = await walletOptions.ethersSigner.getAddress();
    const tokenDataBySymbol = await loopringProvider.getTokenDataBySymbol();

    const host = loopringProvider.getLoopringHostByNetwork(network);

    // Instantiate off-chain request client.
    const clientService = new LoopringClientService(
      walletOptions.ethersSigner,
      host
    );
    walletOptions.isActivated = await clientService.isL2Activated();

    // Create promise for new instance.
    const layer2Wallet = new LoopringLayer2Wallet(
      network,
      host,
      walletOptions,
      address,
      loopringProvider,
      clientService,
      tokenDataBySymbol!
    );

    return layer2Wallet;
  }

  getNetwork(): Network {
    return this.network;
  }

  getAddress(): string {
    return this.address;
  }

  getClientService(): LoopringClientService {
    return this.clientService;
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

    // Obtain token data with the deposit's coin symbol.
    const tokenData = this.tokenDataBySymbol[deposit.tokenSymbol];

    // Deposit operation parameters.
    const from = this.address;
    const to = this.address;
    const tokenAddress = tokenData.address;
    const amountInWei = ethers.utils.parseEther(deposit.amount);
    const auxiliaryData = 0x00;
    const overrides = {
      gasLimit: LoopringLayer2Wallet.DEFAULT_GAS_LIMIT,
      value: amountInWei,
    };

    // Perform deposit call.
    const tx = await this.exchangeContract.deposit(
      from,
      to,
      tokenAddress,
      amountInWei,
      auxiliaryData,
      overrides
    );

    // Create Loopring result object.
    const result = new LoopringResult(tx, deposit);

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
