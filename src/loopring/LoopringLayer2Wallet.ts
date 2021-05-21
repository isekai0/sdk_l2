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
import { LoopringSigningService } from './LoopringSigningService';

export class LoopringLayer2Wallet implements Layer2Wallet {
  private static readonly DEFAULT_GAS_LIMIT = 300_000;

  private readonly accountStream: AccountStream;
  private readonly exchangeContract: ethers.Contract;
  private readonly signingService: LoopringSigningService;

  private constructor(
    private readonly network: Network,
    private readonly ethersSigner: ethers.Signer,
    private readonly address: string,
    private readonly loopringProvider: LoopringLayer2Provider,
    private readonly tokenDataBySymbol: TokenDataDict
  ) {
    this.accountStream = new AccountStream(this);
    this.signingService = new LoopringSigningService(ethersSigner);

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

  public async getUserInfo() {
    const address = await this.ethersSigner.getAddress();
    const urlPath = `/api/v3/account?owner=${address}`;
    let userInfo;
    try {
      userInfo = await this.loopringProvider.restInvoke(urlPath);
    } catch (err) {
      console.log(err);
    }
    return userInfo;
  }

  public async getUserOffchainRequestKey(accountId: number): Promise<string> {
    const urlPath = `/api/v3/apiKey?accountId=${accountId}`;
    const signatureBase = `GET&https%3A%2F%2Fapi3.loopring.io%2Fapi%2Fv2%2FapiKey&accountId%3D${accountId}`;
    const hash =
      '0x1657cacf68c2d6a474e7b9fb8ef374d5bbd830a514895c9807fd1a30246b005d'; //this.signingService.sha256(signatureBase);
    const signatureKeyPair = this.signingService.edDsaSign(
      '0x29e3155bbfc60c4f15f71c643546bbb1d0ced6720d157c5082d7fdf5aa90a32',
      hash
    );
    const xApiSig = this.signingService.keyPairConcat(signatureKeyPair);

    const headers = {
      'X-API-SIG': xApiSig,
    };

    let requestKey;
    try {
      requestKey = await this.loopringProvider.restInvoke(urlPath, headers);
    } catch (err) {
      console.log(err.response.data.resultInfo.message);
    }
    return requestKey;
  }
}
