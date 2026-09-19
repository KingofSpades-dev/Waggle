import { NextResponse } from 'next/server';
import { getLiveDatabaseMetrics } from '@/lib/dbMetrics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chainFilter = searchParams.get('chain');

    const dbMetrics = await getLiveDatabaseMetrics();
    let data = dbMetrics.venues;

    if (chainFilter) {
      data = data.filter(v => v.chainKey.toLowerCase() === chainFilter.toLowerCase());
    }

    return NextResponse.json({
      data: data.map(v => ({
        name: v.name,
        key: v.key,
        chain: v.chainKey,
        curve_type: v.curveType,
        launches_count: v.launchesCount,
        survival_rate_pct: v.survivalRatePct,
        avg_initial_liquidity_usd: v.avgInitialLiquidityUsd,
        extraction_pct: v.extractionPct
      })),
      snapshot_id: dbMetrics.snapshotId,
      updated_at: dbMetrics.systemTime
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { code: "SERVER_ERROR", message: error.message || "Failed to fetch venues from DB." },
      { status: 500 }
    );
  }
}
