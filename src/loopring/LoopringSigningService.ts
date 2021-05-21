import { ethers } from 'ethers';
import { EdDSA } from './sign/eddsa';
import { KeyPair } from './sign/types';

export class LoopringSigningService {
  constructor(private signer: ethers.Signer) {}

  public async getAccountKeyPair(
    contractAddress: string,
    nonce: number
  ): Promise<KeyPair> {
    const M = this.generateM(contractAddress, nonce);
    const S = await this.signer.signMessage(M);

    const eddsa_seed = ethers.utils.sha256(S);

    const keyPair = EdDSA.generateKeyPair(eddsa_seed, 16);
    keyPair.publicKeyX = `0x${keyPair.publicKeyX}`;
    keyPair.publicKeyY = `0x${keyPair.publicKeyY}`;
    keyPair.secretKey = `0x${keyPair.secretKey}`;

    return keyPair;
  }

  public edDsaSign(key: string, msg: string): KeyPair {
    const signature = EdDSA.sign(key, msg);
    const keyPair: KeyPair = {
      publicKeyX: ethers.BigNumber.from(signature.Rx).toHexString(),
      publicKeyY: ethers.BigNumber.from(signature.Ry).toHexString(),
      secretKey: ethers.BigNumber.from(signature.s).toHexString(),
    };

    return keyPair;
  }

  public keyPairConcat(keyPair: KeyPair): string {
    const x = this.pad64(keyPair.publicKeyX.substring(2));
    const y = this.pad64(keyPair.publicKeyY.substring(2));
    const s = this.pad64(keyPair.secretKey.substring(2));

    const ret = `0x${x}${y}${s}`;
    return ret;
  }

  public sha256(text: string): string {
    return ethers.utils.sha256(text);
  }

  private generateM(contractAddress: string, nonce: number): string {
    const m = `Sign this message to access Loopring Exchange: ${contractAddress} with key nonce: ${nonce}`;
    return m;
  }

  private pad64(s: string): string {
    const width = 64;
    if (s.length >= width) {
      return s;
    }

    const ret = new Array(width - s.length + 1).join('0') + s;

    return ret;
  }
}
