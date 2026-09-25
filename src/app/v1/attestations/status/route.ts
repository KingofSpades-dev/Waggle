import { NextRequest, NextResponse } from "next/server";
import { attestationWorker } from "@/workers/attestationWorker";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const snapshotIdParam = searchParams.get("snapshot_id");

  if (snapshotIdParam) {
    const snapshotId = Number(snapshotIdParam);
    const status = attestationWorker.getSnapshotStatus(snapshotId);
    if (!status) {
      return NextResponse.json(
        {
          snapshot_id: snapshotId,
          status: "not yet attested",
          in_retry_queue: false
        },
        { status: 200 }
      );
    }
    return NextResponse.json(status);
  }

  return NextResponse.json({
    jobs: attestationWorker.getAllJobs(),
    timestamp: Date.now()
  });
}
