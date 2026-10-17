import { NextResponse, type NextRequest } from "next/server";
import { FetchBlockedError, FetchFailedError, fetchFavicon, parseSiteInput } from "@/lib/favicon";
import { createRateLimiter } from "@/lib/favicon/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allow = createRateLimiter(20, 60_000);

/**
 * GET /api/favicon?site=example.com
 *
 * Proxies a public site's favicon so the browser can read its pixels
 * (cross-origin images cannot be read from a canvas). The bytes are
 * returned as-is; all steganography still happens on the client.
 */
export async function GET(request: NextRequest) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(client)) {
    return problem(429, "Too many lookups. Try again in a minute.");
  }

  try {
    const site = parseSiteInput(request.nextUrl.searchParams.get("site") ?? "");
    const icon = await fetchFavicon(site);
    return new NextResponse(new Uint8Array(icon.body), {
      headers: {
        "content-type": icon.mime,
        "content-length": String(icon.body.length),
        "content-security-policy": "default-src 'none'",
        "x-content-type-options": "nosniff",
        "cache-control": "public, max-age=3600",
        "x-favicon-source": encodeURI(icon.source),
      },
    });
  } catch (error) {
    if (error instanceof FetchBlockedError) return problem(400, error.message);
    if (error instanceof FetchFailedError) return problem(502, error.message);
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "EAI_AGAIN") return problem(502, "That website could not be found.");
    return problem(502, "The website could not be reached.");
  }
}

function problem(status: number, detail: string) {
  return NextResponse.json({ error: detail }, { status, headers: { "cache-control": "no-store" } });
}
