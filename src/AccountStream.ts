import hash from 'object-hash';
import { Layer2Wallet } from 'Layer2Wallet';
import { EventEmitter } from 'events';
import { AccountBalances } from '../src/types';

export default class AccountStream {
  public active: boolean = false;
  private emitter: EventEmitter;
  private lastHash = '';

  constructor(private wallet: Layer2Wallet, private delay: number = 500) {
    this.emitter = new EventEmitter();
  }

  private _hashBalances(balances: AccountBalances): string {
    return hash(balances);
  }

  private async _initBalance() {
    const balances = await this.wallet.getAccountTokenBalances();
    const latestHash = this._hashBalances(balances);
    this.lastHash = latestHash;
  }

  // TODO: add retry count and timeout
  private async _poll() {
    await new Promise((resolve) => setTimeout(resolve, this.delay));

    // check if balance change
    try {
      const balances = await this.wallet.getAccountTokenBalances();

      if (balances) {
        // get hash of balances object
        const latestHash = this._hashBalances(balances);

        if (this.lastHash !== latestHash) {
          // update last hash balances
          this.lastHash = latestHash;
          // if balance change emit balance event
          this._onBalanceUpdate(balances);
        }
      }
    } catch (e) {
      console.error(`Error on polling balances: `, e);
    }

    // else sleep

    if (this.active) {
      this._poll();
    }
  }
  // TODO: add types to events
  private _onBalanceUpdate(newBalance: AccountBalances) {
    if (!this.active) {
      return;
    }

    this.emitter.emit('balanceUpdate', newBalance);

    return true;
  }

  stop() {
    this.active = false;
  }

  async start() {
    await this._initBalance();
    this.active = true;
    this._poll();
  }

  getAccountEvents(): EventEmitter {
    return this.emitter;
  }
}
