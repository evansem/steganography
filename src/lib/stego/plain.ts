import { CapacityError, NoMessageError } from "./errors";
import { bytesForSlots, readBits, slotsForBytes, writeBits, type BitDepth } from "./lsb";
import { sequentialOrder } from "./order";

/**
 * Plain (unencrypted) container, written sequentially from the first pixel:
 *
 *   magic "JSTG" (4) | version (1) | length u32 BE (4) | UTF-8 text
 *
 * The length header replaces the original prototype's end-of-transmission
 * marker, so any byte value (and any Unicode text) can be stored.
 */
const MAGIC = new Uint8Array([0x4a, 0x53, 0x54, 0x47]);
const VERSION = 1;
const HEADER_BYTES = MAGIC.length + 1 + 4;

export interface ImageLike {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export function slotCount(image: ImageLike): number {
  return image.width * image.height * 3;
}

/** Maximum UTF-8 bytes a plain message can use in this image. */
export function plainCapacity(image: ImageLike, depth: BitDepth): number {
  return Math.max(0, bytesForSlots(slotCount(image), depth) - HEADER_BYTES);
}

/**
 * Hides `text` in a copy of the image. Alpha is forced to opaque because
 * browsers premultiply alpha on canvas and would corrupt hidden bits.
 */
export function embedPlain(image: ImageLike, text: string, depth: BitDepth): Uint8ClampedArray {
  const body = new TextEncoder().encode(text);
  const capacity = plainCapacity(image, depth);
  if (body.length > capacity) throw new CapacityError(body.length, capacity);

  const frame = new Uint8Array(HEADER_BYTES + body.length);
  frame.set(MAGIC, 0);
  frame[MAGIC.length] = VERSION;
  new DataView(frame.buffer).setUint32(MAGIC.length + 1, body.length);
  frame.set(body, HEADER_BYTES);

  const pixels = opaqueCopy(image.data);
  writeBits(pixels, sequentialOrder(slotCount(image)), 0, frame, depth);
  return pixels;
}

/** Looks for a plain message at either bit depth. */
export function extractPlain(image: ImageLike): { text: string; depth: BitDepth } {
  const order = sequentialOrder(slotCount(image));
  for (const depth of [1, 2] as const) {
    if (slotCount(image) < slotsForBytes(HEADER_BYTES, depth)) continue;
    const header = readBits(image.data, order, 0, HEADER_BYTES, depth);
    if (!MAGIC.every((b, i) => header[i] === b) || header[MAGIC.length] !== VERSION) continue;

    const length = new DataView(header.buffer).getUint32(MAGIC.length + 1);
    if (length > plainCapacity(image, depth)) continue;

    const offset = slotsForBytes(HEADER_BYTES, depth);
    const body = readBits(image.data, order, offset, length, depth);
    try {
      return { text: new TextDecoder("utf-8", { fatal: true }).decode(body), depth };
    } catch {
      continue;
    }
  }
  throw new NoMessageError();
}

export function opaqueCopy(data: Uint8ClampedArray): Uint8ClampedArray {
  const copy = new Uint8ClampedArray(data);
  for (let i = 3; i < copy.length; i += 4) copy[i] = 255;
  return copy;
}
