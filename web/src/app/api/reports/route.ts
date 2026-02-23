import { NextResponse } from "next/server";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

const REPORTS_DIR = process.env.REPORTS_DIR || "/app/reports";
const MAX_REPORTS = 24; // 48 hours at 2-hour intervals

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!existsSync(REPORTS_DIR)) {
      return NextResponse.json({ reports: [], count: 0 });
    }

    const files = readdirSync(REPORTS_DIR)
      .filter((f) => f.startsWith("report-") && f.endsWith(".json"))
      .sort()
      .reverse()
      .slice(0, MAX_REPORTS);

    const reports = files.map((file) => {
      const raw = readFileSync(join(REPORTS_DIR, file), "utf-8");
      return JSON.parse(raw);
    });

    return NextResponse.json({ reports, count: reports.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, reports: [], count: 0 },
      { status: 500 }
    );
  }
}
