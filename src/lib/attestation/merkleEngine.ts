/**
 * Waggle Merkle Attestation Engine
 * Powered by OpenZeppelin StandardMerkleTree to prevent second-preimage attacks
 * and ensure 100% interoperability with OpenZeppelin MerkleProof.sol onchain.
 */

import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import {
  MetricLeafData,
  ReceiptLeafData,
  MetricLeafTuple,
  ReceiptLeafTuple,
  serializeMetricLeaf,
  serializeReceiptLeaf
} from "./canonicalSerializer";

/**
 * Explicit leaf schema definitions for OpenZeppelin StandardMerkleTree
 */
export const METRIC_LEAF_TYPES = [
  "string", // leaf tag: "WAGGLE_METRIC_V1"
  "uint64", // snapshotId
  "string", // chainKey
  "string", // venueKey
  "string", // metricKey
  "uint32", // windowHours
  "string", // valueFixedStr
  "uint64", // sampleSize
  "uint32"  // metricsVersion
];

export const RECEIPT_LEAF_TYPES = [
  "string",  // leaf tag: "WAGGLE_RECEIPT_V1"
  "uint64",  // anchoredSnapshotId
  "bytes32"  // reportHash
];

export interface BuiltMetricsTree {
  tree: StandardMerkleTree<MetricLeafTuple>;
  root: `0x${string}`;
  leaves: MetricLeafTuple[];
  leafCount: number;
}

export interface BuiltReceiptsTree {
  tree: StandardMerkleTree<ReceiptLeafTuple>;
  root: `0x${string}`;
  leaves: ReceiptLeafTuple[];
  leafCount: number;
}

/**
 * Builds a StandardMerkleTree for a collection of research metrics.
 */
export function buildMetricsTree(metrics: MetricLeafData[]): BuiltMetricsTree {
  if (!metrics || metrics.length === 0) {
    throw new Error("Cannot build Merkle tree from empty metrics array");
  }

  const leaves: MetricLeafTuple[] = metrics.map((m) => serializeMetricLeaf(m));
  const tree = StandardMerkleTree.of<MetricLeafTuple>(leaves, METRIC_LEAF_TYPES);
  const root = tree.root as `0x${string}`;

  return {
    tree,
    root,
    leaves,
    leafCount: leaves.length
  };
}

/**
 * Builds a StandardMerkleTree for private report receipts.
 */
export function buildReceiptsTree(receipts: ReceiptLeafData[]): BuiltReceiptsTree {
  if (!receipts || receipts.length === 0) {
    throw new Error("Cannot build Merkle tree from empty receipts array");
  }

  const leaves: ReceiptLeafTuple[] = receipts.map((r) => serializeReceiptLeaf(r));
  const tree = StandardMerkleTree.of<ReceiptLeafTuple>(leaves, RECEIPT_LEAF_TYPES);
  const root = tree.root as `0x${string}`;

  return {
    tree,
    root,
    leaves,
    leafCount: leaves.length
  };
}

/**
 * Verifies a metric leaf proof against the expected Merkle root.
 */
export function verifyMetricProof(
  root: string,
  leafTuple: MetricLeafTuple,
  proof: string[]
): boolean {
  try {
    return StandardMerkleTree.verify(root, METRIC_LEAF_TYPES, leafTuple, proof);
  } catch (err) {
    return false;
  }
}

/**
 * Verifies a report receipt leaf proof against the expected Merkle root.
 */
export function verifyReceiptProof(
  root: string,
  leafTuple: ReceiptLeafTuple,
  proof: string[]
): boolean {
  try {
    return StandardMerkleTree.verify(root, RECEIPT_LEAF_TYPES, leafTuple, proof);
  } catch (err) {
    return false;
  }
}
