import { describe, it, expect } from "vitest";
import {
  toFixedDecimals,
  canonicalizeJson,
  serializeMetricLeaf,
  serializeReceiptLeaf,
  MetricLeafData,
  ReceiptLeafData
} from "@/lib/attestation/canonicalSerializer";
import {
  buildMetricsTree,
  buildReceiptsTree,
  verifyMetricProof,
  verifyReceiptProof,
  METRIC_LEAF_TYPES,
  RECEIPT_LEAF_TYPES
} from "@/lib/attestation/merkleEngine";
import {
  uploadSnapshotDataset,
  fetchStoredDataset,
  computeSha256
} from "@/lib/attestation/storageUploader";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

describe("Epic 9: Serialisasi Kanonikal & Standar @openzeppelin/merkle-tree", () => {
  it("Test Case 3.1.1 (Deterministik Fixed-Point Serializer): Formats 1,000 floats deterministically without drift", () => {
    // Basic formatting tests
    expect(toFixedDecimals(123.456789, 6)).toBe("123.456789");
    expect(toFixedDecimals(123.4, 6)).toBe("123.400000");
    expect(toFixedDecimals(100, 6)).toBe("100.000000");
    expect(toFixedDecimals(0.000001, 6)).toBe("0.000001");
    expect(toFixedDecimals(123.456789123, 6)).toBe("123.456789");
    expect(toFixedDecimals(BigInt(500), 4)).toBe("500.0000");

    // Fuzz test with 1,000 float values
    for (let i = 0; i < 1000; i++) {
      const val = (i * 0.1337) + (i % 7) * 0.0001;
      const formattedA = toFixedDecimals(val, 6);
      const formattedB = toFixedDecimals(val, 6);
      expect(formattedA).toBe(formattedB);
      expect(formattedA).toMatch(/^[0-9]+\.[0-9]{6}$/);
    }

    // Canonical JSON test (key sorting & absence of arbitrary whitespace)
    const objA = { b: 2, a: 1, nested: { z: 10, y: 9 } };
    const objB = { nested: { y: 9, z: 10 }, a: 1, b: 2 };
    expect(canonicalizeJson(objA)).toBe(canonicalizeJson(objB));
    expect(canonicalizeJson(objA)).toBe('{"a":1,"b":2,"nested":{"y":9,"z":10}}');
  });

  it("Test Case 3.1.2 (Kompatibilitas StandardMerkleTree): Verifies 100% of leaves in METRIC and RECEIPT trees", () => {
    // 1. Build Metric Tree with diverse samples
    const metricSamples: MetricLeafData[] = [
      {
        snapshotId: 101,
        chainKey: "rh",
        venueKey: "pons",
        metricKey: "cats_survival_7d",
        windowHours: 168,
        value: 42.857142,
        sampleSize: 140,
        metricsVersion: 1
      },
      {
        snapshotId: 101,
        chainKey: "rh",
        venueKey: "pools_trade",
        metricKey: "cats_survival_7d",
        windowHours: 168,
        value: 38.120000,
        sampleSize: 85,
        metricsVersion: 1
      },
      {
        snapshotId: 101,
        chainKey: "rh",
        venueKey: "hood_fun",
        metricKey: "cats_survival_7d",
        windowHours: 168,
        value: 12.500000,
        sampleSize: 24,
        metricsVersion: 1
      },
      {
        snapshotId: 101,
        chainKey: "rh",
        venueKey: "flap",
        metricKey: "cats_survival_7d",
        windowHours: 168,
        value: 55.000000,
        sampleSize: 40,
        metricsVersion: 1
      }
    ];

    const metricTree = buildMetricsTree(metricSamples);
    expect(metricTree.root).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(metricTree.leafCount).toBe(4);

    // Verify 100% of metric leaves
    for (const [index, leafTuple] of metricTree.tree.entries()) {
      const proof = metricTree.tree.getProof(index);
      expect(proof.length).toBeGreaterThan(0);
      
      const isValid = verifyMetricProof(metricTree.root, leafTuple, proof);
      expect(isValid).toBe(true);

      // Verify tampered proof fails
      const tamperedProof = [...proof];
      tamperedProof[0] = "0x" + "00".repeat(32);
      expect(verifyMetricProof(metricTree.root, leafTuple, tamperedProof)).toBe(false);

      // Verify tampered leaf value fails
      const tamperedTuple = [...leafTuple] as typeof leafTuple;
      tamperedTuple[6] = "99.999999"; // Altered metric value
      expect(verifyMetricProof(metricTree.root, tamperedTuple, proof)).toBe(false);
    }

    // 2. Build Receipt Tree with private report hashes
    const receiptSamples: ReceiptLeafData[] = [
      {
        anchoredSnapshotId: 102,
        reportHash: "0x1111111111111111111111111111111111111111111111111111111111111111"
      },
      {
        anchoredSnapshotId: 102,
        reportHash: "0x2222222222222222222222222222222222222222222222222222222222222222"
      }
    ];

    const receiptTree = buildReceiptsTree(receiptSamples);
    expect(receiptTree.root).toMatch(/^0x[0-9a-fA-F]{64}$/);

    // Verify 100% of receipt leaves
    for (const [index, leafTuple] of receiptTree.tree.entries()) {
      const proof = receiptTree.tree.getProof(index);
      const isValid = verifyReceiptProof(receiptTree.root, leafTuple, proof);
      expect(isValid).toBe(true);
    }
  });

  it("Test Case 3.1.3 (Dual Storage Upload): Verifies identical SHA-256 hash from R2 and IPFS endpoints", async () => {
    const payload = {
      snapshotId: 500,
      merkleRoot: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      metricsVersion: 1,
      timestamp: "2026-09-25T10:00:00Z",
      data: {
        rh_pons_cats: 42.85,
        rh_pools_cats: 38.12
      }
    };

    const upload = await uploadSnapshotDataset(payload, { mock: true });
    expect(upload.r2Url).toContain("https://cdn.waggle.markets/snapshots/");
    expect(upload.ipfsUrl).toContain("https://ipfs.io/ipfs/");
    expect(upload.sha256Hash).toMatch(/^[0-9a-f]{64}$/);

    // Fetch stored data from both R2 and IPFS URLs
    const r2Content = await fetchStoredDataset(upload.r2Url);
    const ipfsContent = await fetchStoredDataset(upload.ipfsUrl);

    // Verify raw JSON payloads are identical
    expect(r2Content).toBe(ipfsContent);

    // Verify SHA-256 hashes match uploaded hash exactly
    expect(computeSha256(r2Content)).toBe(upload.sha256Hash);
    expect(computeSha256(ipfsContent)).toBe(upload.sha256Hash);
  });
});
