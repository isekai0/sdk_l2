import { EIP712Helper } from '../src/loopring/EIP712Helper';
import { UpdateAccountMessageRequest } from '../src/loopring/types';

require('dotenv').config();

describe('EIP712 correctness tests', () => {
  it('domain_separator', async () => {
    const name = 'Loopring Protocol';
    const version = '3.6.0';
    const chainId = 5;
    const verifyingContract = '0x2FFfAa5D860B39b28467863a4454EE874127eF5E';
    const eip712Helper = new EIP712Helper(
      name,
      version,
      chainId,
      verifyingContract
    );

    const structHash = eip712Helper.getExchangeDomainStructHash();
    const structHashHex = `0x${bufferToHex(structHash)}`;

    expect(structHashHex).toBe(
      '0x0cf6ea7629bf5bc100a49a1508666d887795b6a97195eb205c6dafcd4fbe2328'
    );
  });

  it('update_account_ecdsa_sig_uat', async () => {
    const name = 'Loopring Protocol';
    const version = '3.6.0';
    const chainId = 1337;
    const verifyingContract = '0x7489DE8c7C1Ee35101196ec650931D7bef9FdAD2';
    const eip712Helper = new EIP712Helper(
      name,
      version,
      chainId,
      verifyingContract
    );

    const req: UpdateAccountMessageRequest = {
      exchange: '0x7489DE8c7C1Ee35101196ec650931D7bef9FdAD2',
      owner: '0x23a51c5f860527f971d0587d130c64536256040d',
      accountId: 10004,
      publicKey: {
        x: '0x2442c9e22d221abac0582cf764028d21114c9676b743f590741ffdf1f8a735ca',
        y: '0x08a42c954bc114b967bdd77cf7a1780e07fe10a4ebbef00b567ef2876e997d1a',
      },
      maxFee: {
        tokenId: 0,
        volume: '4000000000000000',
      },
      validUntil: 1_700_000_000,
      nonce: 1,
    };

    const hash = eip712Helper.createUpdateAccountMessage(req);
    const hashHex = `0x${bufferToHex(hash)}`;

    expect(hashHex).toBe(
      '0x031fac4223887173ca741460e3b1e642d9d73371a64cd42b46212cc159877f03'
    );
  });
});

function bufferToHex(buffer: Uint8Array) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
