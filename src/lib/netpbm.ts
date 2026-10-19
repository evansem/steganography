/**
 * Netpbm reader and writer (PBM, PGM, PPM: P1–P6).
 *
 * Browsers cannot decode Netpbm, so these files are parsed here into the same
 * RGBA layout a canvas produces. Pure TypeScript, no DOM, so it is unit tested
 * in Node like the steganography core.
 */

export interface NetpbmImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export class NetpbmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetpbmError";
  }
}

export const NETPBM_EXTENSIONS = [".pbm", ".pgm", ".ppm", ".pnm"] as const;

/** True when `bytes` start with a Netpbm magic number ("P1" to "P6"). */
export function isNetpbm(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0x50 && bytes[1]! >= 0x31 && bytes[1]! <= 0x36 && isSpace(bytes[2]!);
}

/**
 * Decodes the first image in a Netpbm file to opaque RGBA. Samples with a
 * maxval other than 255 are rescaled to 0–255. `maxPixels` is checked before
 * any pixel buffer is allocated.
 */
export function parseNetpbm(bytes: Uint8Array, maxPixels = Infinity): NetpbmImage {
  if (!isNetpbm(bytes)) throw new NetpbmError("Not a Netpbm file.");
  const kind = bytes[1]! - 0x30;
  const bitmap = kind === 1 || kind === 4;
  const binary = kind >= 4;
  const channels = kind === 3 || kind === 6 ? 3 : 1;

  const reader = new HeaderReader(bytes, 2);
  const width = reader.int();
  const height = reader.int();
  const maxval = bitmap ? 1 : reader.int();
  if (width < 1 || height < 1) throw new NetpbmError("Netpbm image has no pixels.");
  if (maxval < 1 || maxval > 65535) throw new NetpbmError("Netpbm maxval must be between 1 and 65535.");
  if (width * height > maxPixels) {
    throw new NetpbmError(`That image is ${width}×${height}. Please use one under ${maxPixels / 1e6} megapixels.`);
  }

  const count = width * height * channels;
  let samples: ArrayLike<number>;
  if (!binary) {
    samples = bitmap ? reader.bits(count) : reader.ints(count);
  } else {
    // exactly one whitespace byte separates the header from the raster
    const start = reader.position + 1;
    samples = bitmap ? unpackBits(bytes, start, width, height) : readBinary(bytes, start, count, maxval);
  }

  const data = new Uint8ClampedArray(width * height * 4);
  const scale = (value: number) => {
    if (bitmap) return value ? 0 : 255;
    return maxval === 255 ? value : Math.round((value * 255) / maxval);
  };
  for (let p = 0, s = 0; p < width * height; p++, s += channels) {
    const o = p * 4;
    const r = scale(samples[s]!);
    data[o] = r;
    data[o + 1] = channels === 3 ? scale(samples[s + 1]!) : r;
    data[o + 2] = channels === 3 ? scale(samples[s + 2]!) : r;
    data[o + 3] = 255;
  }
  return { data, width, height };
}

/**
 * Encodes RGBA pixels as a binary PPM (P6, maxval 255); alpha is dropped.
 *
 * Width and height go on separate lines, matching the 2022 prototype, whose
 * reader assumed a four-line header.
 */
export function encodePpm(data: Uint8ClampedArray, width: number, height: number): Uint8Array<ArrayBuffer> {
  const header = new TextEncoder().encode(`P6\n${width}\n${height}\n255\n`);
  const out = new Uint8Array(header.length + width * height * 3);
  out.set(header, 0);
  for (let p = 0, o = header.length; p < width * height; p++) {
    out[o++] = data[p * 4]!;
    out[o++] = data[p * 4 + 1]!;
    out[o++] = data[p * 4 + 2]!;
  }
  return out;
}

function isSpace(byte: number): boolean {
  return byte === 0x20 || byte === 0x09 || byte === 0x0a || byte === 0x0d || byte === 0x0b || byte === 0x0c;
}

function isDigit(byte: number): boolean {
  return byte >= 0x30 && byte <= 0x39;
}

/** Reads whitespace-separated tokens, skipping "#" comments. */
class HeaderReader {
  constructor(
    private readonly bytes: Uint8Array,
    public position: number,
  ) {}

  private skip() {
    const { bytes } = this;
    while (this.position < bytes.length) {
      const byte = bytes[this.position]!;
      if (byte === 0x23) {
        while (this.position < bytes.length && bytes[this.position] !== 0x0a && bytes[this.position] !== 0x0d) {
          this.position++;
        }
      } else if (isSpace(byte)) {
        this.position++;
      } else {
        return;
      }
    }
  }

  int(): number {
    this.skip();
    let value = 0;
    let digits = 0;
    while (this.position < this.bytes.length && isDigit(this.bytes[this.position]!)) {
      value = value * 10 + (this.bytes[this.position++]! - 0x30);
      if (++digits > 9) throw new NetpbmError("Netpbm header value is too large.");
    }
    if (digits === 0) throw new NetpbmError("Netpbm header is malformed.");
    return value;
  }

  ints(count: number): Uint16Array {
    const out = new Uint16Array(count);
    for (let i = 0; i < count; i++) out[i] = this.int();
    return out;
  }

  /** P1 rasters may pack digits with no whitespace between them. */
  bits(count: number): Uint8Array {
    const out = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
      this.skip();
      const byte = this.bytes[this.position++];
      if (byte !== 0x30 && byte !== 0x31) throw new NetpbmError("Netpbm bitmap is truncated or malformed.");
      out[i] = byte - 0x30;
    }
    return out;
  }
}

function readBinary(bytes: Uint8Array, start: number, count: number, maxval: number): ArrayLike<number> {
  const wide = maxval > 255;
  const end = start + count * (wide ? 2 : 1);
  if (end > bytes.length) throw new NetpbmError("Netpbm file is truncated.");
  if (!wide) return bytes.subarray(start, end);
  const out = new Uint16Array(count);
  for (let i = 0; i < count; i++) out[i] = (bytes[start + i * 2]! << 8) | bytes[start + i * 2 + 1]!;
  return out;
}

/** P4 rows are packed eight pixels per byte, most significant bit first. */
function unpackBits(bytes: Uint8Array, start: number, width: number, height: number): Uint8Array {
  const rowBytes = Math.ceil(width / 8);
  if (start + rowBytes * height > bytes.length) throw new NetpbmError("Netpbm file is truncated.");
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      out[y * width + x] = (bytes[start + y * rowBytes + (x >> 3)]! >> (7 - (x & 7))) & 1;
    }
  }
  return out;
}
