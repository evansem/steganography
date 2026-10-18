import { describe, expect, it } from "vitest";
import type { Stores } from "./types";

/** Behaviour every store implementation must share. */
export function storeContract(name: string, make: () => Promise<Stores>) {
  describe(`${name} stores`, () => {
    it("counts hits per bucket and resets each window", async () => {
      const { rateLimits } = await make();
      const t = 1_700_000_040_000;
      expect(await rateLimits.hit("a", 60_000, t)).toBe(1);
      expect(await rateLimits.hit("a", 60_000, t + 1)).toBe(2);
      expect(await rateLimits.hit("b", 60_000, t + 2)).toBe(1);
      expect(await rateLimits.hit("a", 60_000, t + 60_000)).toBe(1);
    });

    it("caches favicons until they expire", async () => {
      const { favicons } = await make();
      const icon = {
        source: "https://example.com/favicon.ico",
        mime: "image/png",
        body: Buffer.from([1, 2, 3]),
        fetchedAt: 1000,
      };
      await favicons.set("example.com", icon);
      const hit = await favicons.get("example.com", 500, 1400);
      expect(hit?.source).toBe(icon.source);
      expect(Buffer.compare(hit!.body, icon.body)).toBe(0);
      expect(await favicons.get("example.com", 500, 1600)).toBeNull();
      expect(await favicons.get("missing.example", 500, 1400)).toBeNull();
    });

    it("keeps anonymous usage totals", async () => {
      const { usage } = await make();
      await usage.increment("hide");
      await usage.increment("hide");
      await usage.increment("reveal");
      expect(await usage.totals()).toEqual({ hide: 2, reveal: 1, favicon: 0 });
    });
  });
}
