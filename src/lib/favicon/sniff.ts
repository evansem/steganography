/** Identifies raster image formats from magic bytes, ignoring headers. */
export type IconFormat = "png" | "ico" | "gif" | "jpeg" | "webp" | "bmp";

export const MIME: Record<IconFormat, string> = {
  png: "image/png",
  ico: "image/x-icon",
  gif: "image/gif",
  jpeg: "image/jpeg",
  webp: "image/webp",
  bmp: "image/bmp",
};

export function sniffImage(bytes: Uint8Array): IconFormat | null {
  const at = (i: number) => bytes[i] ?? -1;
  const ascii = (start: number, text: string) => [...text].every((c, i) => at(start + i) === c.charCodeAt(0));

  if (at(0) === 0x89 && ascii(1, "PNG")) return "png";
  if (at(0) === 0 && at(1) === 0 && at(2) === 1 && at(3) === 0) return "ico";
  if (ascii(0, "GIF8")) return "gif";
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "jpeg";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "webp";
  if (ascii(0, "BM")) return "bmp";
  return null;
}
