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

    return keyPair;
  }

  public keyPairConcat(keyPair: KeyPair): string {
    const x = this.pad64(keyPair.publicKeyX);
    const y = this.pad64(keyPair.publicKeyY);
    const s = this.pad64(keyPair.secretKey);

    const ret = `0x${x}${y}${s}`;
    return ret;
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
