import { slotToByte, type SlotOrder } from "./order";

export type BitDepth = 1 | 2;

/** Number of whole bytes that fit in `slots` channels at the given depth. */
export function bytesForSlots(slots: number, depth: BitDepth): number {
  return Math.floor((slots * depth) / 8);
}

/** Number of channels needed to carry `bytes` at the given depth. */
export function slotsForBytes(bytes: number, depth: BitDepth): number {
  return Math.ceil((bytes * 8) / depth);
}

/**
 * Writes `bytes` into the least significant bits of `pixels` (RGBA),
 * starting at position `offset` of `order`. Returns the next free position.
 *
 * Bits are written most significant first, `depth` bits per channel.
 */
export function writeBits(
  pixels: Uint8ClampedArray,
  order: SlotOrder,
  offset: number,
  bytes: Uint8Array,
  depth: BitDepth,
): number {
  const mask = (1 << depth) - 1;
  let position = offset;
  let acc = 0;
  let accBits = 0;

  const flush = (chunk: number) => {
    const byte = slotToByte(order.at(position++));
    pixels[byte] = (pixels[byte]! & ~mask) | chunk;
  };

  for (const value of bytes) {
    acc = (acc << 8) | value;
    accBits += 8;
    while (accBits >= depth) {
      accBits -= depth;
      flush((acc >> accBits) & mask);
    }
    acc &= (1 << accBits) - 1;
  }
  // depth always divides 8, so nothing is left over
  return position;
}

/** Reads `count` bytes written by {@link writeBits}. */
export function readBits(
  pixels: Uint8ClampedArray,
  order: SlotOrder,
  offset: number,
  count: number,
  depth: BitDepth,
): Uint8Array {
  const mask = (1 << depth) - 1;
  const out = new Uint8Array(count);
  let position = offset;

  for (let i = 0; i < count; i++) {
    let value = 0;
    for (let bit = 0; bit < 8; bit += depth) {
      const byte = slotToByte(order.at(position++));
      value = (value << depth) | (pixels[byte]! & mask);
    }
    out[i] = value;
  }
  return out;
}
