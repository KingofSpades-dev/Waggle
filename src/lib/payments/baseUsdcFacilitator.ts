import { type Address, type Hex } from "viem";

export const BASE_CHAIN_ID = 8453;
export const BASE_USDC_CONTRACT: Address = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const BASE_SAFE_MULTISIG: Address = "0xBa5e0000000000000000000000000000000030f5";

export interface BaseUsdcAuthorization {
  from: Address;
  to: Address;
  value: bigint;
  validAfter: number;
  validBefore: number;
  nonce: Hex;
  v: number;
  r: Hex;
  s: Hex;
}

export class BaseUsdcFacilitator {
  private baseSafeRecipient: Address = BASE_SAFE_MULTISIG;
  private baseUsdcToken: Address = BASE_USDC_CONTRACT;

  /**
   * TASK-5.2.7: Validates that fallback Base USDC payments are strictly routed
   * to the isolated Base Safe Multisig treasury rather than mixed with Robinhood Chain funds.
   */
  public validateBasePayment(auth: BaseUsdcAuthorization): { valid: boolean; reason?: string } {
    if (auth.to.toLowerCase() !== this.baseSafeRecipient.toLowerCase()) {
      return {
        valid: false,
        reason: `Base USDC must be directed to isolated Base Safe Multisig (${this.baseSafeRecipient})`
      };
    }

    if (auth.value < 5_000_000n) {
      return {
        valid: false,
        reason: "Minimum payment for personalized report is 5.00 USDC"
      };
    }

    return { valid: true };
  }

  public getBaseTreasuryAddress(): Address {
    return this.baseSafeRecipient;
  }
}

export const baseUsdcFacilitator = new BaseUsdcFacilitator();
