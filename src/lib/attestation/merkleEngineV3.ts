import { keccak256, encodeAbiParameters, parseAbiParameters } from "viem";

export interface SnapshotHeaderV3 {
  snapshotId: bigint;
  metricsVersion: number;
  chainCount: number;
}

export interface ChainHeaderV3 {
  snapshotId: bigint;
  chainIndex: number;
  chainId: bigint;
  venueCount: number;
}

export interface VenueRowV3 {
  snapshotId: bigint;
  chainId: bigint;
  venueIndex: number;
  venueId: number;
  survivalRateBps: number;
  medianLiqUsdCents: bigint;
  extractionBps: number;
  volumeAdjUsdCents: bigint;
  hourlyActivityBps: number[];
}

/**
 * Double-hashed leaf computation: keccak256(keccak256(abi.encode(...)))
 */
export function leafSnapshotHeaderV3(h: SnapshotHeaderV3): `0x${string}` {
  const encoded = encodeAbiParameters(
    parseAbiParameters("uint8, uint64, uint32, uint32"),
    [0, h.snapshotId, h.metricsVersion, h.chainCount]
  );
  return keccak256(keccak256(encoded));
}

export function leafChainHeaderV3(c: ChainHeaderV3): `0x${string}` {
  const encoded = encodeAbiParameters(
    parseAbiParameters("uint8, uint64, uint32, uint64, uint32"),
    [1, c.snapshotId, c.chainIndex, c.chainId, c.venueCount]
  );
  return keccak256(keccak256(encoded));
}

export function leafVenueRowV3(r: VenueRowV3): `0x${string}` {
  if (r.hourlyActivityBps.length !== 24) {
    throw new Error("hourlyActivityBps must have exactly 24 elements");
  }
  const encoded = encodeAbiParameters(
    parseAbiParameters("uint8, uint64, uint64, uint32, uint32, uint32, uint64, uint32, uint64, uint32[24]"),
    [
      2,
      r.snapshotId,
      r.chainId,
      r.venueIndex,
      r.venueId,
      r.survivalRateBps,
      r.medianLiqUsdCents,
      r.extractionBps,
      r.volumeAdjUsdCents,
      r.hourlyActivityBps as unknown as readonly [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]
    ]
  );
  return keccak256(keccak256(encoded));
}

/**
 * Pair hashing matching OpenZeppelin sorted pair keccak
 */
export function hashPairV3(a: `0x${string}`, b: `0x${string}`): `0x${string}` {
  const [first, second] = a.toLowerCase() <= b.toLowerCase() ? [a, b] : [b, a];
  const concatenated = (first + second.slice(2)) as `0x${string}`;
  return keccak256(concatenated);
}
