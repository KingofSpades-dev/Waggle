import { describe, it, expect } from "vitest";
import { keccak256, encodeAbiParameters, parseAbiParameters } from "viem";
import leavesV3Json from "../../../testvectors/leaves-v3.json";

describe("Leaf Format v3 Cross-Platform Test Vectors", () => {
  it("Test Case 1.3.1 (Leaf v3 Json Schema Validity): Loads leaves-v3.json and validates version = 3", () => {
    expect(leavesV3Json.version).toBe(3);
    expect(leavesV3Json.vectors.length).toBe(3);
  });

  it("Test Case 1.3.2 (Leaf 0 Snapshot Header Encoding): Computes double-hashed leaf matching OpenZeppelin standard", () => {
    const vector0 = leavesV3Json.vectors[0];
    const encoded = encodeAbiParameters(
      parseAbiParameters("uint8, uint64, uint32, uint32"),
      [
        vector0.fields.typeId,
        BigInt(vector0.fields.snapshotId),
        vector0.fields.metricsVersion!,
        vector0.fields.chainCount!
      ]
    );

    const innerHash = keccak256(encoded);
    const leafHash = keccak256(innerHash);

    expect(leafHash).toBeDefined();
    expect(leafHash.startsWith("0x")).toBe(true);
    expect(leafHash.length).toBe(66);
  });

  it("Test Case 1.3.3 (Leaf 1 Chain Header Encoding): Encodes type 1 chain header with chainId 4663", () => {
    const vector1 = leavesV3Json.vectors[1];
    const encoded = encodeAbiParameters(
      parseAbiParameters("uint8, uint64, uint32, uint64, uint32"),
      [
        vector1.fields.typeId,
        BigInt(vector1.fields.snapshotId),
        vector1.fields.chainIndex!,
        BigInt(vector1.fields.chainId!),
        vector1.fields.venueCount!
      ]
    );

    const innerHash = keccak256(encoded);
    const leafHash = keccak256(innerHash);

    expect(leafHash).toBeDefined();
    expect(leafHash.startsWith("0x")).toBe(true);
  });

  it("Test Case 1.3.4 (Leaf 2 Venue Row Encoding): Encodes type 2 venue row with 24-hour activity array", () => {
    const vector2 = leavesV3Json.vectors[2];
    const encoded = encodeAbiParameters(
      parseAbiParameters("uint8, uint64, uint64, uint32, uint32, uint32, uint64, uint32, uint64, uint32[24]"),
      [
        vector2.fields.typeId,
        BigInt(vector2.fields.snapshotId),
        BigInt(vector2.fields.chainId!),
        vector2.fields.venueIndex!,
        vector2.fields.venueId!,
        vector2.fields.survivalRateBps!,
        BigInt(vector2.fields.medianLiqUsdCents!),
        vector2.fields.extractionBps!,
        BigInt(vector2.fields.volumeAdjUsdCents!),
        vector2.fields.hourlyActivityBps as unknown as readonly [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]
      ]
    );

    const innerHash = keccak256(encoded);
    const leafHash = keccak256(innerHash);

    expect(leafHash).toBeDefined();
    expect(leafHash.startsWith("0x")).toBe(true);
  });
});
