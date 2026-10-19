import { NoMessageError } from "./errors";
import { slotCount, type ImageLike } from "./plain";

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
const EOT_7 = 0b0000100;

export function extractLegacy(image: ImageLike): { text: string } {
  const slots = slotCount(image);
  const totalBits = slots * 2;
  const read = (from: number, count: number) => {
    let value = 0;
    for (let i = from; i < from + count; i++) {
      const slot = i >> 1;
      const byte = image.data[Math.floor(slot / 3) * 4 + (slot % 3)]!;
      value = (value << 1) | ((byte >> (1 - (i & 1))) & 1);
    }
    return value;
  };

  let text = "";
  for (let position = 0; position + 7 <= totalBits; position += 7) {
    const ended = read(position, 7) === EOT_7 || (position + 8 <= totalBits && read(position, 8) === EOT_7);
    if (ended) {
      if (text.length === 0) break;
      return { text };
    }
    const code = read(position, 7);
    if (!isPrintable(code)) break;
    text += String.fromCharCode(code);
  }
  throw new NoMessageError();
}

function isPrintable(code: number): boolean {
  return (code >= 0x20 && code < 0x7f) || code === 0x09 || code === 0x0a || code === 0x0d;
}
