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
  ECDSA_AUTH = 4
}


class LoopringLayer2Provider implements Layer2Provider {
  private walletBuilder: Layer2WalletBuilder;
  private supportedNetworks: Network[] = ['mainnet', 'goerli']

  private constructor(
    private network: Network,
  ) {
    if (!this.supportedNetworks.includes(network)) {
      throw new Error(
        `Network not supported: ${network}. Supported networks: ${this.supportedNetworks}.`)
    }
    // Network supported. Proceed to create the wallet.
    this.walletBuilder = new LoopringLayer2WalletBuilder(this.network);
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
    const urlPath = `/api/v3/exchange/tokens`;
    const ret = new Set<string>();

    const tokenConfigCollection = await this.restInvoke(urlPath);
    for (const tokenConfig of tokenConfigCollection) {
      ret.add(tokenConfig.symbol);
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
    throw new Error('Not implemented')
  }

  async getTransferFee(
    toAddress: string,
    tokenSymbol: string
  ): Promise<string> {
    throw new Error('Not implemented')
  }

  getReceipt(txHash: string): Promise<Receipt> {
    throw new Error('Method not implemented.');
  }

  getAccountHistory(address: string): Promise<Receipt> {
    throw new Error('Method not implemented.');
  }

  async disconnect() {
  }

  LOOPRING_REST_HOSTS_BY_NETWORK = {
    'localhost': undefined,
    'rinkeby': undefined,
    'ropsten': undefined,
    'mainnet': 'https://api3.loopring.io',
    'goerli': 'https://uat3.loopring.io',
    'homestead': undefined
  }

  async restInvoke(urlPath: string) {
    const data = {
      security: Security.NONE
    };

    const response = await axios.get(
      urlPath,
      {
        baseURL: this.LOOPRING_REST_HOSTS_BY_NETWORK[this.network],
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        data
      });

    return response.data;
  }
}
