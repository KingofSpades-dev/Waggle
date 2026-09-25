import { encodeAbiParameters, parseAbiParameters, getContractAddress, type Address, type Hex } from 'viem';
import { WAGGLE_ATTESTOR_BYTECODE_HEX } from './waggleAttestorBytecode';

export const WAGGLE_ATTESTOR_BYTECODE: Hex = WAGGLE_ATTESTOR_BYTECODE_HEX as Hex;

export const WAGGLE_ATTESTOR_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_ownerMultisig', type: 'address' },
      { name: '_publisher', type: 'address' },
      { name: '_isArbitrumChain', type: 'bool' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'attest',
    inputs: [
      { name: 'snapshotId', type: 'uint64' },
      { name: 'merkleRoot', type: 'bytes32' },
      { name: 'metricsVersion', type: 'uint32' },
      { name: 'weightsVersion', type: 'uint32' },
      { name: 'windowEnd', type: 'uint64' },
      { name: 'uri', type: 'string' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'rootOf',
    inputs: [{ name: 'snapshotId', type: 'uint64' }],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'snapshots',
    inputs: [{ name: '', type: 'uint64' }],
    outputs: [
      { name: 'merkleRoot', type: 'bytes32' },
      { name: 'metricsVersion', type: 'uint32' },
      { name: 'weightsVersion', type: 'uint32' },
      { name: 'windowEnd', type: 'uint64' },
      { name: 'attestedAtBlock', type: 'uint64' },
      { name: 'attestedAtTimestamp', type: 'uint64' },
      { name: 'uri', type: 'string' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'publisher',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'setPublisher',
    inputs: [{ name: '_newPublisher', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  }
] as const;

/**
 * Builds the complete transaction input data (bytecode + encoded constructor args)
 */
export function buildDeploymentData(
  owner: Address,
  publisher: Address,
  isArbitrum: boolean = true
): Hex {
  const encodedArgs = encodeAbiParameters(
    parseAbiParameters('address, address, bool'),
    [owner, publisher, isArbitrum]
  );
  // strip 0x prefix from args
  const argsHex = encodedArgs.slice(2);
  return `${WAGGLE_ATTESTOR_BYTECODE}${argsHex}` as Hex;
}

/**
 * Deterministically predicts the deployed contract address based on deployer address and nonce
 */
export function predictContractAddress(deployer: Address, nonce: bigint = 0n): Address {
  return getContractAddress({ from: deployer, nonce });
}
