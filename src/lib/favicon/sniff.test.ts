import { describe, expect, it } from "vitest";
import { sniffImage } from "./sniff";

const bytes = (...values: (number | string)[]) =>
  new Uint8Array(values.flatMap((v) => (typeof v === "string" ? [...v].map((c) => c.charCodeAt(0)) : [v])));

describe("sniffImage", () => {
  it.each([
    ["png", bytes(0x89, "PNG", 13, 10)],
    ["ico", bytes(0, 0, 1, 0, 1, 0)],
    ["gif", bytes("GIF89a")],
    ["jpeg", bytes(0xff, 0xd8, 0xff, 0xe0)],
    ["webp", bytes("RIFF", 0, 0, 0, 0, "WEBP")],
    ["bmp", bytes("BM")],
  ])("detects %s", (format, data) => {
    expect(sniffImage(data)).toBe(format);
  });

  it("rejects HTML and SVG", () => {
    expect(sniffImage(bytes("<!doctype html>"))).toBeNull();
    expect(sniffImage(bytes("<svg xmlns="))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});
