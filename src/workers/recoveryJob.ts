import { idempotencyManager, IdempotencyRecord } from "@/lib/payments/idempotency";
import { x402Facilitator } from "@/lib/payments/x402Facilitator";

export class StartupRecoveryJob {
  private timeoutMs = 5 * 60 * 1000; // 5 minutes timeout

  /**
   * TASK-5.2.4: Runs crash recovery scan on all records in SETTLING state.
   */
  public async runRecoveryScan(): Promise<{
    scanned: number;
    recoveredToSettled: number;
    recoveredToFailed: number;
  }> {
    const allRecords = idempotencyManager.getAllRecords();
    const settlingRecords = allRecords.filter(r => r.state === "SETTLING");

    let recoveredToSettled = 0;
    let recoveredToFailed = 0;
    const now = Date.now();

    for (const record of settlingRecords) {
      // Check if nonce was actually consumed onchain
      const isNonceConsumed = x402Facilitator.isNonceUsed(record.idempotencyKey);

      if (isNonceConsumed) {
        // Recover to SETTLED: transaction was mined before server crashed
        idempotencyManager.transitionState(record.idempotencyKey, "SETTLED");
        recoveredToSettled++;
      } else if (now - record.updatedAt > this.timeoutMs) {
        // Timed out and not mined onchain: recover to FAILED and free the lock
        idempotencyManager.transitionState(record.idempotencyKey, "FAILED", {
          failureReason: "Settlement timed out during server restart"
        });
        idempotencyManager.releaseLock(record.idempotencyKey);
        recoveredToFailed++;
      }
    }

    return {
      scanned: settlingRecords.length,
      recoveredToSettled,
      recoveredToFailed
    };
  }
}

export const startupRecoveryJob = new StartupRecoveryJob();
