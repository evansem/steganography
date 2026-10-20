/**
 * Generates src/app/icon.png: Justeg's favicon, with an Easter egg hidden
 * inside it using Justeg itself. Fetch this site's icon in the Favicon tab
 * to find it.
 *
 *   npm run icon
 */
import { writeFileSync } from "node:fs";
import { crc32, deflateSync } from "node:zlib";
import { embedPlain, extractPlain } from "../src/lib/stego/plain";

const SIZE = 64;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MESSAGE = "🥚 You found the egg! This favicon was written by Justeg. Now hide something of your own.";

/** Linear interpolation between two colours. */
function lerp(a: number[], b: number[], t: number): number[] {
  return a.map((v, i) => Math.round(v + (b[i]! - v) * t));
}

function render(): Uint8ClampedArray {
  const data = new Uint8ClampedArray(SIZE * SIZE * 4);
  const ink = [7, 6, 11];
  const white = [255, 255, 255];
  const glow = [178, 240, 206];
  const uv = [184, 164, 255];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      // Egg: an ellipse whose top half is narrower than its bottom half.
      const nx = (x + 0.5 - 32) / 19;
      const ny = (y + 0.5 - 37) / (y < 37 ? 29 : 19);
      const squeeze = y < 37 ? 1 + 0.25 * Math.abs(ny) : 1;
      const inside = (nx * squeeze) ** 2 + ny ** 2 <= 1;

      let colour = ink;
      if (inside) {
        const d = Math.hypot(x - 24, y - 22) / 40;
        colour = d < 0.25 ? lerp(white, glow, d / 0.25) : lerp(glow, uv, Math.min(1, (d - 0.25) / 0.75));
      }
      const i = (y * SIZE + x) * 4;
      data.set([...colour, 255], i);
    }
  }
  return data;
}

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

const image = { data: render(), width: SIZE, height: SIZE };
const stego = embedPlain(image, MESSAGE, 1);
if (extractPlain({ ...image, data: stego }).text !== MESSAGE) throw new Error("Round trip failed.");
writeFileSync(new URL("../src/app/icon.png", import.meta.url), png(stego, SIZE, SIZE));
console.log("Wrote src/app/icon.png with a hidden message.");
