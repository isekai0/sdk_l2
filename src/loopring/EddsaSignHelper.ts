import { AxiosRequestConfig } from 'axios';
import { sha256 } from 'js-sha256';
import { EdDSA } from './sign/eddsa';

const bigInt = require('big-integer');
const poseidon = require('./sign/poseidon');
const utf8 = require('utf8');

const SNARK_SCALAR_FIELD = bigInt(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);

export abstract class EddsaSignHelper {
  constructor(
    protected readonly poseidonHasher: any,
    protected readonly privateKey: any
  ) {
    // Nothing else to initialize here.
  }

  hash(structureData: any): string {
    const serializedData = this.serializeData(structureData);
    const msgHash = this.poseidonHasher(serializedData);
    return msgHash
  }

  sign(structureData: any) {
    const msgHash = this.hash(structureData);
    const signedMessage = EdDSA.sign0(this.privateKey, msgHash);

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
  constructor(privateKey: any, private host: string) {
    super(poseidon.createHash(2, 6, 53), privateKey);
  }

  hash(structureData: any): string {
    const serializedData = this.serializeData(structureData);
    const hasher = sha256.create();
    hasher.update(utf8.encode(serializedData));
    const hashValue = bigInt(hasher.hex(), 16).mod(SNARK_SCALAR_FIELD);
    const msgHash = `0x${hashValue.toString(16)}`;
    return msgHash;
  }

  serializeData(data: any): string {
    const request = data as AxiosRequestConfig;
    const method = request.method;
    const url = encodeURIComponent(this.host + request.url);
    const items = request.data as Record<string, string>;

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

// def __init__(self, poseidon_params, private_key):
//     self.poseidon_sign_param = poseidon_params
//     self.private_key = private_key
//     # print(f"self.private_key = {self.private_key}")

// def hash(self, structure_data):
//     serialized_data = self.serialize_data(structure_data)
//     msgHash = poseidon(serialized_data, self.poseidon_sign_param)
//     return msgHash

// def sign(self, structure_data):
//     msgHash = self.hash(structure_data)
//     signedMessage = PoseidonEdDSA.sign(msgHash, FQ(int(self.private_key, 16)))
//     return "0x" + "".join([
//                     hex(int(signedMessage.sig.R.x))[2:].zfill(64),
//                     hex(int(signedMessage.sig.R.y))[2:].zfill(64),
//                     hex(int(signedMessage.sig.s))[2:].zfill(64)
//                 ])

// def sigStrToSignature(self, sig):
//     assert len(sig) == 194
//     pureHexSig = sig[2:]
//     return Signature(
//         [
//             int(pureHexSig[:64], 16),
//             int(pureHexSig[64:128], 16)
//         ],
//         int(pureHexSig[128:], 16)
//     )

// def serialize_data(self, data):
//     pass

// def verify(self, message, sig):
//     return PoseidonEdDSA.verify(sig.A, sig.sig, sig.msg)
