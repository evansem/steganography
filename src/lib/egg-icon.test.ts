import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { EGG_INK, EGG_MESSAGE, EGG_SIZE, eggIcon } from "./egg-icon";
import { extractPlain } from "./stego/plain";

/** Reads the pixels of the shipped icon, which the generator writes unfiltered. */
function shippedIcon(): Uint8Array {
  const file = readFileSync(new URL("../app/icon.png", import.meta.url));
  const idat: Buffer[] = [];
  for (let at = 8; at < file.length;) {
    const length = file.readUInt32BE(at);
    if (file.toString("ascii", at + 4, at + 8) === "IDAT") idat.push(file.subarray(at + 8, at + 8 + length));
    at += length + 12;
  }
  const rows = inflateSync(Buffer.concat(idat));
  const stride = EGG_SIZE * 4;
  const out = new Uint8Array(stride * EGG_SIZE);
  for (let y = 0; y < EGG_SIZE; y++) {
    expect(rows[y * (stride + 1)]).toBe(0);
    out.set(rows.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), y * stride);
  }
  return out;
}

describe("egg icon", () => {
  it("rebuilds the shipped favicon exactly", () => {
    expect(Array.from(eggIcon().stego)).toEqual(Array.from(shippedIcon()));
  });

  it("carries the Easter egg message", () => {
    const { stego } = eggIcon();
    expect(extractPlain({ data: stego, width: EGG_SIZE, height: EGG_SIZE }).text).toBe(EGG_MESSAGE);
  });

  it("starts the cover with flat ink, so its lowest bits are uniform", () => {
    const { cover } = eggIcon();
    expect(Array.from(cover.subarray(0, 3))).toEqual([...EGG_INK]);
  });
});
