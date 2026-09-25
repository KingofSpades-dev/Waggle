import { describe, it, expect } from "vitest";
import { ReportReceiptManager } from "@/lib/receipts/reportReceiptManager";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { RECEIPT_LEAF_TYPES } from "@/lib/attestation/merkleEngine";

describe("Epic 14: Private Report Receipts (TASK-5.1.1 & TASK-5.1.2)", () => {
  const manager = new ReportReceiptManager();

  it("Test Case 5.1.1a: Generates cryptographically secure 32-byte salt", () => {
    const salt1 = manager.generateSalt();
    const salt2 = manager.generateSalt();

    expect(salt1).toMatch(/^0x[a-f0-9]{64}$/);
    expect(salt2).toMatch(/^0x[a-f0-9]{64}$/);
    expect(salt1).not.toBe(salt2);
  });

  it("Test Case 5.1.1b: Computes unambiguous keccak256(abi.encode(...)) report hashes without collision", () => {
    const salt = manager.generateSalt();
    const projectText = "An autonomous DEX arbitrage bot targeting Robinhood concentrated pools.";
    const verdict = { chain_name: "Robinhood", venue_name: "Pons", composite_score: 88 };
    const evaluatedSnapshotId = 101;

    const hashes = manager.computeReportHashes(projectText, salt, verdict, evaluatedSnapshotId);

    expect(hashes.submissionHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(hashes.verdictHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(hashes.reportHash).toMatch(/^0x[a-f0-9]{64}$/);

    // Collision resistance check: subtle difference in projectText
    const modifiedProjectHashes = manager.computeReportHashes(
      projectText + " ",
      salt,
      verdict,
      evaluatedSnapshotId
    );
    expect(modifiedProjectHashes.submissionHash).not.toBe(hashes.submissionHash);
    expect(modifiedProjectHashes.reportHash).not.toBe(hashes.reportHash);

    // Collision resistance check: difference in snapshot ID
    const diffSnapshotHashes = manager.computeReportHashes(
      projectText,
      salt,
      verdict,
      evaluatedSnapshotId + 1
    );
    expect(diffSnapshotHashes.reportHash).not.toBe(hashes.reportHash);
  });

  it("Test Case 5.1.2: Batches report receipts into Merkle tree for anchoredSnapshotId", () => {
    const salt = manager.generateSalt();
    const receipt1 = manager.createReceipt(
      "rep_1",
      "Project Alpha DeFi Agent",
      { score: 92 },
      101,
      salt
    );
    const receipt2 = manager.createReceipt(
      "rep_2",
      "Project Beta Social Meme",
      { score: 74 },
      101
    );

    expect(receipt1.anchoredSnapshotId).toBe(102);
    expect(receipt2.anchoredSnapshotId).toBe(102);

    // Batch receipts into StandardMerkleTree
    const { tree, root, receipts } = manager.batchReceiptsForSnapshot(102);

    expect(receipts).toHaveLength(2);
    expect(root).toMatch(/^0x[a-f0-9]{64}$/);
    expect(receipt1.isBatched).toBe(true);
    expect(receipt2.isBatched).toBe(true);

    // Verify proof for receipt1
    const leafTuple = ["WAGGLE_RECEIPT_V1", BigInt(102), receipt1.reportHash];
    const proof = tree.getProof(0);

    const isVerified = StandardMerkleTree.verify(
      root,
      RECEIPT_LEAF_TYPES,
      leafTuple,
      proof
    );

    expect(isVerified).toBe(true);
  });
});
