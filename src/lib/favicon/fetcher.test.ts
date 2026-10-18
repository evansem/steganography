import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FetchBlockedError, assertPublicUrl, safeFetch, safeLookup } from "./fetcher";
import { parseSiteInput } from "./index";

const limits = { maxBytes: 1024, timeoutMs: 2000, maxRedirects: 2 };

describe("assertPublicUrl", () => {
  it.each([
    "file:///etc/passwd",
    "ftp://example.com",
    "http://user:pass@example.com",
    "http://example.com:8080",
    "http://localhost",
    "http://app.localhost",
    "http://metadata.google.internal",
    "http://127.0.0.1",
    "http://2130706433", // decimal form of 127.0.0.1
    "http://0x7f.1",
    "http://[::1]",
    "http://[::ffff:169.254.169.254]",
    "http://169.254.169.254/latest/meta-data",
  ])("refuses %s", (url) => {
    expect(() => assertPublicUrl(new URL(url))).toThrow(FetchBlockedError);
  });

  it("allows ordinary sites", () => {
    expect(() => assertPublicUrl(new URL("https://example.com/"))).not.toThrow();
  });
});

describe("parseSiteInput", () => {
  it("adds https to bare hosts", () => {
    expect(parseSiteInput(" github.com ").href).toBe("https://github.com/");
  });

  it("rejects empty input", () => {
    expect(() => parseSiteInput("  ")).toThrow(FetchBlockedError);
  });
});

describe("safeFetch", () => {
  let server: http.Server;
  let port = 0;

  beforeAll(async () => {
    server = http.createServer((_, res) => res.end("internal secret"));
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(() => server.close());

  it("never reaches a loopback server", async () => {
    await expect(safeFetch(new URL(`http://127.0.0.1:${port}/`), limits)).rejects.toThrow(FetchBlockedError);
    await expect(safeFetch(new URL(`http://localhost/`), limits)).rejects.toThrow(FetchBlockedError);
  });
});

describe("safeLookup", () => {
  it("refuses names that resolve to internal addresses", async () => {
    // Exercises the connect-time check that defeats DNS rebinding.
    const error = await new Promise<Error | null>((resolve) =>
      safeLookup("localhost", { family: 0 }, (err) => resolve(err)),
    );
    expect(error).toBeInstanceOf(FetchBlockedError);
  });
});
