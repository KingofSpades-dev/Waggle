import { NextResponse } from 'next/server';
import { getLiveDatabaseMetrics } from '@/lib/dbMetrics';

export async function GET() {
  try {
    const dbMetrics = await getLiveDatabaseMetrics();
    return NextResponse.json({
      data: dbMetrics.chains.map(c => ({
        name: c.name,
        key: c.key,
        hue: c.hue,
        data_sources: c.dataSources,
        confidence: c.conf,
        sample_size: c.launchesCount,
        survival_rate: c.survivalRate,
        is_covered: true
      })),
      snapshot_id: dbMetrics.snapshotId,
      updated_at: dbMetrics.systemTime
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { code: "SERVER_ERROR", message: error.message || "Failed to fetch chains from DB." },
      { status: 500 }
    );
  }
}
