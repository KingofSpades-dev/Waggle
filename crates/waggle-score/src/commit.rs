use alloy_primitives::{keccak256, B256};
use alloy_sol_types::SolValue;

use crate::types::*;

pub fn weights_hash(w: &Weights) -> B256 {
    keccak256(
        (keccak256("waggle.weights.v1"), w.version, w.chain_bps, w.venue_bps, w.meta_bps, w.hour_bps)
            .abi_encode_params(),
    )
}

pub fn features_commitment(f: &Features, salt: &[u8; 32]) -> B256 {
    keccak256(
        (
            keccak256("waggle.features.v1"),
            f.taxonomy_version,
            f.category,
            f.audience,
            f.treasury_band,
            B256::from(*salt),
        )
            .abi_encode_params(),
    )
}

pub fn result_commitment(r: &FitResult, salt: &[u8; 32]) -> B256 {
    keccak256(
        (
            keccak256("waggle.result.v1"),
            r.chain_id,
            r.venue_id,
            r.hour_start_utc,
            r.hour_len,
            r.chain_score_bps,
            r.venue_score_bps,
            r.meta_score_bps,
            r.hour_score_bps,
            r.composite_bps,
            r.confidence_flags,
            B256::from(*salt),
        )
            .abi_encode_params(),
    )
}

pub fn report_id(snapshot_id: u64, features_commitment: B256, nonce: &[u8; 32]) -> B256 {
    keccak256((keccak256("waggle.report.v1"), snapshot_id, features_commitment, B256::from(*nonce)).abi_encode_params())
}

pub fn pack_vkey(v: &[u32; 8]) -> B256 {
    let mut b = [0u8; 32];
    for (i, w) in v.iter().enumerate() {
        b[i * 4..i * 4 + 4].copy_from_slice(&w.to_be_bytes());
    }
    B256::from(b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_features_commitment_salted() {
        let f = Features {
            taxonomy_version: 1,
            category: 4,
            audience: 2,
            treasury_band: 3,
        };
        let salt1 = [1u8; 32];
        let salt2 = [2u8; 32];
        let fc1 = features_commitment(&f, &salt1);
        let fc2 = features_commitment(&f, &salt2);
        assert_ne!(fc1, fc2);
        assert_ne!(fc1, B256::ZERO);
    }
}
