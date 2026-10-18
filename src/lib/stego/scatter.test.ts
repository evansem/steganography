import { describe, expect, it } from "vitest";
import { scatterOrder } from "./scatter";

const key = new Uint32Array([1, 2, 3, 4]);

describe("scatterOrder", () => {
  for (const size of [1, 2, 3, 10, 257, 4096, 12_345]) {
    it(`is a permutation of [0, ${size})`, () => {
      const order = scatterOrder(size, key);
      const seen = new Set<number>();
      for (let i = 0; i < size; i++) seen.add(order.at(i));
      expect(seen.size).toBe(size);
      expect(Math.min(...seen)).toBe(0);
      expect(Math.max(...seen)).toBe(size - 1);
    });
  }

  it("offsets by base", () => {
    expect(scatterOrder(5, key, 100).at(0)).toBeGreaterThanOrEqual(100);
  });

  it("differs between keys", () => {
    const a = scatterOrder(1000, key);
    const b = scatterOrder(1000, new Uint32Array([4, 3, 2, 1]));
    const same = Array.from({ length: 100 }, (_, i) => a.at(i) === b.at(i)).filter(Boolean);
    expect(same.length).toBeLessThan(10);
  });

  it("spreads early indices across the whole range", () => {
    const order = scatterOrder(100_000, key);
    const firstHundred = Array.from({ length: 100 }, (_, i) => order.at(i));
    expect(Math.max(...firstHundred)).toBeGreaterThan(50_000);
  });
});
