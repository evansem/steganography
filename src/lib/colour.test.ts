import { describe, expect, it } from "vitest";
import { deltaE, flipBit, JND, toLab } from "./colour";

describe("colour difference", () => {
  it("maps white and black to the ends of the lightness axis", () => {
    expect(toLab([255, 255, 255])[0]).toBeCloseTo(100, 1);
    expect(toLab([0, 0, 0])[0]).toBeCloseTo(0, 5);
  });

  it("matches a known ΔE*76 value", () => {
    // pure red vs pure green, a standard reference pair
    expect(deltaE([255, 0, 0], [0, 255, 0])).toBeCloseTo(170.6, 0);
  });

  it("keeps a lowest-bit flip below the just-noticeable difference", () => {
    for (const colour of [
      [182, 104, 214],
      [12, 10, 20],
      [240, 238, 245],
      [118, 164, 212],
    ] as const) {
      expect(deltaE(colour, flipBit(colour, 0))).toBeLessThan(JND);
      expect(deltaE(colour, flipBit(colour, 7))).toBeGreaterThan(10 * JND);
    }
  });
});
