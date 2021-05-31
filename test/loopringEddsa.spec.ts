import { UrlEddsaSignHelper } from '../src/loopring/EddsaSignHelper';
import { AxiosRequestConfig } from 'axios';

describe('EIP712 correctness tests', () => {
  it('Check URL signer', async () => {
    // Test setup.
    const LOOPRING_REST_HOST = 'https://api3.loopring.io';
    const dummyEddsaKey = '1';
    const urlSigner = new UrlEddsaSignHelper(dummyEddsaKey, LOOPRING_REST_HOST);
    const request: AxiosRequestConfig = {
      method: 'GET',
      url: '/api/v3/apiKey',
      data: {
        accountId: 10010,
      },
    };

    // Method(s) under test.
    const hashValue = urlSigner.hash(request);
    const signature = urlSigner.sign(request);

    // Expectations.
    expect(hashValue).toBe(
      '0xa0d4a4dad0d2c4ee7ecf2f75694229bd851d2b7c9e105a3b3d7bfffe2b87a20'
    );
    expect(signature).toBe(
      '0x0489e54d8ca57bc1fde4e8f252fa729b3befb29cc4e310a6217143ef2c1df0c70d97fca7ffd5bb7bc05f761e5ae0a99a86fe2ce0b886722014e2ad8c914a1719239861baf68b388129a2e56a62a0f8bbe980d9741242ef59dac23b9eb4330357'
    );
  });
});
