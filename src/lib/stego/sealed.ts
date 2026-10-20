import { CapacityError, NoMessageError } from "./errors";
import { IV_BYTES, SALT_BYTES, TAG_BYTES, deriveKeys, open, randomBytes, seal } from "./crypto";
import { bytesForSlots, readBits, slotsForBytes, writeBits, type BitDepth } from "./lsb";
import { sequentialOrder } from "./order";
import { opaqueCopy, slotCount, type ImageLike } from "./plain";
import { scatterOrder } from "./scatter";

/**
 * Encrypted container. There is no magic number, so a sealed image carries
 * no fixed signature for scanners to match.
 *
 *   sequential slots : salt (16)
 *   keyed scatter    : length u32 BE (4) | iv (12) | AES-GCM ciphertext + tag
 *
 * PBKDF2 turns the passphrase and salt into an AES-256 key and a scatter key.
 * The bit depth is bound to the ciphertext as associated data.
 */
const LENGTH_BYTES = 4;
const OVERHEAD = LENGTH_BYTES + IV_BYTES + TAG_BYTES;

function layout(image: ImageLike, depth: BitDepth) {
  const total = slotCount(image);
  const saltSlots = slotsForBytes(SALT_BYTES, depth);
  return { total, saltSlots, scatterSlots: Math.max(0, total - saltSlots) };
}

const aadFor = (depth: BitDepth) => new Uint8Array([0x4a, 0x53, 2, depth]);

/** Maximum UTF-8 bytes a sealed message can use in this image. */
export function sealedCapacity(image: ImageLike, depth: BitDepth): number {
  return Math.max(0, bytesForSlots(layout(image, depth).scatterSlots, depth) - OVERHEAD);
}

export async function embedSealed(
  image: ImageLike,
  text: string,
  passphrase: string,
  depth: BitDepth,
): Promise<Uint8ClampedArray> {
  const body = new TextEncoder().encode(text);
  const capacity = sealedCapacity(image, depth);
  if (body.length > capacity) throw new CapacityError(body.length, capacity);

  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const keys = await deriveKeys(passphrase, salt);
  const ciphertext = await seal(keys.aesKey, iv, body, aadFor(depth));

  const frame = new Uint8Array(LENGTH_BYTES + IV_BYTES + ciphertext.length);
  new DataView(frame.buffer).setUint32(0, ciphertext.length);
  frame.set(iv, LENGTH_BYTES);
  frame.set(ciphertext, LENGTH_BYTES + IV_BYTES);

  const { total, saltSlots, scatterSlots } = layout(image, depth);
  const pixels = opaqueCopy(image.data);
  writeBits(pixels, sequentialOrder(total), 0, salt, depth);
  writeBits(pixels, scatterOrder(scatterSlots, keys.scatterKey, saltSlots), 0, frame, depth);
  return pixels;
}

/**
 * Tries both bit depths. A wrong passphrase and "no message" are
 * indistinguishable by design, so both raise {@link NoMessageError}.
 */
export async function extractSealed(image: ImageLike, passphrase: string): Promise<{ text: string; depth: BitDepth }> {
  for (const depth of [1, 2] as const) {
    const { total, saltSlots, scatterSlots } = layout(image, depth);
    const maxFrame = bytesForSlots(scatterSlots, depth);
    if (maxFrame < OVERHEAD) continue;

    const salt = readBits(image.data, sequentialOrder(total), 0, SALT_BYTES, depth);
    const keys = await deriveKeys(passphrase, salt);
    const order = scatterOrder(scatterSlots, keys.scatterKey, saltSlots);

    const length = new DataView(readBits(image.data, order, 0, LENGTH_BYTES, depth).buffer).getUint32(0);
    if (length < TAG_BYTES || LENGTH_BYTES + IV_BYTES + length > maxFrame) continue;

    const rest = readBits(image.data, order, slotsForBytes(LENGTH_BYTES, depth), IV_BYTES + length, depth);
    const plaintext = await open(keys.aesKey, rest.subarray(0, IV_BYTES), rest.subarray(IV_BYTES), aadFor(depth));
    if (!plaintext) continue;

    try {
      return { text: new TextDecoder("utf-8", { fatal: true }).decode(plaintext), depth };
    } catch {
      continue;
    }
  }
  throw new NoMessageError("No message found. The passphrase may be wrong.");
}
