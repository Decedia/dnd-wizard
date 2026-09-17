import { NextResponse } from "next/server";
import { runSrdDataIntegrityTests } from "@/lib/srd-data-tests";

export async function GET() {
  try {
    const report = runSrdDataIntegrityTests();
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to run SRD data tests" }, { status: 500 });
  }
}
