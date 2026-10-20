import { encodePpm, isNetpbm, NetpbmError, parseNetpbm } from "@/lib/netpbm";
import type { ImageLike } from "@/lib/stego";

/** Hard limits keep memory bounded on phones (NFR-P2). */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_PIXELS = 24_000_000;

export class ImageInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageInputError";
  }
}

export interface LoadedImage extends ImageLike {
  name: string;
  /** "netpbm" for PBM/PGM/PPM files, which the browser cannot decode itself. */
  format: "netpbm" | "browser";
}

/**
 * Decodes an image into raw RGBA pixels. Netpbm files are parsed in
 * TypeScript; everything else goes through the browser's decoder with colour
 * space conversion disabled so the stored bits are read back exactly.
 */
export async function decodeImage(blob: Blob, name = "image"): Promise<LoadedImage> {
  if (blob.size > MAX_FILE_BYTES) {
    throw new ImageInputError(`That file is ${(blob.size / 1e6).toFixed(1)} MB. The limit is 25 MB.`);
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (isNetpbm(bytes)) {
    try {
      return { ...parseNetpbm(bytes, MAX_PIXELS), name, format: "netpbm" };
    } catch (error) {
      throw new ImageInputError(error instanceof NetpbmError ? error.message : "That Netpbm file could not be read.");
    }
  }
  if (blob.type && !blob.type.startsWith("image/")) {
    throw new ImageInputError("That file is not an image.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" });
  } catch {
    throw new ImageInputError("This browser could not decode that image.");
  }

  const { width, height } = bitmap;
  if (width * height > MAX_PIXELS) {
    bitmap.close();
    throw new ImageInputError(`That image is ${width}×${height}. Please use one under 24 megapixels.`);
  }

  const ctx = makeContext(width, height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const { data } = ctx.getImageData(0, 0, width, height);
  return { data, width, height, name, format: "browser" };
}

/** Encodes RGBA pixels as a lossless PNG. */
export async function encodePng(data: Uint8ClampedArray, width: number, height: number): Promise<Blob> {
  const ctx = makeContext(width, height);
  ctx.putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0);
  return new Promise((resolve, reject) =>
    ctx.canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed."))), "image/png"),
  );
}

/** Encodes RGBA pixels as a binary PPM (P6), readable by the 2022 prototype. */
export function encodeNetpbm(data: Uint8ClampedArray, width: number, height: number): Blob {
  return new Blob([encodePpm(data, width, height)], { type: "image/x-portable-pixmap" });
}

/** Renders pixels to an object URL for previews. Caller revokes it. */
export async function toObjectUrl(data: Uint8ClampedArray, width: number, height: number): Promise<string> {
  return URL.createObjectURL(await encodePng(data, width, height));
}

/**
 * Amplifies the lowest bit of every channel to full brightness. Natural
 * photos look like noise here; a sequential plain message shows up as a
 * band across the top of the image.
 */
export function bitPlane(data: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    out[i] = (data[i]! & 1) * 255;
    out[i + 1] = (data[i + 1]! & 1) * 255;
    out[i + 2] = (data[i + 2]! & 1) * 255;
    out[i + 3] = 255;
  }
  return out;
}

const CHANGED_RGB = [212, 255, 58] as const;
const UNCHANGED_RGB = [12, 10, 20] as const;

/** Highlights every changed channel between two images. */
export function difference(a: Uint8ClampedArray, b: Uint8ClampedArray): { pixels: Uint8ClampedArray; changed: number } {
  const out = new Uint8ClampedArray(a.length);
  let changed = 0;
  for (let i = 0; i < a.length; i += 4) {
    let hit = false;
    for (let c = 0; c < 3; c++) {
      if (a[i + c] !== b[i + c]) {
        hit = true;
        changed++;
      }
    }
    const [r, g, bl] = hit ? CHANGED_RGB : UNCHANGED_RGB;
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = bl;
    out[i + 3] = 255;
  }
  return { pixels: out, changed };
}

function makeContext(width: number, height: number): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true, colorSpace: "srgb" });
  if (!ctx) throw new Error("Canvas is not available.");
  return ctx;
}
