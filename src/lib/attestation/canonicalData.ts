import { MetricLeafData, ReceiptLeafData } from "./canonicalSerializer";

// Canonical snapshot dataset for Robinhood Chain metrics
export const CANONICAL_SNAPSHOT_METRICS: MetricLeafData[] = [
  {
    snapshotId: 101,
    chainKey: "rh",
    venueKey: "pons",
    metricKey: "cats_survival_7d",
    windowHours: 168,
    value: 42.857142,
    sampleSize: 140,
    metricsVersion: 1
  },
  {
    snapshotId: 101,
    chainKey: "rh",
    venueKey: "pools_trade",
    metricKey: "cats_survival_7d",
    windowHours: 168,
    value: 38.120000,
    sampleSize: 85,
    metricsVersion: 1
  },
  {
    snapshotId: 101,
    chainKey: "rh",
    venueKey: "hood_fun",
    metricKey: "cats_survival_7d",
    windowHours: 168,
    value: 12.500000,
    sampleSize: 24,
    metricsVersion: 1
  },
  {
    snapshotId: 101,
    chainKey: "rh",
    venueKey: "flap",
    metricKey: "cats_survival_7d",
    windowHours: 168,
    value: 55.000000,
    sampleSize: 40,
    metricsVersion: 1
  },
  {
    snapshotId: 101,
    chainKey: "rh",
    venueKey: "loot",
    metricKey: "cats_survival_7d",
    windowHours: 168,
    value: 20.000000,
    sampleSize: 15,
    metricsVersion: 1
  }
];

export const CANONICAL_RECEIPTS: ReceiptLeafData[] = [
  {
    anchoredSnapshotId: 101,
    reportHash: "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff"
  }
];

export const CANONICAL_METRIC_ROOT = "0xde86fdb87c3bc783e5a01380f8e6c3a0501712fbb3aafd391de2aa6c502f0003";
