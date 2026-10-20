import { NoMessageError } from "./errors";
import { extractLegacy } from "./legacy";
import type { BitDepth } from "./lsb";
import type { ImageLike } from "./pixels";
import { embedPlain, extractPlain, plainCapacity } from "./plain";
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

const DEFAULT_DEPTH: BitDepth = 1;
/** Bit depth the 2022 prototype always wrote at. */
const LEGACY_DEPTH: BitDepth = 2;

/** Maximum UTF-8 bytes a message can use in this image with these options. */
export function capacity(image: ImageLike, options: HideOptions = {}): number {
  const depth = options.depth ?? DEFAULT_DEPTH;
  return options.passphrase ? sealedCapacity(image, depth) : plainCapacity(image, depth);
}

/** Returns a copy of the image's pixels with `text` hidden inside. */
export async function hide(image: ImageLike, text: string, options: HideOptions = {}): Promise<Uint8ClampedArray> {
  const depth = options.depth ?? DEFAULT_DEPTH;
  return options.passphrase ? embedSealed(image, text, options.passphrase, depth) : embedPlain(image, text, depth);
}

/**
 * Finds a message: sealed when a passphrase is given, otherwise plain, then
 * (when asked) the 2022 prototype format. Throws {@link NoMessageError}.
 */
export async function reveal(image: ImageLike, passphrase?: string, options: RevealOptions = {}): Promise<Revealed> {
  if (passphrase) return { ...(await extractSealed(image, passphrase)), encrypted: true };
  try {
    return { ...extractPlain(image), encrypted: false };
  } catch (error) {
    if (!options.legacy || !(error instanceof NoMessageError)) throw error;
    return { ...extractLegacy(image), depth: LEGACY_DEPTH, encrypted: false, legacy: true };
  }
}
