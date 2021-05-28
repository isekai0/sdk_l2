import { TypedData, getMessage, getStructHash } from 'eip-712';

type DomainData = {
  name?: string | undefined;
  version?: string | undefined;
  chainId?: string | number | undefined;
  verifyingContract?: string | undefined;
  salt?: string | number[] | undefined;
};
type NameTypeArray = { name: string; type: string }[];

const eip712Domain: NameTypeArray = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

export class EIP712Helper {
  private exchangeDomain: DomainData;
  constructor(
    name: string,
    version: string,
    chainId: number,
    verifyingContract: string
  ) {
    this.exchangeDomain = { name, version, chainId, verifyingContract };
  }

  getExchangeDomainStructHash(): Buffer {
    const typedData = this.createTypedData(
      'EIP712Domain',
      eip712Domain,
      this.exchangeDomain
    );

    const structHash = getStructHash(typedData, 'EIP712Domain', this.exchangeDomain);

    return structHash;
  }

  createUpdateAccountMessage(req: Record<string, any>) {
    // TODO: encode public key
    const publicKey = "61804618027797046811676702409463265798148663816854970963770902502721401224474";

    // pt = Point(FQ(int(req['publicKey']['x'], 16)), FQ(int(req['publicKey']['y'], 16)))
    // publicKey = int.from_bytes(pt.compress(), "little")

    const update = {
      owner: req['owner'],
      accountID: req['accountId'],
      feeTokenID: req['maxFee']['tokenId'],
      maxFee: req['maxFee']['volume'],
      publicKey: publicKey,
      validUntil: req['validUntil'],
      nonce: req['nonce'],
    };

    const typedData = this.createTypedData(
      'AccountUpdate',
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

    // Set hash argument to true, so the message is returned as a hash.
    const message = getMessage(typedData, true);

    return message;
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
}
