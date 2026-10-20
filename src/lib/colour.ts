/**
 * Colour difference maths for the "how it works" explainer.
 *
 * ΔE*76 is the Euclidean distance between two colours in CIELAB. A ΔE of
 * about 2.3 is the commonly cited just-noticeable difference, so it gives the
 * page a measured answer to "can you see the change?".
 */
export type Rgb = readonly [number, number, number];

export const CHANNELS = ["R", "G", "B"] as const;

/** Just-noticeable difference for ΔE*76 (Sharma, Digital Color Imaging Handbook). */
export const JND = 2.3;

export function deltaE(a: Rgb, b: Rgb): number {
  const [l1, a1, b1] = toLab(a);
  const [l2, a2, b2] = toLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** sRGB (0–255) to CIELAB under the D65 white point. */
export function toLab([r, g, b]: Rgb): [number, number, number] {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047;
  const y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  const z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const f = (t: number) => (t > (6 / 29) ** 3 ? Math.cbrt(t) : t / (3 * (6 / 29) ** 2) + 4 / 29);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** Flips bit `bit` (0 = least significant) of every channel. */
export function flipBit([r, g, b]: Rgb, bit: number): Rgb {
  const m = 1 << bit;
  return [r ^ m, g ^ m, b ^ m];
}

/** CSS colour string for an RGB triple. */
export function rgbCss([r, g, b]: Rgb): string {
  return `rgb(${r} ${g} ${b})`;
}

/** A channel value as eight binary digits, most significant first. */
export function toBits(value: number): string {
  return value.toString(2).padStart(8, "0");
}
