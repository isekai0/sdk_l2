import axios, { AxiosRequestConfig } from 'axios';
import { ethers } from 'ethers';
import { UrlEddsaSignHelper } from './EddsaSignHelper';
import { EdDSA } from './sign/eddsa';
import { KeyPair } from './sign/types';
import assert from 'assert';

export class LoopringClientService {
  private urlEddsaSignHelper: UrlEddsaSignHelper | undefined;

  constructor(private signer: ethers.Signer, private host: string) {
    // constructor's placeholder.
  }

  public initUrlSignHelper(privateKey: any) {
    this.urlEddsaSignHelper = new UrlEddsaSignHelper(privateKey);
  }

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

  /***
   * Response example:
   *
   * {
   *   "accountId" : 10,
   *   "owner" : "0xABCD",
   *   "frozen" : false,
   *   "publicKey" : {
   *     "x" : "0x241707bcc6d7a4ccf10304be248d343a527e85f61b45d721544d027cc1f2fb5f",
   *     "y" : "0x302f3a521dbdd1d0eb1944c8323d4ac3b3e9c9201f4aa43a2565054886369d9c"
   *   },
   *   "tags" : "vip_1",
   *   "nonce" : 0
   * }
   */
  public async getUserInfo() {
    const address = await this.signer.getAddress();

    const request: AxiosRequestConfig = {
      method: 'GET',
      baseURL: this.host,
      url: '/api/v3/account',
      params: {
        owner: address,
      },
    };

    let userInfo;
    try {
      userInfo = await this.restInvoke(request);
    } catch (err) {
      console.log(err.response.data.resultInfo);
      throw err;
    }
    return userInfo;
  }

  public async getUserOffchainApiKey(accountId: number): Promise<string> {
    assert(!!this.urlEddsaSignHelper);

    const request: AxiosRequestConfig = {
      method: 'GET',
      baseURL: this.host,
      url: '/api/v3/apiKey',
      params: {
        accountId,
      },
    };

    // Sign API request.
    const xApiSig = this.urlEddsaSignHelper.sign(request);
    // Add the signature to the request headers.
    request.headers = {
      'X-API-SIG': xApiSig,
      ...request.headers,
    };

    let requestKey: string;
    try {
      const response = await this.restInvoke(request);
      requestKey = response.apiKey as string;
    } catch (err) {
      console.log(err.response.data.resultInfo.message);
      throw err;
    }
    return requestKey;
  }

  public async restInvoke(request: AxiosRequestConfig) {
    request.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...request.headers,
    };

    const response = await axios(request);

    return response.data;
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
