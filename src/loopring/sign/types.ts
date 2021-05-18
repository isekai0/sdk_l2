import BN = require('bn.js');

/**
 * The keypair data for EdDSA.
 */
export interface KeyPair {
  publicKeyX: string;
  publicKeyY: string;
  secretKey: string;
}

export class DexAccount {
  accountId: number;
  keyPair: KeyPair;
  nonce?: number;
}

/**
 * The signature data for EdDSA.
 */
export interface Signature {
  Rx: string;
  Ry: string;
  s: string;
}
