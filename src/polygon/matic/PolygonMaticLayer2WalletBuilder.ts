import { Layer2WalletBuilder } from '../../Layer2WalletBuilder';
import { Layer2Wallet } from '../../Layer2Wallet';
import { Network } from '../../types';
import { PolygonMaticLayer2Provider } from './PolygonMaticLayer2Provider';
import { PolygonMaticLayer2Wallet } from './PolygonMaticLayer2Wallet';
import { PolygonMaticWalletOptions } from './types';

import Matic from '@maticnetwork/maticjs';

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
    const ethers = require('ethers');

    // Create ethers provided bound to this wallet builder's network.
    const ethersProvider = ethers.getDefaultProvider(this.network);

    // Create an ethers wallet from the provided mnemonics.
    const ethWallet = ethers.Wallet.fromMnemonic(words).connect(ethersProvider);

    // Instantiate Matic SDK instance.
    const maticInstance = this.initMaticInstance();

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
    // Check that the ethers signer has an assigned provider.
    if (!options.ethersSigner.provider) {
      throw new Error('Undefined ethers provider');
    }

    const etherNetwork = await options.ethersSigner.provider.getNetwork();
    if (!this.sameNetwork(etherNetwork.name, this.network)) {
      throw new Error(
        `Ethers lib signer has the wrong network ${etherNetwork.name} != ${this.network}`
      );
    }

    // Instantiate Matic SDK instance.
    const maticInstance = this.initMaticInstance();

    // Instantiate the layer 2 wallet.
    const layer2Wallet = PolygonMaticLayer2Wallet.newInstance(
      this.network,
      options.ethersSigner,
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

  private initMaticInstance(): Matic {
    // Instantiate Matic SDK instance.
    // TODO: provide Matic init arguments.
    // Map ETH mainnet to Matic mainnet and ETH goerli to Matic testnet.
    // Use 'mumbai' for Matic testnet and 'v1' for Matic mainnet.
    const maticInstance = new Matic();

    // TODO: Invoke: maticInstance.initialize()

    return maticInstance;
  }
}
