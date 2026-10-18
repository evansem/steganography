import type { SlotOrder } from "./order";

/**
 * Keyed pseudo-random permutation of [0, size) built from a small Feistel
 * network with cycle walking. It spreads payload bits across the whole image
 * without allocating a table, so even large photos cost O(1) memory.
 *
 * This is a scattering tool, not a cipher: confidentiality comes from
 * AES-GCM. Scattering removes the tell-tale "all changes in the first rows"
 * pattern and means an attacker without the key cannot tell which channels
 * to read.
 */
const ROUNDS = 4;

export function scatterOrder(size: number, key: Uint32Array, base = 0): SlotOrder {
  if (key.length < ROUNDS) throw new Error("Scatter key needs at least 4 words.");
  if (size <= 1) return { size, at: (index) => base + index };

  let halfBits = 1;
  while (2 ** (halfBits * 2) < size) halfBits++;
  const mask = 2 ** halfBits - 1;
  const half = 2 ** halfBits;

  const permute = (value: number): number => {
    let left = Math.floor(value / half);
    let right = value % half;
    for (let round = 0; round < ROUNDS; round++) {
      const next = (left ^ (mix(right ^ key[round]!) & mask)) >>> 0;
      left = right;
      right = next;
    }
    return left * half + right;
  };

  return {
    size,
    at(index) {
      let value = permute(index);
      while (value >= size) value = permute(value);
      return base + value;
    },
  };
}

/** MurmurHash3 finaliser: a fast, well-distributed 32-bit mixer. */
function mix(x: number): number {
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return x >>> 0;
}
