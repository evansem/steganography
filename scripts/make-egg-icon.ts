/**
 * Generates src/app/icon.png: Justeg's favicon, with an Easter egg hidden
 * inside it using Justeg itself. Fetch this site's icon in the Favicon tab
 * to find it.
 *
 *   npm run icon
 */
import { writeFileSync } from "node:fs";
import { crc32, deflateSync } from "node:zlib";
import { EGG_MESSAGE, EGG_SIZE, eggIcon } from "../src/lib/egg-icon";
import { extractPlain } from "../src/lib/stego/plain";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Minimal RGBA PNG encoder, so the script needs no image library. */
function png(pixels: Uint8ClampedArray, width: number, height: number): Buffer {
  const chunk = (type: string, body: Buffer) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(body.length, 0);
    head.write(type, 4, "ascii");
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
    return Buffer.concat([head, body, tail]);
  };

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  // each scanline starts with filter type 0 (none)
  const stride = width * 4;
  const rows = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    rows.set(pixels.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const { stego } = eggIcon();
if (extractPlain({ data: stego, width: EGG_SIZE, height: EGG_SIZE }).text !== EGG_MESSAGE) {
  throw new Error("Round trip failed.");
}
writeFileSync(new URL("../src/app/icon.png", import.meta.url), png(stego, EGG_SIZE, EGG_SIZE));
console.log("Wrote src/app/icon.png with a hidden message.");
