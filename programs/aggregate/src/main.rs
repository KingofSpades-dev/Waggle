#![no_main]
sp1_zkvm::entrypoint!(main);

use alloy_sol_types::SolValue;
use sha2::{Digest, Sha256};
use waggle_score::{
    commit::pack_vkey,
    merkle::{batch_leaf, root_from_leaves},
    pv::{BatchPublicValues, FitPublicValues},
};

pub fn main() {
    let fit_vkey: [u32; 8] = sp1_zkvm::io::read();       // vk.hash_u32() of the fit program
    let reports: Vec<Vec<u8>> = sp1_zkvm::io::read();    // public values of each fit proof
    assert!(!reports.is_empty(), "empty batch");

    let first = FitPublicValues::abi_decode(&reports[0]).expect("decode");
    let mut leaves = Vec::with_capacity(reports.len());

    for pv in &reports {
        let digest: [u8; 32] = Sha256::digest(pv).into();
        sp1_zkvm::lib::verify::verify_sp1_proof(&fit_vkey, &digest);

        let d = FitPublicValues::abi_decode(pv).expect("decode");
        assert!(
            d.snapshotId == first.snapshotId
                && d.merkleRoot == first.merkleRoot
                && d.weightsVersion == first.weightsVersion
                && d.weightsHash == first.weightsHash
                && d.scorerVersion == first.scorerVersion,
            "mixed batch"
        );
        leaves.push(batch_leaf(pv));
    }

    let out = BatchPublicValues {
        fitVkeyDigest: pack_vkey(&fit_vkey),
        snapshotId: first.snapshotId,
        merkleRoot: first.merkleRoot,
        weightsVersion: first.weightsVersion,
        weightsHash: first.weightsHash,
        scorerVersion: first.scorerVersion,
        count: reports.len() as u32,
        reportsRoot: root_from_leaves(leaves),
    };
    sp1_zkvm::io::commit_slice(&out.abi_encode());
}
