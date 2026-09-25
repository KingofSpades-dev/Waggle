import { describe, it, expect } from "vitest";
import { ProofWorkerPipeline, ProofJob } from "../../../src/lib/zk/proofWorker";

describe("Phase 4: Hourly Proof Aggregation & Worker State Machine", () => {
  it("Test Case 4.1.1 (State Transition Machine): PROOF_PENDING -> PROVEN -> VERIFIED_ONCHAIN", async () => {
    const pipeline = new ProofWorkerPipeline();
    const job: ProofJob = {
      reportId: "0xreport101",
      snapshotId: 105n,
      tier: "free",
      mode: "public",
      status: "PROOF_PENDING",
      fitPublicValues: "0xpv101"
    };

    pipeline.enqueueJob(job);
    expect(pipeline.getJob("0xreport101")?.status).toBe("PROOF_PENDING");

    await pipeline.processFreeJobCompressed("0xreport101", "0xcompressedProof");
    expect(pipeline.getJob("0xreport101")?.status).toBe("PROVEN");

    await pipeline.processHourlyBatch("0xbatch1", ["0xreport101"], "0xtx123");
    expect(pipeline.getJob("0xreport101")?.status).toBe("VERIFIED_ONCHAIN");
    expect(pipeline.getJob("0xreport101")?.batchId).toBe("0xbatch1");
    expect(pipeline.getJob("0xreport101")?.txHash).toBe("0xtx123");
  });

  it("Test Case 4.1.2 (Paid Tier Direct Settlement): Enforces instant VERIFIED_ONCHAIN for paid tier", async () => {
    const pipeline = new ProofWorkerPipeline();
    const job: ProofJob = {
      reportId: "0xpaidReport202",
      snapshotId: 105n,
      tier: "paid",
      mode: "public",
      status: "PROOF_PENDING",
      fitPublicValues: "0xpv202"
    };

    pipeline.enqueueJob(job);
    await pipeline.processPaidJob("0xpaidReport202", "0xgroth16Proof", "0xpaidTx777");

    expect(pipeline.getJob("0xpaidReport202")?.status).toBe("VERIFIED_ONCHAIN");
    expect(pipeline.getJob("0xpaidReport202")?.txHash).toBe("0xpaidTx777");
  });
});
