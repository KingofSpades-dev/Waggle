use alloc::vec::Vec;
use core::cmp::Reverse;

use crate::{dims, fixed::{div_half_up, BPS}, types::*};

pub fn score(w: &SnapshotWitness, f: &Features, weights: &Weights) -> Result<FitResult, ScoreError> {
    weights.validate()?;
    dims::validate_features(f)?;
    if w.header.metrics_version != crate::METRICS_VERSION {
        return Err(ScoreError::WrongMetricsVersion);
    }

    let mut best: Option<FitResult> = None;
    for chain in &w.chains {
        let rows: Vec<&VenueRow> = w.rows.iter().filter(|r| r.chain_id == chain.chain_id).collect();
        let chain_bps = bounded(dims::chain_score(chain, &rows, f))?;

        for row in &rows {
            let venue_bps = bounded(dims::venue_score(row, f))?;
            let meta_bps = bounded(dims::meta_score(chain, row, f))?;
            let (hour_start_utc, hour_len, hour_raw) = dims::hour_window(row, f);
            let hour_bps = bounded(hour_raw)?;

            let cand = FitResult {
                chain_id: chain.chain_id,
                venue_id: row.venue_id,
                hour_start_utc,
                hour_len,
                chain_score_bps: chain_bps,
                venue_score_bps: venue_bps,
                meta_score_bps: meta_bps,
                hour_score_bps: hour_bps,
                composite_bps: composite(chain_bps, venue_bps, meta_bps, hour_bps, weights),
                confidence_flags: dims::confidence_flags(chain, row, f),
            };
            best = match best {
                Some(b) if !beats(&cand, &b) => Some(b),
                _ => Some(cand),
            };
        }
    }
    best.ok_or(ScoreError::NoCandidates)
}

/// Weighted sum in bps. Inputs <= 10_000 and weights sum to 10_000, so the result is <= 10_000.
pub fn composite(c: u32, v: u32, m: u32, h: u32, w: &Weights) -> u32 {
    let sum = c as u64 * w.chain_bps as u64
        + v as u64 * w.venue_bps as u64
        + m as u64 * w.meta_bps as u64
        + h as u64 * w.hour_bps as u64;
    div_half_up(sum, BPS) as u32
}

/// Higher composite wins. Ties: lower chain_id, then lower venue_id, then earlier hour.
fn beats(a: &FitResult, b: &FitResult) -> bool {
    (a.composite_bps, Reverse(a.chain_id), Reverse(a.venue_id), Reverse(a.hour_start_utc))
        > (b.composite_bps, Reverse(b.chain_id), Reverse(b.venue_id), Reverse(b.hour_start_utc))
}

fn bounded(x: u32) -> Result<u32, ScoreError> {
    if x as u64 > BPS { Err(ScoreError::DimensionOutOfRange) } else { Ok(x) }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_composite_single_division() {
        let weights = Weights {
            version: 1,
            chain_bps: 3500,
            venue_bps: 3000,
            meta_bps: 2000,
            hour_bps: 1500,
        };
        // 8000 * 3500 + 7000 * 3000 + 8500 * 2000 + 9000 * 1500
        // = 28000000 + 21000000 + 17000000 + 13500000 = 79500000
        // 79500000 / 10000 = 7950 (79.50%)
        let comp = composite(8000, 7000, 8500, 9000, &weights);
        assert_eq!(comp, 7950);
    }
}
