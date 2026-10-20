import { lookup as dnsLookup } from "node:dns";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import { isBlockedAddress } from "./address";

const USER_AGENT = "JustegFaviconReader/2.0 (+https://github.com/evansem/steganography)";
const ALLOWED_PORTS = new Set(["", "80", "443"]);
const LOCAL_SUFFIXES = [".localhost", ".internal", ".local"];

/** The request breaks policy (private address, bad scheme…). Never retried. */
export class FetchBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchBlockedError";
  }
}

/** The request was allowed but did not succeed (timeout, too large…). */
export class FetchFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchFailedError";
  }
}

export interface FetchLimits {
  maxBytes: number;
  timeoutMs: number;
  maxRedirects: number;
}

export interface FetchedResource {
  url: URL;
  status: number;
  contentType: string;
  body: Buffer;
}

interface RawResponse {
  status: number;
  contentType: string;
  location?: string;
  body: Buffer;
}

/**
 * DNS lookup that refuses to connect to internal addresses. Because the
 * check runs inside the socket's own lookup, the address that is validated
 * is the address that is connected to, which defeats DNS rebinding.
 */
export const safeLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "", 0);
    // Refuse the host if any of its addresses is internal, not just the first.
    if (addresses.length === 0 || addresses.some((entry) => isBlockedAddress(entry.address))) {
      return callback(new FetchBlockedError(`${hostname} resolves to a private or reserved address.`), "", 0);
    }
    if (options.all) return callback(null, addresses);
    const first = addresses[0]!;
    callback(null, first.address, first.family);
  });
};

/** Checks scheme, credentials, port and literal-IP hosts before any network use. */
export function assertPublicUrl(url: URL): void {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new FetchBlockedError("Only http and https addresses are allowed.");
  }
  if (url.username || url.password) throw new FetchBlockedError("Addresses with credentials are not allowed.");
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new FetchBlockedError("Only the standard web ports are allowed.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || LOCAL_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    throw new FetchBlockedError("Local addresses are not allowed.");
  }
  const isLiteralIp = /^[\d.]+$/.test(host) || host.includes(":");
  if (isLiteralIp && isBlockedAddress(host)) throw new FetchBlockedError("That address is private or reserved.");
}

/**
 * GETs a public URL with hard limits on size, time and redirects. Every
 * redirect target is validated again before it is followed.
 */
export async function safeFetch(input: URL, limits: FetchLimits): Promise<FetchedResource> {
  let url = input;
  for (let hop = 0; hop <= limits.maxRedirects; hop++) {
    assertPublicUrl(url);
    const response = await requestOnce(url, limits);
    if (isRedirect(response.status) && response.location) {
      url = new URL(response.location, url);
      continue;
    }
    return { url, status: response.status, contentType: response.contentType, body: response.body };
  }
  throw new FetchFailedError("Too many redirects.");
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

function requestOnce(url: URL, limits: FetchLimits): Promise<RawResponse> {
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const request = client.get(
      url,
      {
        lookup: safeLookup,
        timeout: limits.timeoutMs,
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,image/*;q=0.9,*/*;q=0.1",
        },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
        const location = response.headers.location;
        if (isRedirect(status)) {
          response.resume();
          return resolve({ status, contentType, location, body: Buffer.alloc(0) });
        }
        const tooLarge = () => {
          response.destroy();
          reject(new FetchFailedError("The response is too large."));
        };
        const declared = Number(response.headers["content-length"] ?? 0);
        if (declared > limits.maxBytes) return tooLarge();

        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > limits.maxBytes) return tooLarge();
          chunks.push(chunk);
        });
        response.on("end", () => resolve({ status, contentType, body: Buffer.concat(chunks) }));
        response.on("error", reject);
      },
    );
    request.on("timeout", () => request.destroy(new FetchFailedError("The site took too long to respond.")));
    request.on("error", reject);
  });
}
