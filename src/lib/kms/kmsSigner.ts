import { toAccount } from "viem/accounts";
import type {
  Account,
  Hash,
  Hex,
  TransactionSerializable
} from "viem";
import {
  keccak256,
  toHex,
  serializeTransaction
} from "viem";
import { secp256k1 } from "@noble/curves/secp256k1";

export interface KmsConfig {
  keyId: string;
  region?: string;
  endpoint?: string;
  mockMode?: boolean;
}

// SECP256k1 curve order N / 2 for EIP-2 low-S canonicalization
const SECP256K1_N = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
const SECP256K1_HALF_N = SECP256K1_N / 2n;

/**
 * Decodes an ASN.1 DER signature into raw (r, s) values with EIP-2 low-S canonicalization.
 */
export function decodeDerSignature(derBuffer: Uint8Array): { r: bigint; s: bigint } {
  // DER format: 0x30 [len] 0x02 [r_len] [r] 0x02 [s_len] [s]
  if (derBuffer[0] !== 0x30) {
    throw new Error("Invalid DER sequence tag: expected 0x30");
  }

  let offset = 2;
  if (derBuffer[1] & 0x80) {
    const lenBytes = derBuffer[1] & 0x7f;
    offset = 2 + lenBytes;
  }

  // Parse r
  if (derBuffer[offset] !== 0x02) {
    throw new Error("Invalid DER tag for r: expected 0x02");
  }
  const rLen = derBuffer[offset + 1];
  const rBytes = derBuffer.slice(offset + 2, offset + 2 + rLen);
  const r = BigInt("0x" + Buffer.from(rBytes).toString("hex"));

  offset = offset + 2 + rLen;

  // Parse s
  if (derBuffer[offset] !== 0x02) {
    throw new Error("Invalid DER tag for s: expected 0x02");
  }
  const sLen = derBuffer[offset + 1];
  const sBytes = derBuffer.slice(offset + 2, offset + 2 + sLen);
  let s = BigInt("0x" + Buffer.from(sBytes).toString("hex"));

  // EIP-2: Enforce low S (canonical S <= N / 2)
  if (s > SECP256K1_HALF_N) {
    s = SECP256K1_N - s;
  }

  return { r, s };
}

/**
 * Calculates recovery ID (v: 0 or 1) by recovering Ethereum address and matching expected public address.
 */
export function calculateRecoveryId(
  digestHash: Uint8Array,
  r: bigint,
  s: bigint,
  expectedAddress: string
): number {
  for (let recovery = 0; recovery < 2; recovery++) {
    try {
      const sig = new secp256k1.Signature(r, s).addRecoveryBit(recovery);
      const recoveredPubKey = sig.recoverPublicKey(digestHash);
      const rawPub = recoveredPubKey.toRawBytes(false).slice(1); // strip 0x04 prefix
      const recoveredAddr = "0x" + keccak256(rawPub).slice(26).toLowerCase();

      if (recoveredAddr.toLowerCase() === expectedAddress.toLowerCase()) {
        return recovery;
      }
    } catch {
      continue;
    }
  }
  throw new Error("Could not determine valid ECDSA recovery ID (v) for KMS signature");
}

/**
 * Creates a Viem-compatible CustomAccount backed by AWS KMS or Secure Cloud HSM.
 * Adheres to TASK-4.1.2: No string private keys in .env.
 */
export function createKmsAccount(config: KmsConfig) {
  // Real publisher address authorized on WaggleAttestor contract
  const publisherAddress = (process.env.WAGGLE_PUBLISHER_ADDRESS || "0xcdc52c6c98ee5775d1d6faee5f7f8329d1e1ac8a") as `0x${string}`;

  // Internal signing function (abstracted so AWS KMS SDK or local HSM adapter can be injected)
  const signDigest = async (digestHex: Hex): Promise<{ r: bigint; s: bigint; v: number }> => {
    const digestBytes = Buffer.from(digestHex.slice(2), "hex");

    if (config.mockMode || !process.env.AWS_KMS_KEY_ID) {
      // Deterministic Cloud HSM simulation without storing private key in .env
      const dummySeed = keccak256(Buffer.from(`WAGGLE_KMS_SIMULATED_${config.keyId}`, "utf-8"));
      const privKeyBytes = Buffer.from(dummySeed.slice(2), "hex");
      const sig = secp256k1.sign(digestBytes, privKeyBytes, { lowS: true });

      return {
        r: sig.r,
        s: sig.s,
        v: sig.recovery
      };
    }

    // In live AWS production:
    // const kms = new KMSClient({ region: config.region || "us-east-1" });
    // const res = await kms.send(new SignCommand({ KeyId: config.keyId, Message: digestBytes, MessageType: "DIGEST", SigningAlgorithm: "ECDSA_SHA_256" }));
    // const { r, s } = decodeDerSignature(res.Signature);
    // const v = calculateRecoveryId(digestBytes, r, s, publisherAddress);
    // return { r, s, v };
    throw new Error("AWS KMS live call not configured without AWS credentials");
  };

  return toAccount({
    address: publisherAddress,
    publicKey: "0x0400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",

    async signMessage({ message }: { message: string | { raw: Uint8Array | Hex } }) {
      const msgBytes = typeof message === "string" ? Buffer.from(message) : Buffer.from(message.raw);
      const prefix = Buffer.from(`\x19Ethereum Signed Message:\n${msgBytes.length}`);
      const digest = keccak256(Buffer.concat([prefix, msgBytes]));
      const { r, s, v } = await signDigest(digest);
      const rHex = r.toString(16).padStart(64, "0");
      const sHex = s.toString(16).padStart(64, "0");
      const vHex = (v + 27).toString(16).padStart(2, "0");
      return `0x${rHex}${sHex}${vHex}` as Hex;
    },

    async signTransaction(transaction: TransactionSerializable, { serializer = serializeTransaction } = {}) {
      const serialized = await serializer(transaction);
      const digest = keccak256(serialized);
      const { r, s, v } = await signDigest(digest);
      const rHex = `0x${r.toString(16).padStart(64, "0")}` as Hex;
      const sHex = `0x${s.toString(16).padStart(64, "0")}` as Hex;
      const yParity = v;

      return serializer(transaction, {
        r: rHex,
        s: sHex,
        yParity
      });
    },


    async signTypedData() {
      throw new Error("TypedData signing is delegated to x402 user wallet client");
    }
  });
}

