# ADR 0005: Decode Netpbm in TypeScript and read the prototype's format

**Status:** Accepted

## Context

The 2022 prototype only handled binary Netpbm files (`P6` rasters saved with a `.pbm` extension), and its sample images, some with hidden messages, still ship in `legacy/python`. Version 2 relied on the browser's image decoder, which does not support any Netpbm format, so those files could not be opened at all. The prototype's container (7-bit ASCII in two LSBs per byte, terminated by EOT) was listed as out of scope.

## Decision

- Parse Netpbm (`P1` to `P6`, ASCII and binary, any maxval) in a small pure TypeScript module and produce the same RGBA layout the canvas path does. Detect it by magic bytes rather than file extension or MIME type, which most systems leave empty for these formats.
- When the cover is Netpbm, offer a binary `P6` download alongside the PNG, keeping the source's extension. Write width and height on separate header lines, the layout the prototype's reader expected.
- Read the prototype's container as a fallback only: for Netpbm images, without a passphrase, after the current format has not been found. Never write it.

## Consequences

- The prototype's own samples open and reveal their messages, which keeps the project's history demonstrable (FR-16).
- The legacy format has no signature, so a fallback read can in principle return a false positive. Restricting it to Netpbm images, requiring non-empty printable ASCII and requiring the terminator keeps that unlikely, and the result is labelled with its format.
- The codec is unit tested in Node like the steganography core (NFR-Q1), with no new dependencies.
- Netpbm files are uncompressed, so they are large. PNG stays the default download.
