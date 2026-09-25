// dims.rs — Dimension scoring formulas
// Each function is a 1:1 integer port of the TS function, converted using fixed::div_half_up / mul_div_half_up.
// Returns values in range 0..=10_000 bps.
use crate::{fixed::{div_half_up, mul_div_half_up, BPS}, types::*};

pub const FLAG_LOW_SAMPLE: u32 = 1 << 0;
pub const FLAG_STALE_VENUE: u32 = 1 << 1;

pub fn validate_features(f: &Features) -> Result<(), ScoreError> {
    if f.taxonomy_version == 0 || f.category == 0 {
        return Err(ScoreError::UnknownFeature);
    }
    Ok(())
}

pub fn chain_score(_c: &ChainHeader, rows: &[&VenueRow], _f: &Features) -> u32 {
    if rows.is_empty() {
        return 0;
    }
    let mut total_survival: u64 = 0;
    for r in rows {
        total_survival += r.survival_rate_bps as u64;
    }
    div_half_up(total_survival, rows.len() as u64) as u32
}

pub fn venue_score(r: &VenueRow, _f: &Features) -> u32 {
    let s = r.survival_rate_bps as u64;
    let ext_penalty = if r.extraction_bps > 2000 {
        r.extraction_bps as u64 - 2000
    } else {
        0
    };
    if s > ext_penalty {
        (s - ext_penalty) as u32
    } else {
        0
    }
}

pub fn meta_score(c: &ChainHeader, r: &VenueRow, f: &Features) -> u32 {
    let mut score_bps: u64 = 7000;
    if c.chain_id == 4663 {
        score_bps += 1500;
    }
    if f.category == 4 { // DeFi category boost
        score_bps += 1000;
    }
    if r.median_liq_usd_cents >= 100_000_00 { // >= $100k
        score_bps += 500;
    }
    if score_bps > BPS {
        BPS as u32
    } else {
        score_bps as u32
    }
}

/// Returns (hour_start_utc, hour_len, score_bps).
pub fn hour_window(r: &VenueRow, _f: &Features) -> (u8, u8, u32) {
    let mut max_act: u32 = 0;
    let mut best_hour: u8 = 0;
    for (i, &act) in r.hourly_activity_bps.iter().enumerate() {
        if act > max_act {
            max_act = act;
            best_hour = i as u8;
        }
    }
    let window_score = if max_act > 0 {
        div_half_up(max_act as u64 * 10_000, 1000) as u32
    } else {
        5000
    };
    let final_bps = if window_score > BPS as u32 { BPS as u32 } else { window_score };
    (best_hour, 4, final_bps)
}

pub fn confidence_flags(_c: &ChainHeader, r: &VenueRow, _f: &Features) -> u32 {
    let mut flags = 0u32;
    if r.volume_adj_usd_cents < 10_000_00 {
        flags |= FLAG_LOW_SAMPLE;
    }
    if r.survival_rate_bps < 3000 {
        flags |= FLAG_STALE_VENUE;
    }
    flags
}
