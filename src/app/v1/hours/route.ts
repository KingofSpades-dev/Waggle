import { NextResponse } from 'next/server';
import { getLiveDatabaseMetrics } from '@/lib/dbMetrics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain') || 'sol';

    const dbMetrics = await getLiveDatabaseMetrics();
    const chainData = dbMetrics.matrixData[chain];

    if (!chainData) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: `Chain '${chain}' is not found or has no active collector.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      chain,
      metrics: chainData,
      snapshot_id: dbMetrics.snapshotId,
      updated_at: dbMetrics.systemTime
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { code: "SERVER_ERROR", message: error.message || "Failed to fetch hourly metrics from DB." },
      { status: 500 }
    );
  }
}
