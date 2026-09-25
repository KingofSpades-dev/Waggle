import { describe, it, expect } from "vitest";

// Emulate WaggleAttestor contract state & logic
interface SnapshotRecord {
  merkleRoot: string;
  metricsVersion: number;
  weightsVersion: number;
  windowEnd: bigint;
  attestedAtBlock: bigint;
  attestedAtTimestamp: bigint;
  uri: string;
}

class EmulatedWaggleAttestor {
  public owner: string;
  public publisher: string;
  public isArbitrumChain: boolean;
  public snapshots = new Map<bigint, SnapshotRecord>();
  public currentTimestamp = BigInt(10000);
  public currentL1Block = BigInt(1000);
  public mockArbSysBlock: bigint | null = BigInt(555555);
  public arbSysShouldRevert = false;

  constructor(
    owner: string,
    publisher: string,
    isArbitrumChain: boolean,
    chainId: number = 4663
  ) {
    if (!owner || owner === "0x0000000000000000000000000000000000000000") {
      throw new Error("Owner cannot be zero");
    }
    if (!publisher || publisher === "0x0000000000000000000000000000000000000000") {
      throw new Error("Publisher cannot be zero");
    }
    // Constructor guard on Chain 4663
    if (chainId === 4663 && !isArbitrumChain) {
      throw new Error("Chain 4663 must use ArbSys");
    }

    this.owner = owner;
    this.publisher = publisher;
    this.isArbitrumChain = isArbitrumChain;
  }

  private getL2BlockNumber(): bigint {
    if (this.isArbitrumChain) {
      if (this.arbSysShouldRevert || this.mockArbSysBlock === null) {
        throw new Error("ArbSys L2 block call failed");
      }
      return this.mockArbSysBlock;
    }
    return this.currentL1Block;
  }

  public attest(
    caller: string,
    snapshotId: bigint,
    merkleRoot: string,
    metricsVersion: number,
    weightsVersion: number,
    windowEnd: bigint,
    uri: string
  ) {
    if (caller !== this.publisher) {
      throw new Error("Waggle: caller is not publisher");
    }
    if (this.snapshots.has(snapshotId) && this.snapshots.get(snapshotId)!.merkleRoot !== "0x" + "00".repeat(32)) {
      throw new Error("Snapshot already attested");
    }
    if (!merkleRoot || merkleRoot === "0x" + "00".repeat(32)) {
      throw new Error("Invalid Merkle root");
    }
    if (windowEnd > this.currentTimestamp) {
      throw new Error("Window not closed");
    }

    const l2Block = this.getL2BlockNumber();

    const record: SnapshotRecord = {
      merkleRoot,
      metricsVersion,
      weightsVersion,
      windowEnd,
      attestedAtBlock: l2Block,
      attestedAtTimestamp: this.currentTimestamp,
      uri
    };

    this.snapshots.set(snapshotId, record);
    return record;
  }

  public setPublisher(caller: string, newPublisher: string) {
    if (caller !== this.owner) {
      throw new Error("Waggle: caller is not owner");
    }
    if (!newPublisher || newPublisher === "0x0000000000000000000000000000000000000000") {
      throw new Error("New publisher cannot be zero");
    }
    this.publisher = newPublisher;
  }

  public rootOf(snapshotId: bigint): string {
    return this.snapshots.get(snapshotId)?.merkleRoot || "0x" + "00".repeat(32);
  }
}

describe("Epic 10: Smart Contract WaggleAttestor Anti-Silent Fallback", () => {
  const safeOwner = "0x5afe000000000000000000000000000000000001";
  const publisher = "0xpub0000000000000000000000000000000000002";

  it("Test Case 3.2.1 (ArbSys L2 Block Number Test): Correctly records ArbSys L2 block height", () => {
    const attestor = new EmulatedWaggleAttestor(safeOwner, publisher, true, 4663);
    const root = "0x" + "aa".repeat(32);

    const record = attestor.attest(
      publisher,
      BigInt(101),
      root,
      1,
      1,
      BigInt(5000), // windowEnd <= currentTimestamp (10000)
      "ipfs://snapshot101"
    );

    expect(record.attestedAtBlock).toBe(BigInt(555555));
    expect(attestor.rootOf(BigInt(101))).toBe(root);
  });

  it("Test Case 3.2.2 (Constructor Safety Guard Revert): Reverts loudly if Chain 4663 deployed with isArbitrumChain=false", () => {
    // Deploying on Chain 4663 without isArbitrumChain flag must fail immediately
    expect(() => {
      new EmulatedWaggleAttestor(safeOwner, publisher, false, 4663);
    }).toThrow("Chain 4663 must use ArbSys");

    // Deploying on other chain without isArbitrumChain is allowed
    const nonArbAttestor = new EmulatedWaggleAttestor(safeOwner, publisher, false, 1);
    expect(nonArbAttestor.isArbitrumChain).toBe(false);
  });

  it("Test Case 3.2.3 (ArbSys Failure Loud Revert): Reverts loudly with exact error message if ArbSys precompile fails", () => {
    const attestor = new EmulatedWaggleAttestor(safeOwner, publisher, true, 4663);
    attestor.arbSysShouldRevert = true;

    const root = "0x" + "bb".repeat(32);
    expect(() => {
      attestor.attest(
        publisher,
        BigInt(102),
        root,
        1,
        1,
        BigInt(5000),
        "ipfs://snapshot102"
      );
    }).toThrow("ArbSys L2 block call failed");
  });

  it("Test Case 3.2.4 (Write-Once Immutable & Out-of-Order Attestation): Allows out-of-order retry but forbids overwrite", () => {
    const attestor = new EmulatedWaggleAttestor(safeOwner, publisher, true, 4663);
    const root101 = "0x" + "11".repeat(32);
    const root100 = "0x" + "22".repeat(32);

    // 1. Attest snapshot 101 first
    attestor.attest(publisher, BigInt(101), root101, 1, 1, BigInt(6000), "ipfs://101");
    expect(attestor.rootOf(BigInt(101))).toBe(root101);

    // 2. Retry out-of-order: Attest snapshot 100 later
    attestor.attest(publisher, BigInt(100), root100, 1, 1, BigInt(5000), "ipfs://100");
    expect(attestor.rootOf(BigInt(100))).toBe(root100);

    // 3. Attempting to overwrite existing snapshot 100 must revert
    expect(() => {
      attestor.attest(publisher, BigInt(100), root100, 1, 1, BigInt(5000), "ipfs://100_dupe");
    }).toThrow("Snapshot already attested");
  });

  it("Test Case 3.2.5 (Window End Future Revert): Reverts if window has not closed", () => {
    const attestor = new EmulatedWaggleAttestor(safeOwner, publisher, true, 4663);
    const root = "0x" + "cc".repeat(32);
    const futureWindow = BigInt(15000); // currentTimestamp is 10000

    expect(() => {
      attestor.attest(publisher, BigInt(103), root, 1, 1, futureWindow, "ipfs://future");
    }).toThrow("Window not closed");
  });

  it("Test Case 3.2.6 (Publisher Rotation): Safe Multisig owner can rotate publisher key", () => {
    const attestor = new EmulatedWaggleAttestor(safeOwner, publisher, true, 4663);
    const newPub = "0xpub9999999999999999999999999999999999999";

    // Non-owner cannot rotate
    expect(() => {
      attestor.setPublisher("0xhacker", newPub);
    }).toThrow("Waggle: caller is not owner");

    // Owner rotates publisher
    attestor.setPublisher(safeOwner, newPub);
    expect(attestor.publisher).toBe(newPub);
  });
});
