import { describe, it, expect } from "vitest";
import {
  baseUsdcFacilitator,
  BASE_SAFE_MULTISIG,
  BASE_USDC_CONTRACT,
  BaseUsdcAuthorization
} from "@/lib/payments/baseUsdcFacilitator";
import { type Address } from "viem";

describe("Epic 15: Isolated Safe Multisig on Base Network (TASK-5.2.7)", () => {
  const client: Address = "0x3333333333333333333333333333333333333333";

  it("Test Case 5.2.7a: Enforces isolated Base Safe Multisig as payment recipient", () => {
    const validAuth: BaseUsdcAuthorization = {
      from: client,
      to: BASE_SAFE_MULTISIG,
      value: 5_000_000n, // 5 USDC
      validAfter: 0,
      validBefore: 9999999999,
      nonce: "0x1111111111111111111111111111111111111111111111111111111111111111",
      v: 27,
      r: "0x0000000000000000000000000000000000000000000000000000000000000001",
      s: "0x0000000000000000000000000000000000000000000000000000000000000002"
    };

    const res = baseUsdcFacilitator.validateBasePayment(validAuth);
    expect(res.valid).toBe(true);

    // Rejects payment if redirected to any other address
    validAuth.to = "0x9999999999999999999999999999999999999999";
    const invalidRes = baseUsdcFacilitator.validateBasePayment(validAuth);
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.reason).toContain("isolated Base Safe Multisig");
  });
});
