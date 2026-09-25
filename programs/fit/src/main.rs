#![no_main]
sp1_zkvm::entrypoint!(main);

use alloy_primitives::B256;
use alloy_sol_types::SolValue;
use waggle_score::{
    commit::{features_commitment, report_id, result_commitment, weights_hash},
    merkle::verify_snapshot,
    pv::FitPublicValues,
    score::score,
    types::{FitInput, FitResult},
    MODE_PRIVATE, MODE_PUBLIC, SCORER_VERSION,
};

pub fn main() {
    let input: FitInput = sp1_zkvm::io::read();
    assert!(input.mode == MODE_PUBLIC || input.mode == MODE_PRIVATE, "bad mode");

    // 1. Every row is attested under merkle_root and none is missing.
    let root = B256::from(input.merkle_root);
    verify_snapshot(root, &input.snapshot).expect("snapshot witness invalid");

    // 2. Score complete universe & select best candidate.
    let result = score(&input.snapshot, &input.features, &input.weights).expect("scoring failed");

    // 3. Commitments computed from the exact inputs that were scored.
    let fc = features_commitment(&input.features, &input.salt);
    let snapshot_id = input.snapshot.header.snapshot_id;
    let rid = report_id(snapshot_id, fc, &input.report_nonce);

    let private = input.mode == MODE_PRIVATE;
    let rc = if private { result_commitment(&result, &input.salt) } else { B256::ZERO };
    let shown = if private { FitResult::default() } else { result };

    let pv = FitPublicValues {
        reportId: rid,
        mode: input.mode,
        snapshotId: snapshot_id,
        merkleRoot: root,
        metricsVersion: input.snapshot.header.metrics_version,
        weightsVersion: input.weights.version,
        scorerVersion: SCORER_VERSION,
        weightsHash: weights_hash(&input.weights),
        featuresCommitment: fc,
        resultCommitment: rc,
        chainId: shown.chain_id,
        venueId: shown.venue_id,
        hourStartUtc: shown.hour_start_utc,
        hourLen: shown.hour_len,
        chainScoreBps: shown.chain_score_bps,
        venueScoreBps: shown.venue_score_bps,
        metaScoreBps: shown.meta_score_bps,
        hourScoreBps: shown.hour_score_bps,
        compositeBps: shown.composite_bps,
        confidenceFlags: shown.confidence_flags,
    };
    sp1_zkvm::io::commit_slice(&pv.abi_encode());
}
