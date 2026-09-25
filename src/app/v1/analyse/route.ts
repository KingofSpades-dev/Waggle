import { NextResponse } from 'next/server';
import { scoutProject } from '@/lib/scorer';
import { AnalyseRequestBody } from '@/lib/types';
import { x402Facilitator, TransferAuthorization } from '@/lib/payments/x402Facilitator';
import { idempotencyManager } from '@/lib/payments/idempotency';
import { reportReceiptManager } from '@/lib/receipts/reportReceiptManager';
import { type Hex } from 'viem';

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const body: AnalyseRequestBody & {
      payment_authorization?: TransferAuthorization;
      idempotency_key?: Hex;
      simulate_revert?: boolean;
    } = rawBody;

    if (!body.description && !body.url) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "Please provide a description or URL of what you are launching." },
        { status: 400 }
      );
    }

    // TASK-5.2.5: Secure x402 Flow: Verify -> Generate -> Settle -> Deliver
    if (body.payment_authorization && body.idempotency_key) {
      const auth = body.payment_authorization;
      const idempotencyKey = body.idempotency_key;

      // 1. Verify: Pre-flight validation & Nonce match
      const preFlight = x402Facilitator.validatePreFlight(auth, idempotencyKey);
      if (!preFlight.valid) {
        return NextResponse.json(
          {
            code: "PAYMENT_PREFLIGHT_FAILED",
            message: preFlight.reason || "Payment pre-flight validation failed"
          },
          { status: 402 }
        );
      }

      // Check atomic lock
      const lockAcquired = idempotencyManager.acquireLock(idempotencyKey);
      if (!lockAcquired) {
        return NextResponse.json(
          { code: "CONCURRENCY_LOCKED", message: "A request with this idempotency key is already being processed." },
          { status: 409 }
        );
      }

      try {
        idempotencyManager.initRecord(idempotencyKey, auth.from);

        // 2. Generate: Compute analysis verdict
        const report = await scoutProject(body);
        const encrypted = idempotencyManager.encryptPayload(report);
        idempotencyManager.transitionState(idempotencyKey, "GENERATED", { encryptedPayload: encrypted });

        // 3. Settle: Broadcast transferWithAuthorization to Robinhood Chain
        idempotencyManager.transitionState(idempotencyKey, "SETTLING");
        const settlement = await x402Facilitator.settlePayment(
          auth,
          idempotencyKey,
          body.simulate_revert === true
        );

        if (!settlement.success) {
          // If settlement fails, WITHHOLD the report!
          idempotencyManager.transitionState(idempotencyKey, "FAILED", { failureReason: settlement.error });
          return NextResponse.json(
            {
              code: "SETTLEMENT_FAILED",
              message: `Payment settlement failed onchain: ${settlement.error}. Report withheld.`
            },
            { status: 402 }
          );
        }

        // 4. Deliver: Settle succeeded! Transition to SETTLED and deliver report
        idempotencyManager.transitionState(idempotencyKey, "SETTLED", { txHash: settlement.txHash });

        // Generate private receipt record (TASK-5.1.1 & TASK-5.1.2)
        const parsedSnapshotId = Number(report.version_metadata?.snapshot_id);
        const evaluatedSnapshotId = Number.isFinite(parsedSnapshotId) && parsedSnapshotId > 0
          ? Math.floor(parsedSnapshotId)
          : 101;

        const receipt = reportReceiptManager.createReceipt(
          `rep_${Date.now()}`,
          body.description || body.url || "",
          report.verdict,
          evaluatedSnapshotId
        );

        return NextResponse.json({
          ...report,
          x402_settlement: {
            status: "SETTLED",
            tx_hash: settlement.txHash,
            receipt_salt: receipt.salt,
            report_hash: receipt.reportHash,
            evaluated_snapshot_id: receipt.evaluatedSnapshotId,
            anchored_snapshot_id: receipt.anchoredSnapshotId
          }
        }, { status: 200 });
      } finally {
        idempotencyManager.releaseLock(idempotencyKey);
      }
    }

    // Standard free scout flow (retains backward compatibility)
    const report = await scoutProject(body);
    return NextResponse.json(report, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("analyse POST error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: error.message || "Failed to process analysis request." },
      { status: 500 }
    );
  }
}
