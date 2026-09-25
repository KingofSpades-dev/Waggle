export interface SnapshotAuditRecord {
  snapshotId: number;
  merkleRoot: string;
  attestedAtBlock: number;
  attestedAtTimestamp: number;
  publisher: string;
  isTainted: boolean;
}

/**
 * Filters snapshots against a compromise L2 block number.
 * Conforms to TASK-4.2.2: Identify tainted snapshots where attestedAtBlock >= compromiseBlock.
 */
export function auditSnapshotsAgainstCompromise(
  records: Array<{
    snapshotId: number;
    merkleRoot: string;
    attestedAtBlock: number;
    attestedAtTimestamp: number;
    publisher: string;
  }>,
  compromiseBlock: number | null
): SnapshotAuditRecord[] {
  if (compromiseBlock === null || compromiseBlock <= 0) {
    return records.map(r => ({ ...r, isTainted: false }));
  }

  return records.map(r => ({
    ...r,
    isTainted: r.attestedAtBlock >= compromiseBlock
  }));
}

// Sample canonical historical attestations for Robinhood Chain
export const SAMPLE_HISTORICAL_ATTESTATIONS = [
  {
    snapshotId: 99,
    merkleRoot: "0x3456789012345678901234567890123456789012345678901234567890123456",
    attestedAtBlock: 14_890_100,
    attestedAtTimestamp: 1727000000,
    publisher: "0xcdc52c6c98ee5775d1d6faee5f7f8329d1e1ac8a"
  },
  {
    snapshotId: 100,
    merkleRoot: "0x7890123456789012345678901234567890123456789012345678901234567890",
    attestedAtBlock: 14_891_050,
    attestedAtTimestamp: 1727003600,
    publisher: "0xcdc52c6c98ee5775d1d6faee5f7f8329d1e1ac8a"
  },
  {
    snapshotId: 101,
    merkleRoot: "0xde86fdb87c3bc783e5a01380f8e6c3a0501712fbb3aafd391de2aa6c502f0003",
    attestedAtBlock: 14_891_950,
    attestedAtTimestamp: 1727007200,
    publisher: "0xcdc52c6c98ee5775d1d6faee5f7f8329d1e1ac8a"
  }
];
