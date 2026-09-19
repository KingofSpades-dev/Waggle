import { NextResponse } from 'next/server';
import { scoutProject } from '@/lib/scorer';
import { AnalyseRequestBody } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body: AnalyseRequestBody = await request.json();
    if (!body.description && !body.url) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "Please provide a description or URL of what you are launching." },
        { status: 400 }
      );
    }

    const report = await scoutProject(body);
    return NextResponse.json(report, { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { code: "SERVER_ERROR", message: error.message || "Failed to process analysis request." },
      { status: 500 }
    );
  }
}
