import { NextResponse } from 'next/server';
import { WEIGHTS, METRICS_VERSION, WEIGHTS_VERSION, CLASSIFIER_VERSION } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json({
    weights: WEIGHTS,
    versions: {
      metrics_version: METRICS_VERSION,
      weights_version: WEIGHTS_VERSION,
      classifier_version: CLASSIFIER_VERSION
    },
    definitions: {
      survival: "Still meeting liquidity and trade thresholds 7 days after launch.",
      extraction: "Share of first minute volume taken by wallets that sell within 30 minutes and hold nothing after.",
      launches_per_day: "Count of launches per chain and venue, daily.",
      adjusted_volume: "Raw volume minus flow matching wash patterns."
    },
    conflict_of_interest_policy: "Waggle never accepts payment from a venue for placement or for a score. No paid scores, ever."
  });
}
