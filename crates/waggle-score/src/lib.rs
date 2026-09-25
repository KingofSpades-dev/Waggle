#![no_std]
extern crate alloc;

pub mod commit;
pub mod dims;
pub mod fixed;
pub mod merkle;
pub mod pv;
pub mod score;
pub mod types;

/// Bumped on any change to scoring logic. Also pinned in the verifier contract config.
pub const SCORER_VERSION: u32 = 3;
/// Snapshot leaf format / metric set this scorer understands.
pub const METRICS_VERSION: u32 = 3;

pub const MODE_PUBLIC: u8 = 0;
pub const MODE_PRIVATE: u8 = 1;
