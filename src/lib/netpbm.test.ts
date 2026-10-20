import { describe, expect, it } from "vitest";
import { encodePpm, isNetpbm, NetpbmError, netpbmExtension, parseNetpbm } from "./netpbm";
import { fakeImage } from "./stego/testing";

const ascii = (text: string) => new TextEncoder().encode(text);
const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};
const rgb = (image: { data: Uint8ClampedArray }) => [...image.data].filter((_, i) => i % 4 !== 3);

describe("Netpbm", () => {
  it("recognises P1 to P6 and nothing else", () => {
    for (let kind = 1; kind <= 6; kind++) expect(isNetpbm(ascii(`P${kind}\n`))).toBe(true);
    expect(isNetpbm(ascii("P7\n"))).toBe(false);
    expect(isNetpbm(ascii("\x89PNG"))).toBe(false);
  });

  it("finds the Netpbm extension of a file name", () => {
    expect(netpbmExtension("sample.PBM")).toBe(".pbm");
    expect(netpbmExtension("photo.png")).toBeNull();
  });

  it("reads a binary PPM written by the 2022 prototype layout", () => {
    const file = concat(ascii("P6\n2\n1\n255\n"), new Uint8Array([10, 20, 30, 40, 50, 60]));
    const image = parseNetpbm(file);
    expect([image.width, image.height]).toEqual([2, 1]);
    expect([...image.data]).toEqual([10, 20, 30, 255, 40, 50, 60, 255]);
  });

  it("reads ASCII PPM with comments", () => {
    const image = parseNetpbm(ascii("P3\n# a comment\n2 1 # trailing\n255\n1 2 3   4 5 6\n"));
    expect(rgb(image)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("expands greyscale to RGB and rescales maxval", () => {
    expect(rgb(parseNetpbm(ascii("P2 2 1 15 0 15")))).toEqual([0, 0, 0, 255, 255, 255]);
    const wide = concat(ascii("P5 1 1 65535\n"), new Uint8Array([0xff, 0xff]));
    expect(rgb(parseNetpbm(wide))).toEqual([255, 255, 255]);
  });

  it("reads bitmaps where 1 is black", () => {
    expect(rgb(parseNetpbm(ascii("P1 3 1\n101")))).toEqual([0, 0, 0, 255, 255, 255, 0, 0, 0]);
    // 10 pixels wide: rows pad to two bytes
    const p4 = concat(ascii("P4 10 1\n"), new Uint8Array([0b10000000, 0b01000000]));
    const image = parseNetpbm(p4);
    const black = Array.from({ length: 10 }, (_, x) => image.data[x * 4] === 0);
    expect(black).toEqual([true, false, false, false, false, false, false, false, false, true]);
  });

  it("round-trips through encodePpm bit for bit", () => {
    const source = fakeImage(7, 5);
    const image = parseNetpbm(encodePpm(source.data, 7, 5));
    expect(rgb(image)).toEqual(rgb(source));
  });

  it("rejects truncated, malformed and oversized files", () => {
    expect(() => parseNetpbm(concat(ascii("P6 2 2 255\n"), new Uint8Array(5)))).toThrow(NetpbmError);
    expect(() => parseNetpbm(ascii("P2 2 x 255"))).toThrow(NetpbmError);
    expect(() => parseNetpbm(ascii("P2 0 1 255"))).toThrow(NetpbmError);
    expect(() => parseNetpbm(ascii("P5 5000 5000 255\n"), 24_000_000)).toThrow(/megapixels/);
  });
});
