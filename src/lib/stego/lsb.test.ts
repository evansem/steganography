import { describe, expect, it } from "vitest";
import { readBits, writeBits } from "./lsb";
import { sequentialOrder } from "./order";
import { fakeImage } from "./testing";

describe("writeBits / readBits", () => {
  for (const depth of [1, 2] as const) {
    it(`round-trips bytes at depth ${depth}`, () => {
      const image = fakeImage(16, 16);
      const order = sequentialOrder(16 * 16 * 3);
      const bytes = new Uint8Array([0, 1, 127, 128, 255, 0x5a]);
      const end = writeBits(image.data, order, 5, bytes, depth);
      expect(end).toBe(5 + (bytes.length * 8) / depth);
      expect(readBits(image.data, order, 5, bytes.length, depth)).toEqual(bytes);
    });
  }

  it("only changes the low bits and never touches alpha", () => {
    const image = fakeImage(8, 8);
    const before = new Uint8ClampedArray(image.data);
    writeBits(image.data, sequentialOrder(8 * 8 * 3), 0, new Uint8Array(24).fill(0xff), 2);
    for (let i = 0; i < before.length; i++) {
      if (i % 4 === 3) expect(image.data[i]).toBe(before[i]);
      else expect(Math.abs(image.data[i]! - before[i]!)).toBeLessThanOrEqual(3);
    }
  });
});
