import { describe, it, expect, beforeEach } from "vitest";
import { AttestationWorker } from "@/workers/attestationWorker";

describe("Epic 13: Hourly Attestation Worker dengan Retry Queue (TASK-4.2.1)", () => {
  let worker: AttestationWorker;

  beforeEach(() => {
    worker = new AttestationWorker();
  });

  it("Test Case 4.2.1a: Enqueues and processes hourly attestation successfully", async () => {
    const job = worker.enqueueSnapshot(101, Math.floor(Date.now() / 1000) - 3600);
    expect(job.status).toBe("pending");

    const result = await worker.processQueue(false);
    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.failed).toBe(0);

    const updatedJob = worker.getSnapshotStatus(101);
    expect(updatedJob?.status).toBe("attested");
    expect(updatedJob?.merkleRoot).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(updatedJob?.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it("Test Case 4.2.1b: Failed attestation enters in_retry_queue without blocking system", async () => {
    worker.enqueueSnapshot(102, Math.floor(Date.now() / 1000) - 3600, 3);

    // Simulate RPC timeout / failure on first attempt
    const result = await worker.processQueue(true);
    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);

    const job = worker.getSnapshotStatus(102);
    expect(job?.status).toBe("in_retry_queue");
    expect(job?.retryCount).toBe(1);
    expect(job?.lastError).toContain("RPC simulated error");

    // Retry succeeded on second attempt
    const retryResult = await worker.processQueue(false);
    expect(retryResult.succeeded).toBe(1);

    const recoveredJob = worker.getSnapshotStatus(102);
    expect(recoveredJob?.status).toBe("attested");
  });

  it("Test Case 4.2.1c: Transitions to failed state when maxRetries exhausted", async () => {
    worker.enqueueSnapshot(103, Math.floor(Date.now() / 1000) - 3600, 2);

    // Attempt 1
    await worker.processQueue(true);
    expect(worker.getSnapshotStatus(103)?.status).toBe("in_retry_queue");

    // Attempt 2 (exhausts maxRetries = 2)
    await worker.processQueue(true);
    const finalJob = worker.getSnapshotStatus(103);
    expect(finalJob?.status).toBe("failed");
    expect(finalJob?.retryCount).toBe(2);
  });
});
