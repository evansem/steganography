import { CapacityError, NoMessageError } from "./errors";
import { BIT_DEPTHS, bytesForSlots, readBits, slotsForBytes, writeBits, type BitDepth } from "./lsb";
import { sequentialOrder } from "./order";
import { opaqueCopy, slotCount, type ImageLike } from "./pixels";
import { decodeUtf8, encodeUtf8 } from "./text";

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
const VERSION_OFFSET = MAGIC.length;
const LENGTH_OFFSET = VERSION_OFFSET + 1;
const HEADER_BYTES = LENGTH_OFFSET + 4;

/** Maximum UTF-8 bytes a plain message can use in this image. */
export function plainCapacity(image: ImageLike, depth: BitDepth): number {
  return Math.max(0, bytesForSlots(slotCount(image), depth) - HEADER_BYTES);
}

/** Hides `text` in an opaque copy of the image. */
export function embedPlain(image: ImageLike, text: string, depth: BitDepth): Uint8ClampedArray {
  const body = encodeUtf8(text);
  const capacity = plainCapacity(image, depth);
  if (body.length > capacity) throw new CapacityError(body.length, capacity);

  const frame = new Uint8Array(HEADER_BYTES + body.length);
  frame.set(MAGIC, 0);
  frame[VERSION_OFFSET] = VERSION;
  new DataView(frame.buffer).setUint32(LENGTH_OFFSET, body.length);
  frame.set(body, HEADER_BYTES);

  const pixels = opaqueCopy(image.data);
  writeBits(pixels, sequentialOrder(slotCount(image)), 0, frame, depth);
  return pixels;
}

/** Looks for a plain message at either bit depth. */
export function extractPlain(image: ImageLike): { text: string; depth: BitDepth } {
  const slots = slotCount(image);
  const order = sequentialOrder(slots);
  for (const depth of BIT_DEPTHS) {
    const offset = slotsForBytes(HEADER_BYTES, depth);
    if (slots < offset) continue;
    const header = readBits(image.data, order, 0, HEADER_BYTES, depth);
    if (!hasSignature(header)) continue;

    const length = new DataView(header.buffer).getUint32(LENGTH_OFFSET);
    if (length > plainCapacity(image, depth)) continue;

    const text = decodeUtf8(readBits(image.data, order, offset, length, depth));
    if (text !== null) return { text, depth };
  }
  throw new NoMessageError();
}

function hasSignature(header: Uint8Array): boolean {
  return MAGIC.every((byte, i) => header[i] === byte) && header[VERSION_OFFSET] === VERSION;
}
