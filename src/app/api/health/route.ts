import { NextResponse } from "next/server";
import { readDbConfig } from "@/lib/db/config";
import { getDatabase } from "@/lib/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/health reports whether the app is up and whether its database
 * is reachable and migrated. Used to check a Hostinger deployment.
 */
export async function GET() {
  const headers = { "cache-control": "no-store" };
  let config;
  try {
    config = readDbConfig();
  } catch {
    return NextResponse.json({ status: "error", database: "misconfigured" }, { status: 503, headers });
  }
  if (!config) return NextResponse.json({ status: "ok", database: "not configured" }, { headers });

  try {
    const { pool, ready } = getDatabase(config);
    await ready;
    await pool.query("SELECT 1");
    return NextResponse.json({ status: "ok", database: "connected" }, { headers });
  } catch {
    return NextResponse.json({ status: "error", database: "unreachable" }, { status: 503, headers });
  }
}
