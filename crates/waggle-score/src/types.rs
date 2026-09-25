use alloc::vec::Vec;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct SnapshotHeader {
    pub snapshot_id: u64,
    pub metrics_version: u32,
    pub chain_count: u32,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct ChainHeader {
    pub chain_index: u32,
    pub chain_id: u64,
    pub venue_count: u32,
}

/// Frozen metrics_version 3 field list (section 5).
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct VenueRow {
    pub chain_id: u64,
    pub venue_index: u32,
    pub venue_id: u32,
    pub survival_rate_bps: u32,
    pub median_liq_usd_cents: u64,
    pub extraction_bps: u32,
    pub volume_adj_usd_cents: u64,
    pub hourly_activity_bps: [u32; 24],
}

/// Everything the guest needs to prove a complete, attested snapshot.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SnapshotWitness {
    pub header: SnapshotHeader,
    pub header_proof: Vec<[u8; 32]>,
    pub chains: Vec<ChainHeader>,          // ordered by chain_index
    pub chain_proofs: Vec<Vec<[u8; 32]>>,
    pub rows: Vec<VenueRow>,               // grouped by chain (chain_index order), then venue_index order
    pub row_proofs: Vec<Vec<[u8; 32]>>,
}

/// Features from the published, versioned taxonomy. Ids only, no free text.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Features {
    pub taxonomy_version: u16,
    pub category: u16,
    pub audience: u16,
    pub treasury_band: u16,
}

/// The full weights table. Every tunable parameter of the scorer lives here and is hashed.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Weights {
    pub version: u32,
    pub chain_bps: u32, // e.g. 3500
    pub venue_bps: u32, // e.g. 3000
    pub meta_bps: u32,  // e.g. 2000
    pub hour_bps: u32,  // e.g. 1500
}

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct FitResult {
    pub chain_id: u64,
    pub venue_id: u32,
    pub hour_start_utc: u8,
    pub hour_len: u8,
    pub chain_score_bps: u32,
    pub venue_score_bps: u32,
    pub meta_score_bps: u32,
    pub hour_score_bps: u32,
    pub composite_bps: u32,
    pub confidence_flags: u32,
}

/// Private input of the fit guest.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FitInput {
    pub merkle_root: [u8; 32],
    pub snapshot: SnapshotWitness,
    pub weights: Weights,
    pub features: Features,
    pub salt: [u8; 32],         // generated in the creator's browser
    pub report_nonce: [u8; 32], // random per report
    pub mode: u8,               // MODE_PUBLIC or MODE_PRIVATE
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ScoreError {
    BadWeights,
    UnknownFeature,
    DimensionOutOfRange,
    NoCandidates,
    BadProof,
    Incomplete,
    WrongMetricsVersion,
}

impl Weights {
    pub fn validate(&self) -> Result<(), ScoreError> {
        let sum = self.chain_bps as u64 + self.venue_bps as u64 + self.meta_bps as u64 + self.hour_bps as u64;
        if sum != crate::fixed::BPS { return Err(ScoreError::BadWeights); }
        Ok(())
    }
}
