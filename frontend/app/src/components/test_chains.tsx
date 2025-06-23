import {
    Chain,
  } from '@rainbow-me/rainbowkit';

export const hardhat = {
    id: 31337,
    name: 'Hardhat',
    iconUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5800.png',
    iconBackground: '#fff',
    nativeCurrency: { name: 'Hardhat', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['http://127.0.0.1:8545'] },
    }
} as const satisfies Chain;

export const anvil = {
    id: 1338,
    name: 'Anvil',
    iconUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5801.png',
    iconBackground: '#eee',
    nativeCurrency: { name: 'Anvil', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['http://127.0.0.1:8546'] },
    }
} as const satisfies Chain;
