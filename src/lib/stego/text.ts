const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

export function encodeUtf8(text: string): Uint8Array {
  return encoder.encode(text);
}

/** Strict UTF-8 decode. Returns null for invalid input instead of inserting U+FFFD. */
export function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return decoder.decode(bytes);
  } catch {
    return null;
  }
}
