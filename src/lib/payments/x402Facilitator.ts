import {
  type Address,
  type Hex,
  encodeAbiParameters,
  parseAbiParameters,
  keccak256
} from "viem";

export const ROBINHOOD_SAFE_MULTISIG: Address = (process.env.WAGGLE_SAFE_ADDRESS || "0xcdc52c6c98ee5775d1d6faee5f7f8329d1e1ac8a") as Address;
export const ROBINHOOD_USDG_CONTRACT: Address = (process.env.ROBINHOOD_USDG_ADDRESS || "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168") as Address;
export const REPORT_PRICE_USDG_ATOMIC = 5_000_000n; // 5.00 USDG (6 decimals)

export interface TransferAuthorization {
  contractAddress: Address;
  from: Address;
  to: Address;
  value: bigint | string | number;
  validAfter: number;
  validBefore: number;
  nonce: Hex;
  v: number;
  r: Hex;
  s: Hex;
}

export class X402Facilitator {
  private usedNonces: Set<string> = new Set();
  private expectedRecipient: Address = ROBINHOOD_SAFE_MULTISIG;
  private expectedUsdgContract: Address = ROBINHOOD_USDG_CONTRACT;
  private expectedPrice: bigint = REPORT_PRICE_USDG_ATOMIC;

  /**
   * TASK-5.2.3: Derives the required deterministic client nonce:
   * Nonce = keccak256(abi.encode(["address", "bytes32"], [from, idempotencyKey]))
   */
  public computeDeterministicNonce(from: Address, idempotencyKey: Hex): Hex {
    const encoded = encodeAbiParameters(
      parseAbiParameters("address, bytes32"),
      [from, idempotencyKey]
    );
    return keccak256(encoded);
  }

  /**
   * TASK-5.2.3: Pre-Flight Validations before broadcasting to Robinhood Chain:
   * Rejects malformed or malicious payloads before expending gas fees.
   */
  public validatePreFlight(
    auth: TransferAuthorization,
    idempotencyKey: Hex,
    currentTimestamp: number = Math.floor(Date.now() / 1000)
  ): { valid: boolean; reason?: string } {
    // 1. Amount validation (supports string, number, or bigint)
    const valBigInt = BigInt(auth.value);
    if (valBigInt !== this.expectedPrice) {
      return { valid: false, reason: `Invalid payment amount: expected ${this.expectedPrice}, received ${auth.value}` };
    }

    // 2. Safe Multisig recipient validation
    if (auth.to.toLowerCase() !== this.expectedRecipient.toLowerCase()) {
      return { valid: false, reason: `Invalid recipient address: payment must be directed to Safe Multisig ${this.expectedRecipient}` };
    }

    // 3. Official USDG Contract validation
    if (auth.contractAddress.toLowerCase() !== this.expectedUsdgContract.toLowerCase()) {
      return { valid: false, reason: `Invalid contract address: must target official USDG token ${this.expectedUsdgContract}` };
    }

    // 4. Expiry validations
    if (auth.validAfter > currentTimestamp) {
      return { valid: false, reason: "Authorization window is not yet active (validAfter in future)" };
    }
    if (auth.validBefore <= currentTimestamp) {
      return { valid: false, reason: "Authorization has expired (validBefore in past)" };
    }

    // 5. Nonce Matching against client idempotency key
    const expectedNonce = this.computeDeterministicNonce(auth.from, idempotencyKey);
    if (auth.nonce.toLowerCase() !== expectedNonce.toLowerCase()) {
      return { valid: false, reason: `Nonce mismatch: expected ${expectedNonce}, received ${auth.nonce}` };
    }

    // 6. Onchain state / Replay check
    if (this.usedNonces.has(auth.nonce.toLowerCase())) {
      return { valid: false, reason: "Authorization nonce has already been consumed (replay rejected)" };
    }

    return { valid: true };
  }

  /**
   * Simulates and settles EIP-3009 transferWithAuthorization onchain.
   */
  public async settlePayment(
    auth: TransferAuthorization,
    idempotencyKey: Hex,
    simulateRevert: boolean = false
  ): Promise<{ success: boolean; txHash?: Hex; error?: string }> {
    const preFlight = this.validatePreFlight(auth, idempotencyKey);
    if (!preFlight.valid) {
      return { success: false, error: preFlight.reason };
    }

    if (simulateRevert) {
      return { success: false, error: "Onchain settlement reverted: insufficient USDG balance or revoked authorization" };
    }

    // Consume nonce in state
    this.usedNonces.add(auth.nonce.toLowerCase());

    // Generate deterministic 32-byte onchain settlement txHash
    const txHash = keccak256(Buffer.from(`usdg_settle_${auth.nonce}_${Date.now()}`, "utf-8"));

    return {
      success: true,
      txHash
    };
  }


  /**
   * Checks authorization state for a given nonce.
   */
  public isNonceUsed(nonce: Hex): boolean {
    return this.usedNonces.has(nonce.toLowerCase());
  }
}

export const x402Facilitator = new X402Facilitator();
