import { NextResponse, type NextRequest } from "next/server";
import { getStores, type UsageEvent } from "@/lib/store";
import { clientBucket } from "@/lib/store/client-key";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only client-side events can be posted; favicon lookups are counted by their route. */
const POSTABLE: readonly UsageEvent[] = ["hide", "reveal"];
const EVENTS_PER_MINUTE = 30;

/**
 * GET /api/stats returns anonymous running totals.
 * POST /api/stats {"event":"hide"} adds one. No content, file names or
 * addresses are sent or stored; the counters are just numbers.
 */
export async function GET() {
  try {
    const totals = await getStores().usage.totals();
    return NextResponse.json({ totals }, { headers: { "cache-control": "public, max-age=30" } });
  } catch {
    return NextResponse.json({ error: "Stats are unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { event?: unknown } | null;
  const event = body?.event;
  if (typeof event !== "string" || !POSTABLE.includes(event as UsageEvent)) {
    return NextResponse.json({ error: "Unknown event." }, { status: 400 });
  }
  try {
    const stores = getStores();
    const hits = await stores.rateLimits.hit(clientBucket("stats", request), 60_000);
    if (hits <= EVENTS_PER_MINUTE) await stores.usage.increment(event as UsageEvent);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Stats are unavailable." }, { status: 503 });
  }
}
