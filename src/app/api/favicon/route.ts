import { NextResponse, type NextRequest } from "next/server";
import { FetchBlockedError, FetchFailedError, fetchFavicon, parseSiteInput } from "@/lib/favicon";
import { getStores, type CachedFavicon } from "@/lib/store";
import { clientBucket } from "@/lib/store/client-key";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOOKUPS_PER_MINUTE = 20;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/favicon?site=example.com
 *
 * Proxies a public site's favicon so the browser can read its pixels
 * (cross-origin images cannot be read from a canvas). The bytes are
 * returned as-is; all steganography still happens on the client.
 * Icons are cached for a day and lookups are rate limited per client.
 */
export async function GET(request: NextRequest) {
  const stores = getStores();
  try {
    const hits = await stores.rateLimits.hit(clientBucket("favicon", request), 60_000);
    if (hits > LOOKUPS_PER_MINUTE) return problem(429, "Too many lookups. Try again in a minute.");
  } catch {
    return problem(503, "The icon service is unavailable right now.");
  }

  try {
    const site = parseSiteInput(request.nextUrl.searchParams.get("site") ?? "");
    const key = site.hostname.toLowerCase();
    let icon = await stores.favicons.get(key, CACHE_TTL_MS).catch(() => null);
    const cached = Boolean(icon);
    if (!icon) {
      const fetched = await fetchFavicon(site);
      icon = { source: fetched.source, mime: fetched.mime, body: fetched.body, fetchedAt: Date.now() };
      await stores.favicons.set(key, icon).catch(() => {});
    }
    void stores.usage.increment("favicon").catch(() => {});
    return iconResponse(icon, cached);
  } catch (error) {
    if (error instanceof FetchBlockedError) return problem(400, error.message);
    if (error instanceof FetchFailedError) return problem(502, error.message);
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") return problem(502, "That website could not be found.");
    return problem(502, "The website could not be reached.");
  }
}

function iconResponse(icon: CachedFavicon, cached: boolean) {
  return new NextResponse(new Uint8Array(icon.body), {
    headers: {
      "content-type": icon.mime,
      "content-length": String(icon.body.length),
      "content-security-policy": "default-src 'none'",
      "x-content-type-options": "nosniff",
      "cache-control": "public, max-age=3600",
      "x-favicon-source": encodeURI(icon.source),
      "x-favicon-cache": cached ? "hit" : "miss",
    },
  });
}

function problem(status: number, detail: string) {
  return NextResponse.json({ error: detail }, { status, headers: { "cache-control": "no-store" } });
}
