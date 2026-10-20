import type { ImageLike } from "./pixels";

/** Deterministic noisy RGBA image for tests. */
export function fakeImage(width: number, height: number, seed = 1): ImageLike {
  const data = new Uint8ClampedArray(width * height * 4);
  let state = seed;
  for (let i = 0; i < data.length; i++) {
    state = (state * 1664525 + 1013904223) >>> 0;
    data[i] = state >>> 24;
  }
  return { data, width, height };
}
