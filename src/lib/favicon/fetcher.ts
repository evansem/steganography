import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import { isBlockedAddress } from "./address";

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

/**
 * DNS lookup that refuses to connect to internal addresses. Because the
 * check runs inside the socket's own lookup, the address that is validated
 * is the address that is connected to, which defeats DNS rebinding.
 */
export const safeLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "", 0);
    const list = addresses as LookupAddress[];
    const allowed = list.filter((entry) => !isBlockedAddress(entry.address));
    if (allowed.length === 0 || allowed.length !== list.length) {
      return callback(new FetchBlockedError(`${hostname} resolves to a private or reserved address.`), "", 0);
    }
    if (options.all) return (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, allowed);
    const first = allowed[0]!;
    callback(null, first.address, first.family);
  });
};

/** Checks scheme, credentials, port and literal-IP hosts before any network use. */
export function assertPublicUrl(url: URL): void {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new FetchBlockedError("Only http and https addresses are allowed.");
  }
  if (url.username || url.password) throw new FetchBlockedError("Addresses with credentials are not allowed.");
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new FetchBlockedError("Only the standard web ports are allowed.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new FetchBlockedError("Local addresses are not allowed.");
  }
  if (/^[\d.]+$/.test(host) || host.includes(":")) {
    if (isBlockedAddress(host)) throw new FetchBlockedError("That address is private or reserved.");
  }
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
    if (response.status >= 300 && response.status < 400 && response.location) {
      url = new URL(response.location, url);
      continue;
    }
    return { url, status: response.status, contentType: response.contentType, body: response.body };
  }
  throw new FetchFailedError("Too many redirects.");
}

function requestOnce(
  url: URL,
  limits: FetchLimits,
): Promise<{ status: number; contentType: string; location?: string; body: Buffer }> {
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const request = client.get(
      url,
      {
        lookup: safeLookup,
        timeout: limits.timeoutMs,
        headers: {
          "user-agent": "JustegFaviconReader/2.0 (+https://github.com/evansem/steganography)",
          accept: "text/html,image/*;q=0.9,*/*;q=0.1",
        },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        const contentType = String(response.headers["content-type"] ?? "").toLowerCase();
        const location = response.headers.location;
        if (status >= 300 && status < 400) {
          response.resume();
          return resolve({ status, contentType, location, body: Buffer.alloc(0) });
        }
        const declared = Number(response.headers["content-length"] ?? 0);
        if (declared > limits.maxBytes) {
          response.destroy();
          return reject(new FetchFailedError("The response is too large."));
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > limits.maxBytes) {
            response.destroy();
            reject(new FetchFailedError("The response is too large."));
            return;
          }
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
