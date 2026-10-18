# ADR 0003: Scatter bits with a keyed Feistel permutation

**Status:** Accepted

## Context

Sequential embedding leaves every change in the first rows of the image, which a bit-plane view shows instantly. Scattering needs a key-dependent permutation of up to 72 million slots. A shuffled index array would need hundreds of megabytes.

## Decision

Use a 4-round balanced Feistel network over the smallest power-of-four domain that covers the slots, with cycle-walking to land inside the real range. Round keys come from PBKDF2 output. The round function is the MurmurHash3 finaliser.

## Consequences

- O(1) memory and a few multiplications per slot (NFR-P3).
- The permutation is a bijection by construction, tested on sizes from 1 to 12,345.
- It is not a cryptographic PRP and does not need to be: confidentiality and integrity come from AES-GCM. Its job is to remove positional patterns and hide which slots are used.
