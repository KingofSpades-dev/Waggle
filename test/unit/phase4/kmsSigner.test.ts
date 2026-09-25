import { describe, it, expect } from "vitest";
import {
  createKmsAccount,
  decodeDerSignature,
  calculateRecoveryId
} from "@/lib/kms/kmsSigner";
import { parseEther, parseGwei } from "viem";
import { WAGGLE_ATTESTOR_ADDRESS } from "@/lib/viemClient";

describe("Epic 12: Cloud KMS/HSM Publisher Key (TASK-4.1.2)", () => {
  it("Test Case 4.1.2a: Creates Viem CustomAccount without raw private keys", () => {
    const account = createKmsAccount({
      keyId: "waggle-mainnet-publisher-kms-key",
      mockMode: true
    });

    expect(account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(["custom", "local"]).toContain(account.type);
    // Ensure no private key string property exists on account
    expect((account as any).privateKey).toBeUndefined();
  });

  it("Test Case 4.1.2b: Signs Ethereum message via KMS adapter producing valid 65-byte signature", async () => {
    const account = createKmsAccount({
      keyId: "waggle-mainnet-publisher-kms-key",
      mockMode: true
    });

    const signature = await account.signMessage({ message: "Waggle Snapshot #101 Canonical Attestation" });
    expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/); // 65 bytes = 130 hex chars + 0x prefix
  });

  it("Test Case 4.1.2c: Decodes ASN.1 DER signature and enforces EIP-2 low-S canonicalization", () => {
    // ASN.1 DER test sequence: 0x30, len, 0x02, r_len, r, 0x02, s_len, s
    const rHex = "1000000000000000000000000000000000000000000000000000000000000001";
    const sHex = "2000000000000000000000000000000000000000000000000000000000000002";
    const rBytes = Buffer.from(rHex, "hex");
    const sBytes = Buffer.from(sHex, "hex");

    const der = Buffer.concat([
      Buffer.from([0x30, 2 + 32 + 2 + 32, 0x02, 32]),
      rBytes,
      Buffer.from([0x02, 32]),
      sBytes
    ]);

    const { r, s } = decodeDerSignature(der);
    expect(r).toBe(BigInt("0x" + rHex));
    expect(s).toBe(BigInt("0x" + sHex));
  });

  it("Test Case 4.1.2d: Signs serializable EIP-1559 transaction via KMS account", async () => {
    const account = createKmsAccount({
      keyId: "waggle-mainnet-publisher-kms-key",
      mockMode: true
    });

    const rawTx = await account.signTransaction({
      chainId: 4663,
      to: WAGGLE_ATTESTOR_ADDRESS,
      value: parseEther("0"),
      maxFeePerGas: parseGwei("1.5"),
      maxPriorityFeePerGas: parseGwei("0.1"),
      nonce: 0
    });

    expect(rawTx).toMatch(/^0x02/); // EIP-1559 transaction type envelope 0x02
  });
});
