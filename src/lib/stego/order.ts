/**
 * A slot order decides which colour channel carries the n-th group of bits.
 *
 * Slots number the RGB channels of an image (alpha is never used), so an
 * image with P pixels has 3P slots. `at(i)` returns the slot used for the
 * i-th chunk of the payload and must be a bijection over [0, size).
 */
export interface SlotOrder {
  readonly size: number;
  at(index: number): number;
}

/** Fills slots from the top-left pixel onwards. */
export function sequentialOrder(size: number): SlotOrder {
  return { size, at: (index) => index };
}

/** Converts an RGB slot number into an index into RGBA pixel data. */
export function slotToByte(slot: number): number {
  return Math.floor(slot / 3) * 4 + (slot % 3);
}
