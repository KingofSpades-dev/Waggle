import { NextRequest, NextResponse } from "next/server";
import {
  buildMetricsTree,
  buildReceiptsTree,
  METRIC_LEAF_TYPES,
  RECEIPT_LEAF_TYPES
} from "@/lib/attestation/merkleEngine";
import {
  serializeMetricLeaf,
  serializeReceiptLeaf
} from "@/lib/attestation/canonicalSerializer";
import {
  CANONICAL_SNAPSHOT_METRICS,
  CANONICAL_RECEIPTS
} from "@/lib/attestation/canonicalData";
import { WAGGLE_ATTESTOR_ADDRESS } from "@/lib/viemClient";

// Pre-build trees
const { tree: metricTree, root: canonicalMetricRoot } = buildMetricsTree(CANONICAL_SNAPSHOT_METRICS);
const { tree: receiptTree, root: canonicalReceiptRoot } = buildReceiptsTree(CANONICAL_RECEIPTS);

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const searchParams = request.nextUrl.searchParams;

  const snapshotId = Number(searchParams.get("snapshot_id") || "101");
  const venueKey = (searchParams.get("venue_key") || searchParams.get("venue") || "pons").toLowerCase();
  const metricKey = searchParams.get("metric_key") || "cats_survival_7d";
  const reportHash = searchParams.get("report_hash");
  const forceForge = searchParams.get("forged") === "true";

  // Receipt Leaf flow
  if (reportHash) {
    const receiptIndex = CANONICAL_RECEIPTS.findIndex(
      (r) => r.reportHash.toLowerCase() === reportHash.toLowerCase()
    );

    if (receiptIndex === -1) {
      return NextResponse.json(
        { error: "Receipt report_hash not found in snapshot" },
        { status: 404 }
      );
    }

    const proof = receiptTree.getProof(receiptIndex);
    const leafData = CANONICAL_RECEIPTS[receiptIndex];
    const leafTuple = serializeReceiptLeaf(leafData);

    const latency = Math.round(performance.now() - startTime);

    return NextResponse.json({
      snapshot_id: snapshotId,
      leaf_type: "receipt",
      schema: RECEIPT_LEAF_TYPES,
      leaf_tuple: [leafTuple[0], leafTuple[1].toString(), leafTuple[2]],
      proof,
      merkle_root: forceForge ? "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef" : canonicalReceiptRoot,
      dataset_uri: `https://cdn.waggle.markets/snapshots/snapshot-${snapshotId}.json`,
      ipfs_uri: `https://ipfs.io/ipfs/bafkreihq5waggle${snapshotId}`,
      contract_address: WAGGLE_ATTESTOR_ADDRESS,
      chain_id: 4663,
      forged: forceForge,
      latency_ms: latency
    });
  }

  // Metric Leaf flow
  const metricIndex = CANONICAL_SNAPSHOT_METRICS.findIndex(
    (m) => m.venueKey.toLowerCase() === venueKey && m.metricKey === metricKey
  );

  const targetIndex = metricIndex >= 0 ? metricIndex : 0;
  const targetMetric = CANONICAL_SNAPSHOT_METRICS[targetIndex];
  const leafTuple = serializeMetricLeaf(targetMetric);
  const proof = metricTree.getProof(targetIndex);

  const latency = Math.round(performance.now() - startTime);

  return NextResponse.json({
    snapshot_id: snapshotId,
    leaf_type: "metric",
    schema: METRIC_LEAF_TYPES,
    leaf_tuple: [
      leafTuple[0],
      leafTuple[1].toString(),
      leafTuple[2],
      leafTuple[3],
      leafTuple[4],
      leafTuple[5],
      leafTuple[6],
      leafTuple[7].toString(),
      leafTuple[8]
    ],
    leaf_details: {
      venue_key: targetMetric.venueKey,
      metric_key: targetMetric.metricKey,
      window_hours: targetMetric.windowHours,
      value_fixed: leafTuple[6],
      sample_size: Number(targetMetric.sampleSize),
      metrics_version: targetMetric.metricsVersion
    },
    proof,
    merkle_root: forceForge ? "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef" : canonicalMetricRoot,
    dataset_uri: `https://cdn.waggle.markets/snapshots/snapshot-${snapshotId}.json`,
    ipfs_uri: `https://ipfs.io/ipfs/bafkreihq5waggle${snapshotId}`,
    contract_address: WAGGLE_ATTESTOR_ADDRESS,
    chain_id: 4663,
    forged: forceForge,
    latency_ms: latency
  });
}
