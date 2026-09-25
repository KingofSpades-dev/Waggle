import crypto from "crypto";
import { type Hex } from "viem";

export type IdempotencyState = "INITIATED" | "GENERATED" | "SETTLING" | "SETTLED" | "FAILED";

export interface IdempotencyRecord {
  idempotencyKey: Hex;
  clientAddress: string;
  state: IdempotencyState;
  createdAt: number;
  updatedAt: number;
  encryptedReportPayload?: string;
  txHash?: Hex;
  failureReason?: string;
}

export class IdempotencyManager {
  private records: Map<string, IdempotencyRecord> = new Map();
  private locks: Set<string> = new Set();
  private secretKey: Buffer = crypto.scryptSync(
    process.env.IDEMPOTENCY_SECRET || "waggle_v2_internal_report_encryption_secret_2026",
    "waggle_salt",
    32
  );

  /**
   * Encrypts report payload with AES-256-GCM.
   */
  public encryptPayload(payload: unknown): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.secretKey, iv);
    const jsonStr = JSON.stringify(payload);
    const encrypted = Buffer.concat([cipher.update(jsonStr, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString("hex");
  }

  /**
   * Decrypts report payload.
   */
  public decryptPayload<T>(encryptedHex: string): T {
    const raw = Buffer.from(encryptedHex, "hex");
    const iv = raw.slice(0, 12);
    const tag = raw.slice(12, 28);
    const encrypted = raw.slice(28);

    const decipher = crypto.createDecipheriv("aes-256-gcm", this.secretKey, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
  }

  /**
   * Acquires atomic lock (SET NX simulation) on an idempotency key.
   */
  public acquireLock(key: Hex): boolean {
    const normalizedKey = key.toLowerCase();
    if (this.locks.has(normalizedKey)) {
      return false; // Concurrency conflict
    }
    this.locks.add(normalizedKey);
    return true;
  }

  /**
   * Releases atomic lock.
   */
  public releaseLock(key: Hex): void {
    this.locks.delete(key.toLowerCase());
  }

  /**
   * Registers a new request with state INITIATED.
   */
  public initRecord(key: Hex, clientAddress: string): IdempotencyRecord {
    const record: IdempotencyRecord = {
      idempotencyKey: key,
      clientAddress,
      state: "INITIATED",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.records.set(key.toLowerCase(), record);
    return record;
  }

  /**
   * Updates state of an existing record.
   */
  public transitionState(
    key: Hex,
    newState: IdempotencyState,
    extra?: { encryptedPayload?: string; txHash?: Hex; failureReason?: string }
  ): IdempotencyRecord {
    const record = this.records.get(key.toLowerCase());
    if (!record) {
      throw new Error(`Record for idempotency key ${key} not found`);
    }

    record.state = newState;
    record.updatedAt = Date.now();
    if (extra?.encryptedPayload) record.encryptedReportPayload = extra.encryptedPayload;
    if (extra?.txHash) record.txHash = extra.txHash;
    if (extra?.failureReason) record.failureReason = extra.failureReason;

    return record;
  }

  /**
   * Retrieves record by key.
   */
  public getRecord(key: Hex): IdempotencyRecord | undefined {
    return this.records.get(key.toLowerCase());
  }

  /**
   * Returns all records (for recovery scanning).
   */
  public getAllRecords(): IdempotencyRecord[] {
    return Array.from(this.records.values());
  }
}

export const idempotencyManager = new IdempotencyManager();
