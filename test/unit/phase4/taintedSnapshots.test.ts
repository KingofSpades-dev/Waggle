import { describe, it, expect } from "vitest";
import {
  auditSnapshotsAgainstCompromise,
  SAMPLE_HISTORICAL_ATTESTATIONS
} from "@/lib/attestation/taintedSnapshots";

describe("Epic 13: Runbook Kompromi Publisher Key & Tainted Snapshots (TASK-4.2.2)", () => {
  it("Test Case 4.2.2a: Without active compromise block, all snapshots are marked authentic", () => {
    const results = auditSnapshotsAgainstCompromise(SAMPLE_HISTORICAL_ATTESTATIONS, null);
    expect(results).toHaveLength(3);
    expect(results.every(r => r.isTainted === false)).toBe(true);
  });

  it("Test Case 4.2.2b: Quarantines snapshots where attestedAtBlock >= compromiseBlock", () => {
    // Simulate compromise established at block 14,891,500
    // Snapshot 99: block 14,890,100 (< 14,891,500 -> Clean)
    // Snapshot 100: block 14,891,050 (< 14,891,500 -> Clean)
    // Snapshot 101: block 14,891,950 (>= 14,891,500 -> Tainted)
    const compromiseBlock = 14_891_500;
    const results = auditSnapshotsAgainstCompromise(SAMPLE_HISTORICAL_ATTESTATIONS, compromiseBlock);

    expect(results.find(r => r.snapshotId === 99)?.isTainted).toBe(false);
    expect(results.find(r => r.snapshotId === 100)?.isTainted).toBe(false);
    expect(results.find(r => r.snapshotId === 101)?.isTainted).toBe(true);
  });

  it("Test Case 4.2.2c: When compromise block is earlier than all snapshots, all are quarantined", () => {
    const earlyCompromise = 14_800_000;
    const results = auditSnapshotsAgainstCompromise(SAMPLE_HISTORICAL_ATTESTATIONS, earlyCompromise);
    expect(results.every(r => r.isTainted === true)).toBe(true);
  });
});
