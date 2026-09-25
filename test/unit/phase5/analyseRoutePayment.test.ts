import { describe, it, expect } from "vitest";
import { POST } from "@/app/v1/analyse/route";
import {
  x402Facilitator,
  ROBINHOOD_SAFE_MULTISIG,
  ROBINHOOD_USDG_CONTRACT,
  REPORT_PRICE_USDG_ATOMIC
} from "@/lib/payments/x402Facilitator";
import { type Hex, type Address } from "viem";

describe("Epic 15: Secure x402 Route Flow (TASK-5.2.5)", () => {
  const clientAddress: Address = "0x4444444444444444444444444444444444444444";
  const idempotencyKey: Hex = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

  const getValidAuth = () => {
    const nonce = x402Facilitator.computeDeterministicNonce(clientAddress, idempotencyKey);
    const now = Math.floor(Date.now() / 1000);
    return {
      contractAddress: ROBINHOOD_USDG_CONTRACT,
      from: clientAddress,
      to: ROBINHOOD_SAFE_MULTISIG,
      value: "5000000",
      validAfter: now - 60,
      validBefore: now + 3600,
      nonce,
      v: 27,
      r: "0x5555555555555555555555555555555555555555555555555555555555555555" as Hex,
      s: "0x6666666666666666666666666666666666666666666666666666666666666666" as Hex
    };
  };

  it("Test Case 5.2.5a: Free scout flow succeeds without payment authorization", async () => {
    const req = new Request("http://localhost:3000/v1/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "A simple meme token launching on Solana" })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.verdict).toBeDefined();
    expect(data.x402_settlement).toBeUndefined();
  });

  it("Test Case 5.2.5b: Valid x402 payment settles onchain and delivers report with receipt hashes", async () => {
    const auth = getValidAuth();
    const req = new Request("http://localhost:3000/v1/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "An algorithmic stablecoin pegged to USDG on Robinhood Chain",
        payment_authorization: auth,
        idempotency_key: idempotencyKey
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.verdict).toBeDefined();
    expect(data.x402_settlement).toBeDefined();
    expect(data.x402_settlement.status).toBe("SETTLED");
    expect(data.x402_settlement.tx_hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(data.x402_settlement.receipt_salt).toMatch(/^0x[a-f0-9]{64}$/);
    expect(data.x402_settlement.report_hash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(data.x402_settlement.anchored_snapshot_id).toBe(102);
  });

  it("Test Case 5.2.5c: Pre-flight validation failure returns HTTP 402 and withholds report", async () => {
    const auth = getValidAuth();
    auth.value = "1"; // Underpaid
    const req = new Request("http://localhost:3000/v1/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Attempted exploit with 1 wei USDG",
        payment_authorization: auth,
        idempotency_key: idempotencyKey
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(402);
    const data = await res.json();
    expect(data.code).toBe("PAYMENT_PREFLIGHT_FAILED");
    expect(data.verdict).toBeUndefined(); // Report withheld!
  });

  it("Test Case 5.2.5d: Onchain settlement failure returns HTTP 402 and withholds report", async () => {
    const freshKey = "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" as Hex;
    const auth = getValidAuth();
    auth.nonce = x402Facilitator.computeDeterministicNonce(clientAddress, freshKey);

    const req = new Request("http://localhost:3000/v1/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Payment that simulates onchain revert",
        payment_authorization: auth,
        idempotency_key: freshKey,
        simulate_revert: true
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(402);
    const data = await res.json();
    expect(data.code).toBe("SETTLEMENT_FAILED");
    expect(data.verdict).toBeUndefined(); // Report strictly withheld!
  });
});
