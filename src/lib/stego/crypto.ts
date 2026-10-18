/**
 * Passphrase-based key material using only the Web Crypto API, so the same
 * code runs in the browser and in Node for tests.
 */
export const PBKDF2_ITERATIONS = 600_000; // OWASP 2023 guidance for PBKDF2-SHA256
export const SALT_BYTES = 16;
export const IV_BYTES = 12;
export const TAG_BYTES = 16;

export interface KeyMaterial {
  aesKey: CryptoKey;
  scatterKey: Uint32Array;
}

export async function deriveKeys(passphrase: string, salt: Uint8Array): Promise<KeyMaterial> {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase.normalize("NFC")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS },
      base,
      512,
    ),
  );
  const aesKey = await crypto.subtle.importKey("raw", bits.slice(0, 32), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
  return { aesKey, scatterKey: new Uint32Array(bits.slice(32).buffer) };
}

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export async function seal(
  key: CryptoKey,
  iv: Uint8Array,
  plaintext: Uint8Array,
  aad: Uint8Array,
): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource, additionalData: aad as BufferSource },
      key,
      plaintext as BufferSource,
    ),
  );
}

/** Returns null when authentication fails (wrong key or tampered data). */
export async function open(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: Uint8Array,
  aad: Uint8Array,
): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as BufferSource, additionalData: aad as BufferSource },
        key,
        ciphertext as BufferSource,
      ),
    );
  } catch {
    return null;
  }
}
