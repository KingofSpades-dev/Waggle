#!/usr/bin/env bash
set -euo pipefail

echo "==> Running CI Lint: Grep for bare division '/' operator in dims.rs and score.rs..."

# Match bare '/' division between identifiers or numbers, excluding comments (//)
MATCHES=$(grep -nE "[a-zA-Z0-9_)]\s*/\s*[a-zA-Z0-9_(]" \
  crates/waggle-score/src/dims.rs \
  crates/waggle-score/src/score.rs | grep -v "//" || true)

if [ -n "$MATCHES" ]; then
  echo "❌ ERROR: Found bare division '/' operator in dims.rs or score.rs!"
  echo "All division operations MUST use div_half_up() or mul_div_half_up() from fixed.rs."
  echo "Offending lines:"
  echo "$MATCHES"
  exit 1
fi

echo "✅ SUCCESS: Zero bare division '/' operators found. All divisions use fixed-point half-up functions."
