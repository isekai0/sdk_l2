// Taken and modified from
// https://github.com/iden3/circomlib
import { KeyPair, Signature } from './types';
import { sha512 } from 'js-sha512';

const createBlakeHash = require('blake-hash');
const bigInt = require('snarkjs').bigInt;
const babyJub = require('./babyjub');
const poseidon = require('./poseidon');

export class EdDSA {
  public static generateKeyPair(seed: string, base: number = 10) {
    const secretKey = bigInt
      .leBuff2int(Buffer.from(seed))
      .mod(babyJub.subOrder);
    const publicKey = babyJub.mulPointEscalar(babyJub.Base8, secretKey);
    const keyPair: KeyPair = {
      publicKeyX: publicKey[0].toString(base),
      publicKeyY: publicKey[1].toString(base),
      secretKey: secretKey.toString(base),
    };
    return keyPair;
  }

  public static sign(strKey: string, message: string) {
    // Key and message to big int.
    const key = bigInt(strKey);
    const msg = bigInt(message);

    // K: key byte buffer (little endian)
    const K = bigInt.leInt2Buff(key, 32);
    // M: message byte buffer (little endian)
    const M = bigInt.leInt2Buff(msg, 32);
    // L: JUBJUB_L (subOrder)
    const L = babyJub.subOrder;
    // H: SHA512 function of (K, M)
    const H = sha512.digest(Buffer.concat([K, M]));
    // r = H(K, M) mod L
    const r = bigInt.leBuff2int(Buffer.from(H)).mod(L);

    // A = kB
    const A = babyJub.mulPointEscalar(babyJub.Base8, key);
    // R = rB
    const R8 = babyJub.mulPointEscalar(babyJub.Base8, r);

    const hasher = poseidon.createHash(6, 6, 52);

    // t = poseidonHash(R, A, M)
    const t = hasher([R8[0], R8[1], A[0], A[1], msg]);

    // S = r + (t * k)
    const S = r.add(t.mul(key)).mod(babyJub.order);

    const signature: Signature = {
      Rx: R8[0].toString(),
      Ry: R8[1].toString(),
      s: S.toString(),
    };
    return signature;
  }

  public static verify(msg: string, sig: Signature, pubKey: string[]) {
    const A = [bigInt(pubKey[0]), bigInt(pubKey[1])];
    const R = [bigInt(sig.Rx), bigInt(sig.Ry)];
    const S = bigInt(sig.s);

    // Check parameters
    if (!babyJub.inCurve(R)) return false;
    if (!babyJub.inCurve(A)) return false;
    if (S >= babyJub.subOrder) return false;

    const hasher = poseidon.createHash(6, 6, 52);
    const hm = hasher([R[0], R[1], A[0], A[1], bigInt(msg)]);

    const Pleft = babyJub.mulPointEscalar(babyJub.Base8, S);
    let Pright = babyJub.mulPointEscalar(A, hm);
    Pright = babyJub.addPoint(R, Pright);

    if (!Pleft[0].equals(Pright[0])) return false;
    if (!Pleft[1].equals(Pright[1])) return false;

    return true;
  }
}
