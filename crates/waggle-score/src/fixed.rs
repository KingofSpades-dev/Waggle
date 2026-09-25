pub const BPS: u64 = 10_000;

/// round(num / den), halves round up. Non-negative integers only.
#[inline]
pub fn div_half_up(num: u64, den: u64) -> u64 {
    assert!(den > 0, "division by zero");
    let n = num as u128;
    let d = den as u128;
    ((n + d / 2) / d) as u64
}

/// round(a * b / den), halves round up, no intermediate overflow.
#[inline]
pub fn mul_div_half_up(a: u64, b: u64, den: u64) -> u64 {
    assert!(den > 0, "division by zero");
    let n = (a as u128) * (b as u128);
    let d = den as u128;
    ((n + d / 2) / d) as u64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_div_half_up_exact() {
        assert_eq!(div_half_up(100, 10), 10);
        assert_eq!(div_half_up(0, 10), 0);
    }

    #[test]
    fn test_div_half_up_rounding() {
        // 5 / 2 = 2.5 -> rounds up to 3
        assert_eq!(div_half_up(5, 2), 3);
        // 4 / 2 = 2.0 -> 2
        assert_eq!(div_half_up(4, 2), 2);
        // 1 / 3 = 0.333... -> rounds down to 0
        assert_eq!(div_half_up(1, 3), 0);
        // 2 / 3 = 0.666... -> rounds up to 1
        assert_eq!(div_half_up(2, 3), 1);
    }

    #[test]
    fn test_mul_div_half_up() {
        // (7500 * 3500 + 5000) / 10000 = (26250000 + 5000) / 10000 = 2625
        assert_eq!(mul_div_half_up(7500, 3500, BPS), 2625);
    }
}
