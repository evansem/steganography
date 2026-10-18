# ADR 0001: Process images in the browser

**Status:** Accepted

## Context

The Python prototype ran locally, so images never left the user's machine. A web version could process images on the server (simpler with native libraries) or in the browser.

## Decision

All decoding, embedding, encryption and encoding happens in the browser. The server never receives an image, message or passphrase.

## Consequences

- Privacy is a property of the architecture, not a policy promise (NFR-S1).
- Server cost on the Hostinger plan stays near zero: the page is static.
- The core must avoid Node-only APIs. It uses Web Crypto, available in both browsers and Node 20+, so it is still unit tested in Node.
- Very large images are limited by the device's memory, hence the 24 MP cap.
