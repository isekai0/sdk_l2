import { TypedData, getMessage, getStructHash, getDependencies } from 'eip-712';
import { ethers } from 'ethers';
import { bigInt } from 'snarkjs';
import { SNARK_SCALAR_FIELD } from './consts';
import {
  EthSignType,
  SimplifiedTypedData,
  TypedDataDomain,
  TypedDataField,
  UpdateAccountMessageRequest,
} from './types';

const babyjub = require('./sign/babyjub');

type NameTypeArray = { name: string; type: string }[];

const eip712Domain: NameTypeArray = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

export class EIP712Helper {
  constructor(private exchangeDomain: TypedDataDomain) {
    // Constructor placeholder.
  }

  async signTypedData(typedData: TypedData, signer: ethers.Wallet) {
    const { domain, types, message } = this.simplifyTypedData(typedData);
    const signature = await signer._signTypedData(domain, types, message);
    return signature + EthSignType.EIP_712;
  }

  getExchangeDomainStructHash(): Buffer {
    const typedData = this.createTypedData(
      'EIP712Domain',
      eip712Domain,
      this.exchangeDomain
    );

    const structHash = getStructHash(
      typedData,
      'EIP712Domain',
      this.exchangeDomain
    );

    return structHash;
  }

  createUpdateAccountTypedData(req: UpdateAccountMessageRequest): TypedData {
    const primaryType = 'AccountUpdate';

    const px = bigInt(req.publicKey.x, 16).mod(SNARK_SCALAR_FIELD);
    const py = bigInt(req.publicKey.y, 16).mod(SNARK_SCALAR_FIELD);
    const publicKey = bigInt.leBuff2int(babyjub.packPoint([px, py]));

    const update = {
      owner: req.owner,
      accountID: req.accountId,
      feeTokenID: req.maxFee.tokenId,
      maxFee: req.maxFee.volume,
      publicKey,
      validUntil: req.validUntil,
      nonce: req.nonce,
    };

    const typedData = this.createTypedData(
      primaryType,
      [
        { name: 'owner', type: 'address' },
        { name: 'accountID', type: 'uint32' },
        { name: 'feeTokenID', type: 'uint16' },
        { name: 'maxFee', type: 'uint96' },
        { name: 'publicKey', type: 'uint256' },
        { name: 'validUntil', type: 'uint32' },
        { name: 'nonce', type: 'uint32' },
      ],
      update
    );

    return typedData;
  }

  createUpdateAccountMessage(req: UpdateAccountMessageRequest): Buffer {
    const typedData = this.createUpdateAccountTypedData(req);

    // Set hash argument to true, so the message is returned as a hash.
    const message = getMessage(typedData, true);

    return message;
  }

  public simplifyTypedData(typedData: TypedData): SimplifiedTypedData {
    const deps = getDependencies(typedData, typedData.primaryType);

    const ret: SimplifiedTypedData = {
      domain: typedData.domain,
      types: this.filterTypes(typedData.types, deps),
      message: typedData.message,
    };

    return ret;
  }

  private createTypedData(
    typeName: string,
    typeData: NameTypeArray,
    message: Record<string, unknown>
  ): TypedData {
    const typedData: TypedData = {
      types: {
        EIP712Domain: eip712Domain,
        [typeName]: typeData,
      },
      primaryType: typeName,
      domain: this.exchangeDomain,
      message,
    };

    return typedData;
  }

  private filterTypes(types: Record<string, TypedDataField[]>, keys: string[]) {
    const filtered = Object.keys(types)
      .filter((key) => keys.includes(key))
      .reduce((accum: Record<string, TypedDataField[]>, key: string) => {
        accum[key] = types[key];
        return accum;
      }, {});

    return filtered;
  }
}
