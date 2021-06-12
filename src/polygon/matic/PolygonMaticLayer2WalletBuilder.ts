import { Layer2WalletBuilder } from '../../Layer2WalletBuilder';
import { Layer2Wallet } from '../../Layer2Wallet';
import { Network } from '../../types';
import { PolygonMaticLayer2Provider } from './PolygonMaticLayer2Provider';
import { PolygonMaticLayer2Wallet } from './PolygonMaticLayer2Wallet';
import { PolygonMaticWalletOptions } from './types';

import Matic from '@maticnetwork/maticjs';
import { ethers } from 'ethers';
import { Eip1193Bridge } from '@ethersproject/experimental';

class Eip1193BridgeHelper extends Eip1193Bridge {
  constructor(signer: ethers.Signer, provider?: ethers.providers.Provider) {
    super(signer, provider);
  }

  /**
   * Cleans some parameters that "ethers lib" complains with if they are present
   * but not allowed.
   *
   * @param request - Request object with the ETH method to call and their params.
   * @returns The result value from the base class request method.
   */
  request(request: { method: string; params?: Array<any> }): Promise<any> {
    if (
      request.method === 'eth_call' &&
      !!request.params &&
      request.params.length > 0
    ) {
      // remove the "from" field for request.params[0]
      if (!request.params[0].from) {
        delete request.params[0].from;
      }

      // remove the "gas" field for request.params[0]
      if (!request.params[0].gas) {
        delete request.params[0].gas;
      }
    }

    // Invoke parent's method now that the request object is clean.
    return super.request(request);
  }
}

export class PolygonMaticLayer2WalletBuilder implements Layer2WalletBuilder {
  constructor(
    private network: Network,
    private layer2Provider: PolygonMaticLayer2Provider
  ) {}

  getNetwork(): Network {
    return this.network;
  }

  async fromMnemonic(words: string): Promise<Layer2Wallet> {
    // TODO. Had to do this, undefined otherwise. Seek alternative.
    // const ethers = require('ethers');

    // Create ethers provided bound to this wallet builder's network.
    const ethersProvider = ethers.getDefaultProvider(this.network);

    // Create an ethers wallet from the provided mnemonics.
    const ethWallet = ethers.Wallet.fromMnemonic(words).connect(ethersProvider);

    // Instantiate Matic SDK instance.
    const maticInstance: Matic = await this.initMaticInstance(ethWallet);

    // Instantiate the layer 2 wallet.
    const layer2Wallet = PolygonMaticLayer2Wallet.newInstance(
      this.network,
      ethWallet,
      this.layer2Provider,
      maticInstance
    );

    return layer2Wallet;
  }

  async fromOptions(options: PolygonMaticWalletOptions): Promise<Layer2Wallet> {
    const ethersSigner = options.ethersSigner;

    // Check that the ethers signer has an assigned provider.
    if (!ethersSigner.provider) {
      throw new Error('Undefined ethers provider');
    }

    const etherNetwork = await ethersSigner.provider.getNetwork();
    if (!this.sameNetwork(etherNetwork.name, this.network)) {
      throw new Error(
        `Ethers lib signer has the wrong network ${etherNetwork.name} != ${this.network}`
      );
    }

    // Instantiate Matic SDK instance.
    const maticInstance: Matic = await this.initMaticInstance(ethersSigner);

    // Instantiate the layer 2 wallet.
    const layer2Wallet = PolygonMaticLayer2Wallet.newInstance(
      this.network,
      ethersSigner,
      this.layer2Provider,
      maticInstance
    );

    return layer2Wallet;
  }

  private sameNetwork(a: string, b: string): boolean {
    const mainnets = ['mainnet', 'homestead'];
    if (mainnets.includes(a) && mainnets.includes(b)) {
      return true;
    }
    return a === b;
  }

  private async initMaticInstance(ethersSigner: ethers.Signer): Promise<Matic> {
    // Map ETH mainnet to Matic mainnet and ETH goerli to Matic testnet.
    // Use 'mumbai' for Matic testnet and 'v1' for Matic mainnet.
    let network: 'mainnet' | 'testnet';
    let version: 'v1' | 'mumbai';

    switch (this.network) {
      case 'goerli':
        network = 'testnet';
        version = 'mumbai';
        break;
      case 'mainnet':
      case 'homestead':
        network = 'mainnet';
        version = 'v1';
        break;
      default:
        throw new Error(`Network ${this.network} not supported`);
    }

    // Use a regular EIP-1193 provider (i.e. web3) to ethers lib bridge since
    // the Matic SDK uses a web3-like provider.
    const parentProvider = new Eip1193BridgeHelper(
      ethersSigner,
      ethersSigner.provider
    );

    // Use Matic JSON-RPC endpoint according to the corresponding network.
    const maticProvider = `https://rpc-${version}.maticvigil.com`;

    // Instantiate Matic SDK instance.
    const maticInstance = new Matic({
      network,
      version,
      parentProvider,
      maticProvider,
    });

    // Initialize the SDK instance.
    await maticInstance.initialize();

    return maticInstance;
  }
}
