use alloc::vec::Vec;
use alloy_primitives::{keccak256, B256};
use alloy_sol_types::SolValue;

use crate::types::*;

fn oz_leaf(encoded: &[u8]) -> B256 {
    keccak256(keccak256(encoded))
}

pub fn hash_pair(a: B256, b: B256) -> B256 {
    let (x, y) = if a <= b { (a, b) } else { (b, a) };
    let mut buf = [0u8; 64];
    buf[..32].copy_from_slice(x.as_slice());
    buf[32..].copy_from_slice(y.as_slice());
    keccak256(buf)
}

pub fn verify(root: B256, leaf: B256, proof: &[[u8; 32]]) -> bool {
    let mut h = leaf;
    for p in proof {
        h = hash_pair(h, B256::from(*p));
    }
    h == root
}

pub fn leaf_snapshot_header(h: &SnapshotHeader) -> B256 {
    oz_leaf(&(0u8, h.snapshot_id, h.metrics_version, h.chain_count).abi_encode_params())
}

pub fn leaf_chain_header(snapshot_id: u64, c: &ChainHeader) -> B256 {
    oz_leaf(&(1u8, snapshot_id, c.chain_index, c.chain_id, c.venue_count).abi_encode_params())
}

pub fn leaf_venue_row(snapshot_id: u64, r: &VenueRow) -> B256 {
    oz_leaf(
        &(
            2u8,
            snapshot_id,
            r.chain_id,
            r.venue_index,
            r.venue_id,
            r.survival_rate_bps,
            r.median_liq_usd_cents,
            r.extraction_bps,
            r.volume_adj_usd_cents,
            r.hourly_activity_bps,
        )
            .abi_encode_params(),
    )
}

/// Every leaf is attested under `root` AND no chain or venue row is missing.
pub fn verify_snapshot(root: B256, w: &SnapshotWitness) -> Result<(), ScoreError> {
    let h = &w.header;
    if !verify(root, leaf_snapshot_header(h), &w.header_proof) {
        return Err(ScoreError::BadProof);
    }
    if w.chains.len() != h.chain_count as usize
        || w.chain_proofs.len() != w.chains.len()
        || w.row_proofs.len() != w.rows.len()
    {
        return Err(ScoreError::Incomplete);
    }

    let mut next = 0usize;
    for (i, c) in w.chains.iter().enumerate() {
        if c.chain_index as usize != i {
            return Err(ScoreError::Incomplete);
        }
        if !verify(root, leaf_chain_header(h.snapshot_id, c), &w.chain_proofs[i]) {
            return Err(ScoreError::BadProof);
        }
        for j in 0..c.venue_count as usize {
            let r = w.rows.get(next).ok_or(ScoreError::Incomplete)?;
            if r.chain_id != c.chain_id || r.venue_index as usize != j {
                return Err(ScoreError::Incomplete);
            }
            if !verify(root, leaf_venue_row(h.snapshot_id, r), &w.row_proofs[next]) {
                return Err(ScoreError::BadProof);
            }
            next += 1;
        }
    }
    if next != w.rows.len() {
        return Err(ScoreError::Incomplete);
    }
    Ok(())
}

fn next_layer(layer: &[B256]) -> Vec<B256> {
    layer
        .chunks(2)
        .map(|p| if p.len() == 2 { hash_pair(p[0], p[1]) } else { p[0] })
        .collect()
}

pub fn root_from_leaves(leaves: Vec<B256>) -> B256 {
    assert!(!leaves.is_empty(), "empty tree");
    let mut layer = leaves;
    while layer.len() > 1 {
        layer = next_layer(&layer);
    }
    layer[0]
}

pub fn proof_for(leaves: Vec<B256>, mut idx: usize) -> Vec<B256> {
    let mut proof = Vec::new();
    let mut layer = leaves;
    while layer.len() > 1 {
        let sib = idx ^ 1;
        if sib < layer.len() {
            proof.push(layer[sib]);
        }
        layer = next_layer(&layer);
        idx /= 2;
    }
    proof
}

pub fn batch_leaf(public_values: &[u8]) -> B256 {
    keccak256(keccak256(public_values))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_leaf_encoding_predictable() {
        let h = SnapshotHeader {
            snapshot_id: 105,
            metrics_version: 3,
            chain_count: 1,
        };
        let l0 = leaf_snapshot_header(&h);
        assert_ne!(l0, B256::ZERO);
    }

    #[test]
    fn test_merkle_verify_single_node() {
        let leaf = keccak256(b"test_leaf");
        let root = leaf;
        assert!(verify(root, leaf, &[]));
    }
}
