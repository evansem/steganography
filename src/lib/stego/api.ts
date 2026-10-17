import type { BitDepth } from "./lsb";
import { embedPlain, extractPlain, plainCapacity, type ImageLike } from "./plain";
import { embedSealed, extractSealed, sealedCapacity } from "./sealed";

export interface HideOptions {
  /** Encrypts and scatters the message when set. */
  passphrase?: string;
  depth?: BitDepth;
}

export interface Revealed {
  text: string;
  depth: BitDepth;
  encrypted: boolean;
}

export function capacity(image: ImageLike, options: HideOptions = {}): number {
  const depth = options.depth ?? 1;
  return options.passphrase ? sealedCapacity(image, depth) : plainCapacity(image, depth);
}

export async function hide(image: ImageLike, text: string, options: HideOptions = {}) {
  const depth = options.depth ?? 1;
  return options.passphrase
    ? embedSealed(image, text, options.passphrase, depth)
    : embedPlain(image, text, depth);
}

export async function reveal(image: ImageLike, passphrase?: string): Promise<Revealed> {
  if (passphrase) return { ...(await extractSealed(image, passphrase)), encrypted: true };
  return { ...extractPlain(image), encrypted: false };
}
