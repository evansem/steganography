/**
 * Finds icon links in an HTML document without a DOM. Only the <head> is
 * scanned and only rel/href/type/sizes attributes are read.
 */
export interface IconCandidate {
  href: string;
  rel: string;
  type?: string;
  size: number;
}

const LINK_TAG = /<link\b[^>]*>/gi;
const ATTRIBUTE = /([a-z-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;

export function findIconLinks(html: string): IconCandidate[] {
  const end = html.search(/<\/head>/i);
  const head = end === -1 ? html : html.slice(0, end);
  const found: IconCandidate[] = [];
  for (const tag of head.match(LINK_TAG) ?? []) {
    const attrs: Record<string, string> = {};
    for (const match of tag.matchAll(ATTRIBUTE)) {
      attrs[match[1]!.toLowerCase()] = decodeEntities(match[3] ?? match[4] ?? match[5] ?? "");
    }
    const rel = (attrs.rel ?? "").toLowerCase();
    if (!attrs.href || !/(^|\s)(icon|apple-touch-icon)(\s|$)/.test(rel)) continue;
    found.push({ href: attrs.href, rel, type: attrs.type, size: largestSize(attrs.sizes) });
  }
  return found;
}

/**
 * Orders candidates so raster icons come first, then by size (closest to
 * 64px wins, as tiny icons hold little and huge ones are slow). SVG is
 * dropped: it is a vector document, not pixels, and can carry scripts.
 */
export function rankIcons(candidates: IconCandidate[], base: URL): URL[] {
  const urls = candidates
    .filter((c) => !/svg/.test(c.type ?? "") && !/\.svg(\?|#|$)/i.test(c.href))
    .sort((a, b) => score(a) - score(b))
    .map((c) => safeUrl(c.href, base))
    .filter((u): u is URL => u !== null);
  urls.push(new URL("/favicon.ico", base));
  return dedupe(urls);
}

function score(c: IconCandidate): number {
  const size = c.size || (c.rel.includes("apple") ? 180 : 32);
  return Math.abs(Math.log2(size / 64));
}

function largestSize(sizes = ""): number {
  return Math.max(0, ...sizes.split(/\s+/).map((s) => Number(s.split("x")[0]) || 0));
}

function safeUrl(href: string, base: URL): URL | null {
  try {
    const url = new URL(href, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function dedupe(urls: URL[]): URL[] {
  const seen = new Set<string>();
  return urls.filter((u) => !seen.has(u.href) && seen.add(u.href));
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
