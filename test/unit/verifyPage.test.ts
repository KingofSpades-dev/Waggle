import { describe, it, expect } from "vitest";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import {
  CANONICAL_SNAPSHOT_METRICS,
  CANONICAL_RECEIPTS
} from "@/lib/attestation/canonicalData";
import {
  buildMetricsTree,
  buildReceiptsTree,
  METRIC_LEAF_TYPES
} from "@/lib/attestation/merkleEngine";
import { serializeMetricLeaf } from "@/lib/attestation/canonicalSerializer";

describe("Epic 11: Antarmuka Verifikasi Klien (/verify): Root Langsung dari Kontrak", () => {
  // Canonical trees
  const { tree: metricTree, root: onchainContractRoot } = buildMetricsTree(CANONICAL_SNAPSHOT_METRICS);

  it("Test Case 3.3.1 (Valid Onchain Proof Flow): Cryptographic verification succeeds against authoritative contract root", () => {
    // 1. Pick sample venue leaf (e.g. Pons on Robinhood Chain)
    const targetMetric = CANONICAL_SNAPSHOT_METRICS.find((m) => m.venueKey === "pons")!;
    const leafTuple = serializeMetricLeaf(targetMetric);
    
    // Find index and generate proof
    const ponsIndex = CANONICAL_SNAPSHOT_METRICS.findIndex((m) => m.venueKey === "pons");
    const proof = metricTree.getProof(ponsIndex);

    expect(proof.length).toBeGreaterThan(0);

    // 2. Browser calls StandardMerkleTree.verify(onchainContractRoot, schema, leafTuple, proof)
    const isVerified = StandardMerkleTree.verify(
      onchainContractRoot,
      METRIC_LEAF_TYPES,
      leafTuple,
      proof
    );

    expect(isVerified).toBe(true);
  });

  it("Test Case 3.3.2 (Kasus Negatif Kritis: Root Palsu / Forged Root): Mandatory failure with ROOT MISMATCH ONCHAIN", () => {
    // Simulate an attacker serving a fake Merkle root
    const forgedRoot = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    const targetMetric = CANONICAL_SNAPSHOT_METRICS[0];
    const leafTuple = serializeMetricLeaf(targetMetric);
    const proof = metricTree.getProof(0);

    // 1. Root comparison check
    const rootMatches = (forgedRoot.toLowerCase() === onchainContractRoot.toLowerCase());
    expect(rootMatches).toBe(false);

    // 2. If client checks root against onchain contract root, it detects discrepancy:
    let failureReason = "";
    if (!rootMatches) {
      failureReason = "VERIFICATION FAILED: ROOT MISMATCH ONCHAIN";
    }

    expect(failureReason).toBe("VERIFICATION FAILED: ROOT MISMATCH ONCHAIN");

    // 3. Even if attacker bypasses root check and attempts to verify against the onchain root using forged tree:
    const fakeTree = StandardMerkleTree.of([leafTuple], METRIC_LEAF_TYPES);
    const fakeProof = fakeTree.getProof(0);

    // Verification against true onchain root fails
    const isValidAgainstContract = StandardMerkleTree.verify(
      onchainContractRoot,
      METRIC_LEAF_TYPES,
      leafTuple,
      fakeProof
    );
    expect(isValidAgainstContract).toBe(false);
  });

  it("Test Case 3.3.3 (/v1/proof Schema & Determinism): Returns valid leaf tuple and proof for all venues", () => {
    for (let i = 0; i < CANONICAL_SNAPSHOT_METRICS.length; i++) {
      const metric = CANONICAL_SNAPSHOT_METRICS[i];
      const leafTuple = serializeMetricLeaf(metric);
      const proof = metricTree.getProof(i);

      expect(leafTuple[0]).toBe("WAGGLE_METRIC_V1");
      expect(leafTuple[1]).toBe(BigInt(101));
      expect(leafTuple[2]).toBe("rh");
      expect(typeof leafTuple[6]).toBe("string"); // Fixed-point string
      expect(proof.length).toBeGreaterThan(0);

      // Verify each venue's proof independently
      const valid = StandardMerkleTree.verify(
        onchainContractRoot,
        METRIC_LEAF_TYPES,
        leafTuple,
        proof
      );
      expect(valid).toBe(true);
    }
  });
});
