import { Layer2WalletBuilder } from '../Layer2WalletBuilder';
import { Layer2Wallet } from '../Layer2Wallet';
import { Network } from '../types';
import { LoopringLayer2Provider } from './LoopringLayer2Provider';
import { LoopringLayer2Wallet } from './LoopringLayer2Wallet';
import { LoopringWalletOptions } from './types';

export class LoopringLayer2WalletBuilder implements Layer2WalletBuilder {
  constructor(
    private network: Network,
    private layer2Provider: LoopringLayer2Provider
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

    const walletOptions: LoopringWalletOptions = {
      ethersSigner: ethWallet,
    };

    // Instantiate the layer 2 wallet.
    const layer2Wallet = LoopringLayer2Wallet.newInstance(
      this.network,
      walletOptions,
      this.layer2Provider
    );

    return layer2Wallet;
  }

  async fromOptions(options: LoopringWalletOptions): Promise<Layer2Wallet> {
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

    // Instantiate the layer 2 wallet.
    const layer2Wallet = LoopringLayer2Wallet.newInstance(
      this.network,
      options,
      this.layer2Provider
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
}
