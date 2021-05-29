import { AxiosRequestConfig } from 'axios';
import { sha256 } from 'js-sha256';
import { EdDSA } from './sign/eddsa';
import { bigInt } from 'snarkjs';
import assert from 'assert';

import { SNARK_SCALAR_FIELD } from './consts';

const poseidon = require('./sign/poseidon');
const utf8 = require('utf8');

export abstract class EddsaSignHelper {
  constructor(
    protected readonly poseidonHasher: any,
    protected readonly privateKey: string
  ) {
    // Nothing else to initialize here.
  }

  hash(structureData: any): string {
    const serializedData = this.serializeData(structureData);
    const msgHash = this.poseidonHasher(serializedData);
    return msgHash;
  }

  sign(structureData: any) {
    const msgHash = this.hash(structureData);
    const signedMessage = EdDSA.sign(this.privateKey, msgHash);

    const rx = this.pad64(bigInt(signedMessage.Rx).toString(16));
    const ry = this.pad64(bigInt(signedMessage.Ry).toString(16));
    const s = this.pad64(bigInt(signedMessage.s).toString(16));

    const result = `0x${rx}${ry}${s}`;

    return result;
  }

  verify(message: any, sig: any): any {
    throw new Error('implement');
  }

  abstract serializeData(data: any): any;

  private pad64(s: string): string {
    const width = 64;
    if (s.length >= width) {
      return s;
    }

    const ret = new Array(width - s.length + 1).join('0') + s;

    return ret;
  }
}

export class UrlEddsaSignHelper extends EddsaSignHelper {
  constructor(privateKey: string, private host: string) {
    super(poseidon.createHash(2, 6, 53), privateKey);
  }

  hash(structureData: any): string {
    const serializedData = this.serializeData(structureData);
    const hasher = sha256.create();
    hasher.update(utf8.encode(serializedData));
    const hashValue = bigInt(`0x${hasher.hex()}`, 16).mod(SNARK_SCALAR_FIELD);
    const msgHash = `0x${hashValue.toString(16)}`;
    return msgHash;
  }

  serializeData(data: any): string {
    const request = data as AxiosRequestConfig;
    const someHost = request.baseURL || this.host;
    assert(!!someHost);

    const method = request.method;
    const url = encodeURIComponent(someHost + request.url);
    const items = (request.params as Record<string, string>) || {};

    const itemDataArray = [];
    for (const [k, v] of Object.entries(items)) {
      const item = `${k}=${encodeURIComponent(v)}`;
      itemDataArray.push(item);
    }
    const itemData = encodeURIComponent(itemDataArray.join('&'));

    const result = [method, url, itemData].join('&');

    return result;
  }
}
