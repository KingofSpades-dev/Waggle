import { defineChain, createPublicClient, http } from 'viem';

export const ROBINHOOD_CHAIN_ID = 4663;

export const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: 'Robinhood Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.ROBINHOOD_RPC_URL || 'https://rpc.robinhood.com'],
    },
    public: {
      http: [process.env.ROBINHOOD_RPC_URL || 'https://rpc.robinhood.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Robinhood Explorer', url: 'https://explorer.robinhood.com' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
  },
});

// Canonical Safe v1.4.1 deployment addresses on Arbitrum stack
export const SAFE_SINGLETON_ADDRESS = '0x41f6252d04d10604b855e25b741566168763b407' as const;
export const SAFE_FACTORY_ADDRESS = '0x4e1dcdef7ed41d0f63b21114532b2e88a385f061' as const;
export const WAGGLE_TREASURY_SAFE_ADDRESS = (process.env.WAGGLE_SAFE_ADDRESS || '0xcdc52c6c98ee5775d1d6faee5f7f8329d1e1ac8a') as `0x${string}`;

export const WAGGLE_ATTESTOR_ADDRESS = (process.env.NEXT_PUBLIC_WAGGLE_ATTESTOR_ADDRESS || '0x7fc7f477b12045cfefbde9e692812f64391b969b') as `0x${string}`;

export const WAGGLE_ATTESTOR_ABI = [
  {
    type: 'function',
    name: 'rootOf',
    stateMutability: 'view',
    inputs: [{ name: 'snapshotId', type: 'uint64' }],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'snapshots',
    stateMutability: 'view',
    inputs: [{ name: 'snapshotId', type: 'uint64' }],
    outputs: [
      { name: 'merkleRoot', type: 'bytes32' },
      { name: 'metricsVersion', type: 'uint32' },
      { name: 'weightsVersion', type: 'uint32' },
      { name: 'windowEnd', type: 'uint64' },
      { name: 'attestedAtBlock', type: 'uint64' },
      { name: 'attestedAtTimestamp', type: 'uint64' },
      { name: 'uri', type: 'string' },
    ],
  },
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'publisher',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'isArbitrumChain',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'attest',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'snapshotId', type: 'uint64' },
      { name: 'merkleRoot', type: 'bytes32' },
      { name: 'metricsVersion', type: 'uint32' },
      { name: 'weightsVersion', type: 'uint32' },
      { name: 'windowEnd', type: 'uint64' },
      { name: 'uri', type: 'string' },
    ],
    outputs: [],
  },
] as const;

export function getRobinhoodPublicClient() {
  return createPublicClient({
    chain: robinhoodChain,
    transport: http(process.env.ROBINHOOD_RPC_URL || 'https://rpc.robinhood.com'),
  });
}

