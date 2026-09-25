/**
 * Waggle Canonical Serializer
 * Implements RFC 8785 JSON Canonicalization Scheme (JCS) principles
 * and deterministic fixed-point formatting to prevent floating-point drift.
 */

export interface MetricLeafData {
  snapshotId: number | bigint | string;
  chainKey: string;
  venueKey: string;
  metricKey: string;
  windowHours: number;
  value: number | string | bigint;
  sampleSize: number | bigint;
  metricsVersion: number;
}

export interface ReceiptLeafData {
  anchoredSnapshotId: number | bigint | string;
  reportHash: `0x${string}` | string;
}

export type MetricLeafTuple = [
  string,  // leafType: "WAGGLE_METRIC_V1"
  bigint,  // snapshotId (uint64)
  string,  // chainKey
  string,  // venueKey
  string,  // metricKey
  number,  // windowHours (uint32)
  string,  // valueFixedStr
  bigint,  // sampleSize (uint64)
  number   // metricsVersion (uint32)
];

export type ReceiptLeafTuple = [
  string,              // leafType: "WAGGLE_RECEIPT_V1"
  bigint,              // anchoredSnapshotId (uint64)
  `0x${string}` | string // reportHash (bytes32)
];

export const METRIC_LEAF_TYPE_TAG = "WAGGLE_METRIC_V1";
export const RECEIPT_LEAF_TYPE_TAG = "WAGGLE_RECEIPT_V1";

/**
 * Deterministically formats a numeric value into a fixed-decimal string
 * without scientific notation or floating-point rounding ambiguity.
 * Default precision: 6 decimal places.
 */
export function toFixedDecimals(val: number | string | bigint, decimals: number = 6): string {
  if (typeof val === 'bigint') {
    return decimals > 0 ? `${val.toString()}.${'0'.repeat(decimals)}` : val.toString();
  }

  const strVal = typeof val === 'number' ? val.toString() : String(val).trim();
  
  if (isNaN(Number(strVal))) {
    throw new Error(`Cannot format invalid numeric value: "${val}"`);
  }

  // Handle scientific notation (e.g. 1e-5 or 2.5e+3)
  if (strVal.includes('e') || strVal.includes('E')) {
    const num = Number(strVal);
    return num.toFixed(decimals);
  }

  const parts = strVal.split('.');
  const integerPart = parts[0] || '0';
  let decimalPart = parts[1] || '';

  if (decimals === 0) {
    return integerPart;
  }

  if (decimalPart.length < decimals) {
    decimalPart = decimalPart.padEnd(decimals, '0');
  } else if (decimalPart.length > decimals) {
    decimalPart = decimalPart.slice(0, decimals);
  }

  return `${integerPart}.${decimalPart}`;
}

/**
 * Canonical JSON serialization (RFC 8785)
 * - Object keys are sorted lexicographically by UTF-16 code units.
 * - Whitespace is completely omitted outside of strings.
 * - Preserves deterministic serialization across diverse execution environments.
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'bigint') {
      return `"${obj.toString()}"`;
    }
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const elements = obj.map((item) => canonicalizeJson(item));
    return `[${elements.join(',')}]`;
  }

  // Record/Object: sort keys lexicographically
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return `${JSON.stringify(key)}:${canonicalizeJson(val)}`;
  });

  return `{${pairs.join(',')}}`;
}

/**
 * Serializes a metric record into the canonical leaf tuple format for StandardMerkleTree.
 */
export function serializeMetricLeaf(data: MetricLeafData): MetricLeafTuple {
  const valueFixedStr = toFixedDecimals(data.value, 6);
  return [
    METRIC_LEAF_TYPE_TAG,
    BigInt(data.snapshotId),
    String(data.chainKey).toLowerCase(),
    String(data.venueKey).toLowerCase(),
    String(data.metricKey),
    Number(data.windowHours),
    valueFixedStr,
    BigInt(data.sampleSize),
    Number(data.metricsVersion)
  ];
}

/**
 * Serializes a report receipt record into the canonical leaf tuple format for StandardMerkleTree.
 */
export function serializeReceiptLeaf(data: ReceiptLeafData): ReceiptLeafTuple {
  let hash = data.reportHash;
  if (!hash.startsWith('0x')) {
    hash = `0x${hash}`;
  }
  return [
    RECEIPT_LEAF_TYPE_TAG,
    BigInt(data.anchoredSnapshotId),
    hash as `0x${string}`
  ];
}
