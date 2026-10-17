import { describe, expect, it } from "vitest";
import { hide, reveal } from "./api";
import { NoMessageError } from "./errors";
import { extractPlain } from "./plain";
import { sealedCapacity } from "./sealed";
import { fakeImage } from "./testing";

// PBKDF2 at full strength takes a moment per derivation.
const SLOW = 30_000;

describe("sealed container", () => {
  it(
    "round-trips at both depths and reports encryption",
    async () => {
      for (const depth of [1, 2] as const) {
        const image = fakeImage(48, 48);
        const data = await hide(image, "meet at the wharf 🌊", { passphrase: "correct horse", depth });
        await expect(reveal({ ...image, data }, "correct horse")).resolves.toEqual({
          text: "meet at the wharf 🌊",
          depth,
          encrypted: true,
        });
      }
    },
    SLOW,
  );

  it(
    "rejects a wrong passphrase",
    async () => {
      const image = fakeImage(48, 48);
      const data = await hide(image, "secret", { passphrase: "right" });
      await expect(reveal({ ...image, data }, "wrong")).rejects.toThrow(NoMessageError);
    },
    SLOW,
  );

  it(
    "detects tampering",
    async () => {
      const image = fakeImage(48, 48);
      const data = await hide(image, "secret", { passphrase: "pw", depth: 2 });
      for (let i = 0; i < data.length; i += 4) data[i] = data[i]! ^ 1;
      await expect(reveal({ ...image, data }, "pw")).rejects.toThrow(NoMessageError);
    },
    SLOW,
  );

  it(
    "is invisible to the plain reader",
    async () => {
      const image = fakeImage(48, 48);
      const data = await hide(image, "secret", { passphrase: "pw" });
      expect(() => extractPlain({ ...image, data })).toThrow(NoMessageError);
    },
    SLOW,
  );

  it(
    "produces different output for the same input",
    async () => {
      const image = fakeImage(32, 32);
      const a = await hide(image, "same", { passphrase: "pw" });
      const b = await hide(image, "same", { passphrase: "pw" });
      expect(a).not.toEqual(b);
    },
    SLOW,
  );

  it("has less capacity than plain mode because of the crypto overhead", () => {
    const image = fakeImage(48, 48);
    expect(sealedCapacity(image, 1)).toBe(Math.floor(((48 * 48 * 3 - 128) * 1) / 8) - 32);
  });
});
