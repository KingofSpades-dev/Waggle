import { NextResponse } from 'next/server';
import { streamManager } from '@/lib/streamManager';

export async function GET() {
  try {
    const snapshot = streamManager.getSnapshot();
    return NextResponse.json({
      success: true,
      total_launches: snapshot.total_launches,
      events: snapshot.events,
      collectors: snapshot.collectors,
      timestamp: snapshot.timestamp,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

