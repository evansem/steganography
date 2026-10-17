import { findIconLinks, rankIcons } from "./discover";
import { FetchBlockedError, FetchFailedError, safeFetch } from "./fetcher";
import { MIME, sniffImage, type IconFormat } from "./sniff";

export { FetchBlockedError, FetchFailedError } from "./fetcher";

const PAGE_LIMITS = { maxBytes: 512 * 1024, timeoutMs: 5000, maxRedirects: 3 };
const ICON_LIMITS = { maxBytes: 1024 * 1024, timeoutMs: 5000, maxRedirects: 3 };
const MAX_CANDIDATES = 4;

export interface Favicon {
  source: string;
  format: IconFormat;
  mime: string;
  body: Buffer;
}

/** Accepts "example.com", "https://example.com/path" and similar. */
export function parseSiteInput(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) throw new FetchBlockedError("Enter a website address.");
  try {
    return new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new FetchBlockedError("That does not look like a website address.");
  }
}

/**
 * Downloads a site's favicon: reads the page's icon links, then tries the
 * best few candidates and finally /favicon.ico. Only real raster images,
 * verified by magic bytes, are returned.
 */
export async function fetchFavicon(site: URL): Promise<Favicon> {
  let candidates = [new URL("/favicon.ico", site)];
  let base = site;
  try {
    const page = await safeFetch(site, PAGE_LIMITS);
    base = page.url;
    if (page.status < 400 && page.contentType.includes("html")) {
      candidates = rankIcons(findIconLinks(page.body.toString("utf8")), base);
    }
  } catch (error) {
    if (error instanceof FetchBlockedError) throw error;
    // Page unreachable: fall back to /favicon.ico on the same origin.
  }

  for (const candidate of candidates.slice(0, MAX_CANDIDATES)) {
    try {
      const icon = await safeFetch(candidate, ICON_LIMITS);
      if (icon.status >= 400) continue;
      const format = sniffImage(icon.body);
      if (format) return { source: icon.url.href, format, mime: MIME[format], body: icon.body };
    } catch (error) {
      if (error instanceof FetchBlockedError) throw error;
    }
  }
  throw new FetchFailedError(`No usable icon was found for ${base.hostname}.`);
}
