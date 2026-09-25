export type ProofStatus = "PROOF_PENDING" | "PROVEN" | "VERIFIED_ONCHAIN" | "FAILED";

export interface ProofJob {
  reportId: string;
  snapshotId: bigint;
  tier: "paid" | "free";
  mode: "public" | "private";
  status: ProofStatus;
  fitPublicValues: string; // hex string
  proofBytes?: string;
  batchId?: string;
  txHash?: string;
  failedReason?: string;
}

export class ProofWorkerPipeline {
  private jobs = new Map<string, ProofJob>();

  public enqueueJob(job: ProofJob) {
    this.jobs.set(job.reportId, { ...job, status: "PROOF_PENDING" });
  }

  public getJob(reportId: string): ProofJob | undefined {
    return this.jobs.get(reportId);
  }

  public async processPaidJob(reportId: string, proofBytes: string, txHash: string): Promise<ProofJob> {
    const job = this.jobs.get(reportId);
    if (!job) throw new Error("Job not found");

    job.proofBytes = proofBytes;
    job.txHash = txHash;
    job.status = "VERIFIED_ONCHAIN";
    this.jobs.set(reportId, job);
    return job;
  }

  public async processFreeJobCompressed(reportId: string, proofBytes: string): Promise<ProofJob> {
    const job = this.jobs.get(reportId);
    if (!job) throw new Error("Job not found");

    job.proofBytes = proofBytes;
    job.status = "PROVEN";
    this.jobs.set(reportId, job);
    return job;
  }

  public async processHourlyBatch(batchId: string, reportIds: string[], txHash: string): Promise<string[]> {
    const verified: string[] = [];
    for (const rid of reportIds) {
      const job = this.jobs.get(rid);
      if (job && job.status === "PROVEN") {
        job.batchId = batchId;
        job.txHash = txHash;
        job.status = "VERIFIED_ONCHAIN";
        this.jobs.set(rid, job);
        verified.push(rid);
      }
    }
    return verified;
  }
}
