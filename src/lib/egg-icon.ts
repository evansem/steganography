import { embedPlain } from "./stego/plain";

/**
 * Justeg's favicon: a gradient egg on the ink background, with an Easter egg
 * hidden in it as a plain message. `npm run icon` writes it to
 * src/app/icon.png, and the "How it works" section rebuilds it to show the
 * message in the bit plane.
 */
export const EGG_SIZE = 64;
export const EGG_MESSAGE = "🥚 You found the egg! This favicon was written by Justeg. Now hide something of your own.";

/** Flat background colour behind the egg. */
export const EGG_INK = [7, 6, 11] as const;

/** Linear interpolation between two colours. */
function lerp(a: readonly number[], b: readonly number[], t: number): number[] {
  return a.map((v, i) => Math.round(v + (b[i]! - v) * t));
}

/** Renders the favicon without a message. */
export function renderEgg(): Uint8ClampedArray {
  const data = new Uint8ClampedArray(EGG_SIZE * EGG_SIZE * 4);
  const white = [255, 255, 255];
  const glow = [178, 240, 206];
  const uv = [184, 164, 255];

  for (let y = 0; y < EGG_SIZE; y++) {
    for (let x = 0; x < EGG_SIZE; x++) {
      // Egg: an ellipse whose top half is narrower than its bottom half.
      const nx = (x + 0.5 - 32) / 19;
      const ny = (y + 0.5 - 37) / (y < 37 ? 29 : 19);
      const squeeze = y < 37 ? 1 + 0.25 * Math.abs(ny) : 1;
      const inside = (nx * squeeze) ** 2 + ny ** 2 <= 1;

      let colour: readonly number[] = EGG_INK;
      if (inside) {
        const d = Math.hypot(x - 24, y - 22) / 40;
        colour = d < 0.25 ? lerp(white, glow, d / 0.25) : lerp(glow, uv, Math.min(1, (d - 0.25) / 0.75));
      }
      data.set([...colour, 255], (y * EGG_SIZE + x) * 4);
    }
  }
  return data;
}

/** The favicon before and after hiding {@link EGG_MESSAGE}. */
export function eggIcon(): { cover: Uint8ClampedArray; stego: Uint8ClampedArray } {
  const cover = renderEgg();
  const stego = embedPlain({ data: cover, width: EGG_SIZE, height: EGG_SIZE }, EGG_MESSAGE, 1);
  return { cover, stego };
}
