import { describe, expect, it } from "vitest";
import { CapacityError, NoMessageError } from "./errors";
import { embedPlain, extractPlain, plainCapacity } from "./plain";
import { fakeImage } from "./testing";

describe("plain container", () => {
  for (const depth of [1, 2] as const) {
    it(`round-trips Unicode text at depth ${depth}`, () => {
      const image = fakeImage(32, 32);
      const text = "Kia ora, Pōneke! 🥚 hidden in plain sight";
      const data = embedPlain(image, text, depth);
      expect(extractPlain({ ...image, data })).toEqual({ text, depth });
    });
  }

  it("round-trips an empty message", () => {
    const image = fakeImage(8, 8);
    const data = embedPlain(image, "", 1);
    expect(extractPlain({ ...image, data }).text).toBe("");
  });

  it("fills the image exactly to capacity", () => {
    const image = fakeImage(10, 10);
    const capacity = plainCapacity(image, 2);
    const text = "a".repeat(capacity);
    const data = embedPlain(image, text, 2);
    expect(extractPlain({ ...image, data }).text).toBe(text);
    expect(() => embedPlain(image, text + "a", 2)).toThrow(CapacityError);
  });

  it("forces the output to be opaque", () => {
    const image = fakeImage(8, 8);
    const data = embedPlain(image, "hi", 1);
    for (let i = 3; i < data.length; i += 4) expect(data[i]).toBe(255);
  });

  it("does not modify the input image", () => {
    const image = fakeImage(8, 8);
    const before = new Uint8ClampedArray(image.data);
    embedPlain(image, "hello", 2);
    expect(image.data).toEqual(before);
  });

  it("reports no message in an untouched image", () => {
    expect(() => extractPlain(fakeImage(32, 32, 7))).toThrow(NoMessageError);
  });

  it("reports no message in an image too small for a header", () => {
    expect(() => extractPlain(fakeImage(1, 1))).toThrow(NoMessageError);
  });
});
