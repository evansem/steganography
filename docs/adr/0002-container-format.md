# ADR 0002: Length-prefixed container instead of an end marker

**Status:** Accepted

## Context

The prototype appended a 7- or 8-bit "end of transmission" pattern and stored text as 7-bit ASCII. That broke for Unicode, could stop early if the pattern appeared in the data, and gave attackers a fixed pattern to search for.

## Decision

- Plain mode: a 4-byte magic, a version byte and a 32-bit length, then UTF-8.
- Sealed mode: no magic. A random salt in the first slots, then a length, IV and AES-GCM ciphertext through a keyed scatter order.

## Consequences

- Any Unicode text works and the reader knows exactly how much to read (FR-2).
- Plain images are recognisable by their magic, which is fine: plain mode is "hidden, not secret".
- Sealed images have no signature; the only way to confirm a message is to hold the passphrase (NFR-S3).
- The version byte leaves room for future formats.
