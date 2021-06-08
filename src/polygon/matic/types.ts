import ethers from 'ethers';

export interface PolygonMaticWalletOptions {
  ethersSigner: ethers.Signer;
}

export type TokenInfoMetadata = {
  baseURL: string;
  url: string;
  chainId: number;
  mapType: string;
  tokenType: 'ERC20'; // Only ERC20 token type is supported in this library.
};

export class TokenData {
  constructor(
    private _tokenId: number,
    private _symbol: string,
    private _name: string,
    private _address: string
  ) {}

  get tokenId() {
    return this._tokenId;
  }
  get symbol() {
    return this._symbol;
  }
  get name() {
    return this._name;
  }
  get address() {
    return this._address;
  }
}

export type TokenDataDict = { [symbol: string]: TokenData };
