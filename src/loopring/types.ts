import ethers from 'ethers';

export interface LoopringWalletOptions {
  ethersSigner: ethers.Signer;
  isActivated?: boolean;
  offchainSignKey?: string;
}

export enum Security {
  NONE = 0,
  EDDSA_SIGN = 1,
  API_KEY = 2,
  ECDSA_AUTH = 4,
}
