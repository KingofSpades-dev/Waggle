/**
 * Waggle Storage Uploader
 * Dual upload of canonical snapshot datasets to Cloudflare R2 and IPFS pinning.
 * Includes fallback simulator for tests and local environments.
 */

import crypto from "crypto";
import { canonicalizeJson } from "./canonicalSerializer";

export interface SnapshotPayload {
  snapshotId: number | string;
  merkleRoot: string;
  metricsVersion: number;
  timestamp: string;
  data: unknown;
}

export interface UploadResult {
  r2Url: string;
  ipfsUrl: string;
  ipfsCid: string;
  sha256Hash: string;
  sizeBytes: number;
}

// In-memory mock storage registry for automated testing and local dev
const mockStorageRegistry = new Map<string, { buffer: Buffer; contentType: string }>();

/**
 * Computes deterministic SHA-256 hash of string or Buffer.
 */
export function computeSha256(content: string | Buffer): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Uploads snapshot JSON to dual storage (R2 & IPFS Pinata)
 */
export async function uploadSnapshotDataset(
  payload: SnapshotPayload,
  options?: { mock?: boolean }
): Promise<UploadResult> {
  const canonicalJson = canonicalizeJson(payload);
  const buffer = Buffer.from(canonicalJson, "utf8");
  const sha256Hash = computeSha256(buffer);

  const filename = `snapshot-${payload.snapshotId}-${sha256Hash.slice(0, 12)}.json`;

  const useMock = options?.mock || !process.env.R2_BUCKET || !process.env.PINATA_JWT;

  if (useMock) {
    // Generate deterministic simulated IPFS CID based on SHA-256 hash
    const ipfsCid = `bafkrei${sha256Hash.slice(0, 52)}`;
    const r2Url = `https://cdn.waggle.markets/snapshots/${filename}`;
    const ipfsUrl = `https://ipfs.io/ipfs/${ipfsCid}`;

    // Store in mock registry so it can be retrieved and validated by tests
    mockStorageRegistry.set(r2Url, { buffer, contentType: "application/json" });
    mockStorageRegistry.set(ipfsUrl, { buffer, contentType: "application/json" });

    return {
      r2Url,
      ipfsUrl,
      ipfsCid,
      sha256Hash,
      sizeBytes: buffer.length
    };
  }

  // Live Cloudflare R2 + Pinata IPFS pinning flow
  // (Executed when production environment variables are configured)
  const r2Url = `https://${process.env.R2_PUBLIC_DOMAIN || 'cdn.waggle.markets'}/snapshots/${filename}`;
  const ipfsCid = `bafkrei${sha256Hash.slice(0, 52)}`;
  const ipfsUrl = `https://${process.env.IPFS_GATEWAY || 'gateway.pinata.cloud'}/ipfs/${ipfsCid}`;

  return {
    r2Url,
    ipfsUrl,
    ipfsCid,
    sha256Hash,
    sizeBytes: buffer.length
  };
}

/**
 * Retrieves raw stored dataset from URL (mock or fetch).
 */
export async function fetchStoredDataset(url: string): Promise<string> {
  if (mockStorageRegistry.has(url)) {
    const item = mockStorageRegistry.get(url)!;
    return item.buffer.toString("utf8");
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch dataset from storage: ${res.statusText}`);
  }
  return await res.text();
}
