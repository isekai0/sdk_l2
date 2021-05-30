import ethers from 'ethers';

export interface LoopringWalletOptions {
  ethersSigner: ethers.Wallet;
  isActivated?: boolean;
  offchainSignKey?: string;
}

export enum Security {
  NONE = 0,
  EDDSA_SIGN = 1,
  API_KEY = 2,
  ECDSA_AUTH = 4,
}

export enum EthSignType {
  ILLEGAL = '00',
  INVALID = '01',
  EIP_712 = '02',
  ETH_SIGN = '03',
}

export type NetworkInfo = {
  offchainApiEndpoint: string;
  domainData: TypedDataDomain;
};

export type TypedDataDomain = {
  name?: string | undefined;
  version?: string | undefined;
  chainId?: string | number | undefined;
  verifyingContract?: string | undefined;
  salt?: string | number[] | undefined;
};

export type TypedDataField = {
  name: string;
  type: string;
};

export type SimplifiedTypedData = {
  domain: TypedDataDomain;
  types: Record<string, TypedDataField[]>;
  message: Record<string, any>;
};

type HexString = string;

export type UpdateAccountMessageRequest = {
  exchange: HexString;
  owner: HexString;
  accountId: number;
  publicKey: {
    x: HexString;
    y: HexString;
  };
  maxFee: {
    tokenId: number;
    volume: string;
  };
  validUntil: number;
  nonce: number;
};
