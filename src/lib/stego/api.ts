import { NoMessageError } from "./errors";
import { extractLegacy } from "./legacy";
import type { BitDepth } from "./lsb";
import { embedPlain, extractPlain, plainCapacity, type ImageLike } from "./plain";
import { embedSealed, extractSealed, sealedCapacity } from "./sealed";

export interface HideOptions {
  /** Encrypts and scatters the message when set. */
  passphrase?: string;
  depth?: BitDepth;
}

export interface RevealOptions {
  /** Also look for a message written by the 2022 prototype. */
  legacy?: boolean;
}

export interface Revealed {
  text: string;
  depth: BitDepth;
  encrypted: boolean;
  /** True when the message was written by the 2022 prototype. */
  legacy?: boolean;
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

export async function reveal(image: ImageLike, passphrase?: string, options: RevealOptions = {}): Promise<Revealed> {
  if (passphrase) return { ...(await extractSealed(image, passphrase)), encrypted: true };
  try {
    return { ...extractPlain(image), encrypted: false };
  } catch (error) {
    if (!options.legacy || !(error instanceof NoMessageError)) throw error;
    return { ...extractLegacy(image), depth: 2, encrypted: false, legacy: true };
  }
}
