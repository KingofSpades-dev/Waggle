import { describe, it, expect } from "vitest";

// Emulate WaggleFitVerifier contract state & validation logic
interface ProgramConfig {
  verifier: string;
  fitVkey: string;
  fitVkeyDigest: string;
  batchVkey: string;
  disclosureVkey: string;
  scorerVersion: number;
}

interface WeightsEntry {
  hash: string;
  activeAt: bigint;
}

class EmulatedWaggleFitVerifier {
  public owner: string;
  public pendingOwner: string | null = null;
  public attestor: string;
  public paused = false;
  public config: ProgramConfig;
  public pendingConfig: ProgramConfig | null = null;
  public pendingConfigReadyAt: bigint = 0n;
  public weights = new Map<number, WeightsEntry>();
  public attestedRoots = new Map<bigint, string>();
  public reports = new Map<string, { snapshotId: bigint; provenAt: bigint; batchId: string }>();

  constructor(owner: string, attestor: string, config: ProgramConfig) {
    if (!owner || !attestor) throw new Error("ZeroValue");
    this.validateConfig(config);
    this.owner = owner;
    this.attestor = attestor;
    this.config = config;
  }

  public validateConfig(c: ProgramConfig) {
    // Fix D.1: disclosureVkey can be empty at initial launch before Phase 2
    if (!c.verifier || !c.fitVkey || !c.fitVkeyDigest || !c.batchVkey || c.scorerVersion === 0) {
      throw new Error("ZeroValue");
    }
  }

  public registerWeights(caller: string, version: number, hash: string, currentTimestamp: bigint) {
    if (caller !== this.owner) throw new Error("NotOwner");
    if (!hash) throw new Error("ZeroValue");
    if (this.weights.has(version)) throw new Error("AlreadyRegistered");

    const activeAt = currentTimestamp + 172800n; // 48 hours timelock
    this.weights.set(version, { hash, activeAt });
  }

  public submitProof(
    reportId: string,
    snapshotId: bigint,
    merkleRoot: string,
    weightsVersion: number,
    weightsHash: string,
    currentTimestamp: bigint
  ) {
    if (this.paused) throw new Error("IsPaused");
    const attested = this.attestedRoots.get(snapshotId);
    if (!attested || attested !== merkleRoot) throw new Error("RootMismatch");

    const w = this.weights.get(weightsVersion);
    if (!w || w.hash !== weightsHash) throw new Error("UnregisteredWeights");
    if (currentTimestamp < w.activeAt) throw new Error("WeightsNotActive");

    if (this.reports.has(reportId)) throw new Error("AlreadyProven");
    this.reports.set(reportId, { snapshotId, provenAt: currentTimestamp, batchId: "0x0" });
  }

  public checkDisclosure(caller: string) {
    if (!this.config.disclosureVkey) {
      throw new Error("VkeyMismatch"); // Reverts if disclosureVkey is bytes32(0)
    }
    return true;
  }

  public pause(caller: string) {
    if (caller !== this.owner) throw new Error("NotOwner");
    this.paused = true;
  }

  public unpause(caller: string) {
    if (caller !== this.owner) throw new Error("NotOwner");
    this.paused = false;
  }

  public transferOwnership(caller: string, to: string) {
    if (caller !== this.owner) throw new Error("NotOwner");
    this.pendingOwner = to;
  }

  public acceptOwnership(caller: string) {
    if (caller !== this.pendingOwner) throw new Error("NotOwner");
    this.owner = this.pendingOwner;
    this.pendingOwner = null;
  }
}

describe("Phase 3: WaggleFitVerifier Contract Logic (Draft, Pre-Audit)", () => {
  const owner = "0xowner0000000000000000000000000000000001";
  const attestor = "0xattestor000000000000000000000000000002";
  const initialConfig: ProgramConfig = {
    verifier: "0xverifier",
    fitVkey: "0xfitVkey",
    fitVkeyDigest: "0xfitVkeyDigest",
    batchVkey: "0xbatchVkey",
    disclosureVkey: "", // Initial deploy allows disclosureVkey == 0
    scorerVersion: 3
  };

  it("Test Case 3.1.1 (Initial Deployment Validation Fix D.1): Allows disclosureVkey == 0 at initial launch", () => {
    const verifier = new EmulatedWaggleFitVerifier(owner, attestor, initialConfig);
    expect(verifier.config.disclosureVkey).toBe("");
  });

  it("Test Case 3.1.2 (Weights Registration 48h Timelock): Enforces 48-hour activation delay", () => {
    const verifier = new EmulatedWaggleFitVerifier(owner, attestor, initialConfig);
    const weightsHash = "0xweights123";
    const now = 1000n;

    verifier.registerWeights(owner, 1, weightsHash, now);
    const entry = verifier.weights.get(1)!;
    expect(entry.activeAt).toBe(1000n + 172800n); // 48h timelock

    verifier.attestedRoots.set(105n, "0xroot105");

    // Attempting submitProof before 48h expires must revert
    expect(() => {
      verifier.submitProof("0xrep1", 105n, "0xroot105", 1, weightsHash, now + 100n);
    }).toThrow("WeightsNotActive");

    // Submit proof after 48h timelock passes succeeds
    verifier.submitProof("0xrep1", 105n, "0xroot105", 1, weightsHash, now + 172801n);
    expect(verifier.reports.get("0xrep1")?.provenAt).toBe(now + 172801n);
  });

  it("Test Case 3.1.3 (Emergency Pause): Blocks proof submissions when paused", () => {
    const verifier = new EmulatedWaggleFitVerifier(owner, attestor, initialConfig);
    verifier.pause(owner);

    expect(() => {
      verifier.submitProof("0xrep2", 105n, "0xroot105", 1, "0xhash", 200000n);
    }).toThrow("IsPaused");

    verifier.unpause(owner);
    expect(verifier.paused).toBe(false);
  });

  it("Test Case 3.1.4 (CheckDisclosure Unset Revert): Reverts checkDisclosure when disclosureVkey == 0", () => {
    const verifier = new EmulatedWaggleFitVerifier(owner, attestor, initialConfig);
    expect(() => verifier.checkDisclosure(owner)).toThrow("VkeyMismatch");
  });

  it("Test Case 3.1.5 (Two-Step Ownership Transfer): Requires pendingOwner acceptance", () => {
    const verifier = new EmulatedWaggleFitVerifier(owner, attestor, initialConfig);
    const newOwner = "0xnewowner000000000000000000000000000099";

    verifier.transferOwnership(owner, newOwner);
    expect(verifier.pendingOwner).toBe(newOwner);

    // Non-pending owner cannot accept
    expect(() => verifier.acceptOwnership(owner)).toThrow("NotOwner");

    // New owner accepts
    verifier.acceptOwnership(newOwner);
    expect(verifier.owner).toBe(newOwner);
    expect(verifier.pendingOwner).toBeNull();
  });
});
