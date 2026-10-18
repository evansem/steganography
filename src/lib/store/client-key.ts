import { createHmac, randomBytes } from "node:crypto";

/**
 * Rate-limit buckets are keyed by an HMAC of the client address, so the
 * database never stores IP addresses. Set RATE_LIMIT_SECRET so keys stay
 * stable across restarts; without it a random per-process secret is used.
 */
const secret = process.env.RATE_LIMIT_SECRET || randomBytes(32).toString("hex");

export function clientBucket(scope: string, request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHmac("sha256", secret).update(`${scope}:${address}`).digest("hex");
}
