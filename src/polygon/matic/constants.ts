import { Decimal } from 'decimal.js';
import { AbiItem } from 'web3-utils';

export const TenAsDecimal = new Decimal(10);

export const RequestBatchSize = 32;

export const erc20BalanceOfAbi: AbiItem[] = [
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

export const uniswapTokenList = [
  'USDT',
  'YFI',
  'KNC',
  'ANT',
  'GNO',
  'LOOM',
  'MANA',
  'CRV',
  'TBTC',
  'BAL',
  'STORJ',
  'UMA',
  'UNI',
  'WETH',
  'CVC',
  'REP',
  'DNT',
  'GRT',
  'USDC',
  'KEEP',
  'WBTC',
  'REPv2',
  'AMP',
  'LINK',
  'MKR',
  'SNX',
  'OXT',
  'DAI',
  'REN',
  'NMR',
  'ZRX',
  'MLN',
  'NU',
  'BNT',
  'COMP',
  'AAVE',
  'LRC',
  'BAND',
];
