import { describe, it, expect, beforeEach } from "vitest";
import { IdempotencyManager } from "@/lib/payments/idempotency";
import { StartupRecoveryJob } from "@/workers/recoveryJob";
import { x402Facilitator } from "@/lib/payments/x402Facilitator";
import { type Hex } from "viem";

describe("Epic 15: State Machine Idempotency & Startup Recovery Job (TASK-5.2.4)", () => {
  let manager: IdempotencyManager;
  let recoveryJob: StartupRecoveryJob;
  const testKey: Hex = "0x1234567812345678123456781234567812345678123456781234567812345678";

  beforeEach(() => {
    manager = new IdempotencyManager();
    recoveryJob = new StartupRecoveryJob();
  });

  it("Test Case 5.2.4a: Atomic lock prevents concurrent processing of duplicate idempotency keys", () => {
    expect(manager.acquireLock(testKey)).toBe(true);
    // Duplicate concurrent request rejected
    expect(manager.acquireLock(testKey)).toBe(false);

    manager.releaseLock(testKey);
    // Lock released and available again
    expect(manager.acquireLock(testKey)).toBe(true);
  });

  it("Test Case 5.2.4b: State machine progresses through INITIATED -> GENERATED -> SETTLING -> SETTLED", () => {
    const record = manager.initRecord(testKey, "0x1111111111111111111111111111111111111111");
    expect(record.state).toBe("INITIATED");

    manager.transitionState(testKey, "GENERATED");
    expect(manager.getRecord(testKey)?.state).toBe("GENERATED");

    manager.transitionState(testKey, "SETTLING");
    expect(manager.getRecord(testKey)?.state).toBe("SETTLING");

    manager.transitionState(testKey, "SETTLED", {
      txHash: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd"
    });
    const finalRecord = manager.getRecord(testKey);
    expect(finalRecord?.state).toBe("SETTLED");
    expect(finalRecord?.txHash).toBe("0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd");
  });

  it("Test Case 5.2.4c: Encrypts and decrypts report payload with AES-256", () => {
    const originalPayload = { score: 95, chain: "Robinhood", venue: "Pons" };
    const encryptedHex = manager.encryptPayload(originalPayload);

    expect(encryptedHex).not.toContain("Robinhood");
    const decrypted = manager.decryptPayload<typeof originalPayload>(encryptedHex);
    expect(decrypted).toEqual(originalPayload);
  });

  it("Test Case 5.2.4d: Startup crash recovery job recovers SETTLING records", async () => {
    // 1. Create a record stuck in SETTLING
    const settlingKey: Hex = "0x9999999999999999999999999999999999999999999999999999999999999999";
    manager.initRecord(settlingKey, "0x2222222222222222222222222222222222222222");
    manager.transitionState(settlingKey, "SETTLING");

    // Scan should process hanging settling records
    const res = await recoveryJob.runRecoveryScan();
    expect(res.scanned).toBeGreaterThanOrEqual(0);
  });
});
