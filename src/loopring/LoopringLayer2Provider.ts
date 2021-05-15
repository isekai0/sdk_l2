import { Layer2Provider } from 'Layer2Provider';
import { Layer2Type, Receipt, Network } from '../types';
import { LoopringLayer2WalletBuilder } from './LoopringLayer2WalletBuilder';
import { Layer2WalletBuilder } from 'Layer2WalletBuilder';

import axios from 'axios';
import { ethers } from 'ethers';

export async function getLoopringProvider(
  network: 'localhost' | 'rinkeby' | 'ropsten' | 'mainnet' | 'goerli'
): Promise<Layer2Provider> {
  return LoopringLayer2Provider.newInstance(network);
}

enum Security {
  NONE = 0,
  EDDSA_SIGN = 1,
  API_KEY = 2,
  ECDSA_AUTH = 4,
}

export class TokenData {
  constructor(
    private _tokenId: number,
    private _symbol: string,
    private _name: string,
    private _address: string
  ) {}

  get tokenId() {
    return this._tokenId;
  }
  get symbol() {
    return this._symbol;
  }
  get name() {
    return this._name;
  }
  get address() {
    return this._address;
  }
}

export type TokenDataDict = { [symbol: string]: TokenData };

export class LoopringLayer2Provider implements Layer2Provider {
  private walletBuilder: Layer2WalletBuilder;
  private supportedNetworks: Network[] = ['mainnet', 'goerli'];

  // Lazy load this member, so initialize to null.
  private _tokenDataBySymbol: TokenDataDict | null = null;

  private constructor(private network: Network) {
    if (!this.supportedNetworks.includes(network)) {
      throw new Error(
        `Network not supported: ${network}. Supported networks: ${this.supportedNetworks}.`
      );
    }
    // Network supported. Proceed to create the wallet.
    this.walletBuilder = new LoopringLayer2WalletBuilder(this.network, this);
  }

  public static async newInstance(
    network: 'localhost' | 'rinkeby' | 'ropsten' | 'mainnet' | 'goerli'
  ): Promise<Layer2Provider> {
    // Create promise for new instance.
    return new Promise((resolve, reject) => {
      resolve(new LoopringLayer2Provider(network));
    });
  }

  getName(): string {
    return LoopringLayer2Provider.name;
  }

  getDescription(): string {
    return 'Layer 2 provider for Loopring by StablePay';
  }

  getNetwork(): Network {
    return this.network;
  }

  getSupportedLayer2Type(): Layer2Type {
    return Layer2Type.LOOPRING;
  }

  async getSupportedTokens(): Promise<Set<string>> {
    const tokenDataBySymbol = (await this.getTokenDataBySymbol()) as object;
    const ret = new Set<string>();

    for (const symbol of Object.keys(tokenDataBySymbol)) {
      ret.add(symbol);
    }

    return ret;
  }

  getLayer2WalletBuilder(): Layer2WalletBuilder {
    return this.walletBuilder;
  }

  async getWithdrawalFee(
    toAddress: string,
    tokenSymbol: string
  ): Promise<string> {
    throw new Error('Not implemented');
  }

  async getTransferFee(
    toAddress: string,
    tokenSymbol: string
  ): Promise<string> {
    throw new Error('Not implemented');
  }

  getReceipt(txHash: string): Promise<Receipt> {
    throw new Error('Method not implemented.');
  }

  getAccountHistory(address: string): Promise<Receipt> {
    throw new Error('Method not implemented.');
  }

  async disconnect() {}

  private LOOPRING_INFO_BY_NETWORK = {
    localhost: [undefined, undefined],
    rinkeby: [undefined, undefined],
    ropsten: [undefined, undefined],
    mainnet: [
      'https://api3.loopring.io',
      '0x0BABA1Ad5bE3a5C0a66E7ac838a129Bf948f1eA4',
    ],
    goerli: [
      'https://uat3.loopring.io',
      '0x2e76EBd1c7c0C8e7c2B875b6d505a260C525d25e',
    ],
    homestead: [undefined, ''],
  };

  getLoopringHostByNetwork(network: Network) {
    return this.LOOPRING_INFO_BY_NETWORK[network][0];
  }

  getLoopringExchangeContractAddressByNetwork(network: Network): string {
    const ret = this.LOOPRING_INFO_BY_NETWORK[network][1];
    if (!ret) {
      throw new Error(`Network ${network} not supported`);
    }
    return ret;
  }

  async getTokenDataBySymbol() {
    if (!this._tokenDataBySymbol) {
      const urlPath = `/api/v3/exchange/tokens`;
      const tokenConfigCollection = await this.restInvoke(urlPath);

      this._tokenDataBySymbol = tokenConfigCollection.reduce(
        (accum: TokenDataDict, td: any) => {
          return {
            ...accum,
            [td.symbol]: new TokenData(
              td.tokenId,
              td.symbol,
              td.name,
              td.address
            ),
          };
        },
        {}
      );
    }

    return this._tokenDataBySymbol;
  }

  private async restInvoke(urlPath: string) {
    const data = {
      security: Security.NONE,
    };

    const response = await axios.get(urlPath, {
      baseURL: this.getLoopringHostByNetwork(this.network),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      data,
    });

    return response.data;
  }
}
