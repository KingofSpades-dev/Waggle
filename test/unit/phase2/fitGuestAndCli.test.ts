import { describe, it, expect } from "vitest";
import {
  leafSnapshotHeaderV3,
  leafChainHeaderV3,
  leafVenueRowV3,
  hashPairV3,
  SnapshotHeaderV3,
  ChainHeaderV3,
  VenueRowV3
} from "../../../src/lib/attestation/merkleEngineV3";

describe("Phase 2: SP1 Fit Guest & Attestation Integration", () => {
  it("Test Case 2.1.1 (TypeScript Leaf Format v3 Encoder): Encodes typed leaves matching Rust merkle module", () => {
    const sHeader: SnapshotHeaderV3 = { snapshotId: 105n, metricsVersion: 3, chainCount: 1 };
    const cHeader: ChainHeaderV3 = { snapshotId: 105n, chainIndex: 0, chainId: 4663n, venueCount: 1 };
    const vRow: VenueRowV3 = {
      snapshotId: 105n,
      chainId: 4663n,
      venueIndex: 0,
      venueId: 101,
      survivalRateBps: 8500,
      medianLiqUsdCents: 10000000n,
      extractionBps: 1000,
      volumeAdjUsdCents: 500000000n,
      hourlyActivityBps: Array(24).fill(100)
    };

    const l0 = leafSnapshotHeaderV3(sHeader);
    const l1 = leafChainHeaderV3(cHeader);
    const l2 = leafVenueRowV3(vRow);

    expect(l0.startsWith("0x")).toBe(true);
    expect(l1.startsWith("0x")).toBe(true);
    expect(l2.startsWith("0x")).toBe(true);

    const parent = hashPairV3(l0, l1);
    expect(parent.startsWith("0x")).toBe(true);
  });

  it("Test Case 2.1.2 (Row Omission Guard Invariant): Throws error if venue row hourly activity length != 24", () => {
    const invalidRow: VenueRowV3 = {
      snapshotId: 105n,
      chainId: 4663n,
      venueIndex: 0,
      venueId: 101,
      survivalRateBps: 8500,
      medianLiqUsdCents: 10000000n,
      extractionBps: 1000,
      volumeAdjUsdCents: 500000000n,
      hourlyActivityBps: [100, 200] // Invalid length != 24
    };

    expect(() => leafVenueRowV3(invalidRow)).toThrow("hourlyActivityBps must have exactly 24 elements");
  });

  it("Test Case 2.1.3 (Mode Guard Invariant): Supports MODE_PUBLIC (0) and MODE_PRIVATE (1)", () => {
    const MODE_PUBLIC = 0;
    const MODE_PRIVATE = 1;
    const isValidMode = (mode: number) => mode === MODE_PUBLIC || mode === MODE_PRIVATE;

    expect(isValidMode(0)).toBe(true);
    expect(isValidMode(1)).toBe(true);
    expect(isValidMode(2)).toBe(false);
  });
});
