import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseNetpbm } from "../netpbm";
import { reveal } from "./api";
import { NoMessageError } from "./errors";
import { extractLegacy } from "./legacy";
import { embedPlain } from "./plain";
import { fakeImage } from "./testing";

const SAMPLES = new URL("../../../legacy/python/sample_images/", import.meta.url);
const sample = (name: string) => parseNetpbm(new Uint8Array(readFileSync(fileURLToPath(new URL(name, SAMPLES)))));

describe("2022 prototype reader", () => {
  it("reads the prototype's own sample images", () => {
    expect(extractLegacy(sample("2.hidden_hello_world.pbm")).text).toBe("Hello World!\n");
    expect(extractLegacy(sample("3.large_test_manzoni.pbm")).text).toMatch(/^From one to the other of these towns/);
  });

  it("finds nothing in the untouched original", () => {
    expect(() => extractLegacy(sample("1.original_sample_img.pbm"))).toThrow(NoMessageError);
  });

  it("is only tried when asked, and after the current format", async () => {
    const image = sample("2.hidden_hello_world.pbm");
    await expect(reveal(image)).rejects.toThrow(NoMessageError);
    await expect(reveal(image, undefined, { legacy: true })).resolves.toEqual({
      text: "Hello World!\n",
      depth: 2,
      encrypted: false,
      legacy: true,
    });

    const current = { ...image, data: embedPlain(image, "new format", 1) };
    await expect(reveal(current, undefined, { legacy: true })).resolves.toMatchObject({ text: "new format" });
  });

  it("rejects noise", () => {
    expect(() => extractLegacy(fakeImage(64, 64))).toThrow(NoMessageError);
  });
});
