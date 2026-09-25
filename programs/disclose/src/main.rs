#![no_main]
sp1_zkvm::entrypoint!(main);

use alloy_primitives::keccak256;
use alloy_sol_types::SolValue;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use waggle_score::{
    commit::{features_commitment, pack_vkey, result_commitment},
    pv::{DisclosurePublicValues, FitPublicValues},
    types::{Features, FitResult},
    MODE_PRIVATE,
};

#[derive(Serialize, Deserialize)]
pub struct Claim {
    pub min_composite_bps: Option<u32>, // "composite >= 75.00" -> Some(7500)
    pub chain_id: Option<u64>,          // "recommended chain is Robinhood Chain" -> Some(4663)
    pub min_snapshot_id: Option<u64>,   // "scored against snapshot N or later"
}

pub fn main() {
    let fit_vkey: [u32; 8] = sp1_zkvm::io::read();
    let fit_pv: Vec<u8> = sp1_zkvm::io::read();
    let features: Features = sp1_zkvm::io::read();
    let result: FitResult = sp1_zkvm::io::read();
    let salt: [u8; 32] = sp1_zkvm::io::read();
    let claim: Claim = sp1_zkvm::io::read();

    // 1. The private fit proof is valid.
    let digest: [u8; 32] = Sha256::digest(&fit_pv).into();
    sp1_zkvm::lib::verify::verify_sp1_proof(&fit_vkey, &digest);
    let pv = FitPublicValues::abi_decode(&fit_pv).expect("decode");
    assert!(pv.mode == MODE_PRIVATE, "not a private report");

    // 2. The discloser knows the opening.
    assert!(features_commitment(&features, &salt) == pv.featuresCommitment, "features mismatch");
    assert!(result_commitment(&result, &salt) == pv.resultCommitment, "result mismatch");

    // 3. Selective statement assertions.
    if let Some(min) = claim.min_composite_bps { assert!(result.composite_bps >= min, "composite statement failed"); }
    if let Some(c) = claim.chain_id { assert!(result.chain_id == c, "chain statement failed"); }
    if let Some(s) = claim.min_snapshot_id { assert!(pv.snapshotId >= s, "snapshot statement failed"); }

    let out = DisclosurePublicValues {
        fitVkeyDigest: pack_vkey(&fit_vkey),
        reportId: pv.reportId,
        fitPublicValuesHash: keccak256(&fit_pv),
        minCompositeBps: claim.min_composite_bps.unwrap_or(0),
        claimsChain: claim.chain_id.is_some(),
        chainId: claim.chain_id.unwrap_or(0),
        minSnapshotId: claim.min_snapshot_id.unwrap_or(0),
    };
    sp1_zkvm::io::commit_slice(&out.abi_encode());
}
