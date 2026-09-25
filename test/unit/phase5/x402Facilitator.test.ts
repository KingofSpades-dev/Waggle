import { describe, it, expect, beforeEach } from "vitest";
import {
  X402Facilitator,
  ROBINHOOD_SAFE_MULTISIG,
  ROBINHOOD_USDG_CONTRACT,
  REPORT_PRICE_USDG_ATOMIC,
  TransferAuthorization
} from "@/lib/payments/x402Facilitator";
import { type Hex, type Address } from "viem";

describe("Epic 15: Gasless x402 Payments via USDG EIP-3009 (TASK-5.2.3)", () => {
  let facilitator: X402Facilitator;
  const clientAddress: Address = "0x1111111111111111111111111111111111111111";
  const idempotencyKey: Hex = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

  beforeEach(() => {
    facilitator = new X402Facilitator();
  });

  const getValidAuth = (): TransferAuthorization => {
    const nonce = facilitator.computeDeterministicNonce(clientAddress, idempotencyKey);
    const now = Math.floor(Date.now() / 1000);
    return {
      contractAddress: ROBINHOOD_USDG_CONTRACT,
      from: clientAddress,
      to: ROBINHOOD_SAFE_MULTISIG,
      value: REPORT_PRICE_USDG_ATOMIC,
      validAfter: now - 60,
      validBefore: now + 3600,
      nonce,
      v: 27,
      r: "0x2222222222222222222222222222222222222222222222222222222222222222",
      s: "0x3333333333333333333333333333333333333333333333333333333333333333"
    };
  };

  it("Test Case 5.2.3a: Validates pre-flight checks successfully for well-formed authorization", () => {
    const auth = getValidAuth();
    const result = facilitator.validatePreFlight(auth, idempotencyKey);
    expect(result.valid).toBe(true);
  });

  it("Test Case 5.2.3b: Rejects payment with incorrect amount", () => {
    const auth = getValidAuth();
    auth.value = 1_000_000n; // $1.00 USDG instead of $5.00
    const result = facilitator.validatePreFlight(auth, idempotencyKey);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Invalid payment amount");
  });

  it("Test Case 5.2.3c: Rejects payment targeting non-Safe recipient", () => {
    const auth = getValidAuth();
    auth.to = "0x9999999999999999999999999999999999999999";
    const result = facilitator.validatePreFlight(auth, idempotencyKey);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Invalid recipient address");
  });

  it("Test Case 5.2.3d: Rejects payment targeting wrong token contract", () => {
    const auth = getValidAuth();
    auth.contractAddress = "0x0000000000000000000000000000000000000001";
    const result = facilitator.validatePreFlight(auth, idempotencyKey);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Invalid contract address");
  });

  it("Test Case 5.2.3e: Rejects expired authorization", () => {
    const auth = getValidAuth();
    const now = Math.floor(Date.now() / 1000);
    auth.validBefore = now - 10; // Expired 10s ago
    const result = facilitator.validatePreFlight(auth, idempotencyKey, now);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("expired");
  });

  it("Test Case 5.2.3f: Rejects nonce mismatch against client idempotency key", () => {
    const auth = getValidAuth();
    auth.nonce = "0xbad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0";
    const result = facilitator.validatePreFlight(auth, idempotencyKey);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Nonce mismatch");
  });

  it("Test Case 5.2.3g: Settles payment onchain and prevents nonce replay", async () => {
    const auth = getValidAuth();

    // First settlement passes
    const settlement1 = await facilitator.settlePayment(auth, idempotencyKey);
    expect(settlement1.success).toBe(true);
    expect(settlement1.txHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(facilitator.isNonceUsed(auth.nonce)).toBe(true);

    // Replay with identical nonce fails pre-flight
    const settlement2 = await facilitator.settlePayment(auth, idempotencyKey);
    expect(settlement2.success).toBe(false);
    expect(settlement2.error).toContain("already been consumed");
  });
});
