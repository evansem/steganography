/**
 * Reader for messages hidden by the 2022 Python prototype (legacy/python).
 *
 * That tool wrote 7-bit ASCII, most significant bit first, into the lowest
 * two bits of every byte of a P6 raster, starting at the first pixel, and
 * ended the message with EOT (0000100, or 00000100 to keep the bit count
 * even). With no alpha channel, those bytes map one-to-one onto the RGB
 * slots of the decoded image.
 *
 * The format has no signature, so a message only counts when it is not
 * empty, every character is printable and the terminator is found.
 */
import { NoMessageError } from "./errors";
import { slotToByte } from "./order";
import { slotCount, type ImageLike } from "./pixels";

const BITS_PER_SLOT = 2;
const CHAR_BITS = 7;
const EOT = 0b0000100;

export function extractLegacy(image: ImageLike): { text: string } {
  const totalBits = slotCount(image) * BITS_PER_SLOT;

  /** Reads `count` bits starting at bit `from`, most significant first. */
  const read = (from: number, count: number) => {
    let value = 0;
    for (let i = from; i < from + count; i++) {
      const byte = image.data[slotToByte(Math.floor(i / BITS_PER_SLOT))]!;
      const shift = BITS_PER_SLOT - 1 - (i % BITS_PER_SLOT);
      value = (value << 1) | ((byte >> shift) & 1);
    }
    return value;
  };

  let text = "";
  for (let position = 0; position + CHAR_BITS <= totalBits; position += CHAR_BITS) {
    const code = read(position, CHAR_BITS);
    const paddedEot = position + CHAR_BITS + 1 <= totalBits && read(position, CHAR_BITS + 1) === EOT;
    if (code === EOT || paddedEot) {
      if (text.length === 0) break;
      return { text };
    }
    if (!isPrintable(code)) break;
    text += String.fromCharCode(code);
  }
  throw new NoMessageError();
}

function isPrintable(code: number): boolean {
  const isTabOrNewline = code === 0x09 || code === 0x0a || code === 0x0d;
  return (code >= 0x20 && code < 0x7f) || isTabOrNewline;
}
