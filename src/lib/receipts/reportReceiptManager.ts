import crypto from "crypto";
import { encodeAbiParameters, parseAbiParameters, keccak256, type Hex } from "viem";
import { canonicalizeJson } from "@/lib/attestation/canonicalSerializer";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { RECEIPT_LEAF_TYPES } from "@/lib/attestation/merkleEngine";

export interface ReportReceipt {
  reportId: string;
  projectText: string;
  salt: `0x${string}`;
  submissionHash: `0x${string}`;
  verdictHash: `0x${string}`;
  reportHash: `0x${string}`;
  evaluatedSnapshotId: number;
  anchoredSnapshotId: number;
  createdAt: number;
  isBatched: boolean;
}

export class ReportReceiptManager {
  private receipts: Map<string, ReportReceipt> = new Map();

  /**
   * Generates a cryptographically secure 32-byte salt (returned to client).
   */
  public generateSalt(): `0x${string}` {
    return `0x${crypto.randomBytes(32).toString("hex")}`;
  }

  /**
   * TASK-5.1.1: Computes unambiguous report hashes via keccak256(abi.encode(...)).
   * Eliminates delimiter/hyphen ambiguity and collision attacks.
   */
  public computeReportHashes(
    projectText: string,
    salt: `0x${string}`,
    verdict: Record<string, unknown>,
    evaluatedSnapshotId: number
  ): {
    submissionHash: `0x${string}`;
    verdictHash: `0x${string}`;
    reportHash: `0x${string}`;
  } {
    // 1. SubmissionHash = keccak256(abi.encode(["string", "bytes32"], [projectText, salt]))
    const submissionEncoded = encodeAbiParameters(
      parseAbiParameters("string, bytes32"),
      [projectText, salt]
    );
    const submissionHash = keccak256(submissionEncoded);

    // 2. VerdictHash = keccak256(canonicalizeJson(verdict))
    const canonicalVerdict = canonicalizeJson(verdict);
    const verdictHash = keccak256(Buffer.from(canonicalVerdict, "utf-8"));

    // 3. ReportHash = keccak256(abi.encode(["bytes32", "bytes32", "uint64"], [submissionHash, verdictHash, evaluatedSnapshotId]))
    const safeSnapshotId = Number.isFinite(Number(evaluatedSnapshotId)) && Number(evaluatedSnapshotId) > 0
      ? BigInt(Math.floor(Number(evaluatedSnapshotId)))
      : 101n;
    const reportEncoded = encodeAbiParameters(
      parseAbiParameters("bytes32, bytes32, uint64"),
      [submissionHash, verdictHash, safeSnapshotId]
    );
    const reportHash = keccak256(reportEncoded);

    return {
      submissionHash,
      verdictHash,
      reportHash
    };
  }

  /**
   * Creates a private report receipt and enters it into the batch queue for next snapshot.
   */
  public createReceipt(
    reportId: string,
    projectText: string,
    verdict: Record<string, unknown>,
    evaluatedSnapshotId: number,
    customSalt?: `0x${string}`
  ): ReportReceipt {
    const salt = customSalt || this.generateSalt();
    const { submissionHash, verdictHash, reportHash } = this.computeReportHashes(
      projectText,
      salt,
      verdict,
      evaluatedSnapshotId
    );

    // Batching to the subsequent hourly snapshot ID
    const anchoredSnapshotId = evaluatedSnapshotId + 1;

    const receipt: ReportReceipt = {
      reportId,
      projectText,
      salt,
      submissionHash,
      verdictHash,
      reportHash,
      evaluatedSnapshotId,
      anchoredSnapshotId,
      createdAt: Date.now(),
      isBatched: false
    };

    this.receipts.set(reportId, receipt);
    return receipt;
  }

  /**
   * Retrieves a receipt by report ID.
   */
  public getReceipt(reportId: string): ReportReceipt | undefined {
    return this.receipts.get(reportId);
  }

  /**
   * TASK-5.1.2: Batches all pending receipts into a StandardMerkleTree for anchoredSnapshotId.
   */
  public batchReceiptsForSnapshot(anchoredSnapshotId: number): {
    tree: StandardMerkleTree<any>;
    root: string;
    receipts: ReportReceipt[];
  } {
    const batchList = Array.from(this.receipts.values()).filter(
      r => r.anchoredSnapshotId === anchoredSnapshotId
    );

    if (batchList.length === 0) {
      // Fallback canonical receipt leaf
      const fallbackReportHash = "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff" as `0x${string}`;
      const fallbackValues = [["WAGGLE_RECEIPT_V1", BigInt(anchoredSnapshotId), fallbackReportHash]];
      const tree = StandardMerkleTree.of(fallbackValues, RECEIPT_LEAF_TYPES);
      return { tree, root: tree.root, receipts: [] };
    }

    const leaves = batchList.map(r => [
      "WAGGLE_RECEIPT_V1",
      BigInt(r.anchoredSnapshotId),
      r.reportHash
    ]);

    const tree = StandardMerkleTree.of(leaves, RECEIPT_LEAF_TYPES);

    // Mark as batched
    batchList.forEach(r => {
      r.isBatched = true;
    });

    return {
      tree,
      root: tree.root,
      receipts: batchList
    };
  }
}

export const reportReceiptManager = new ReportReceiptManager();
