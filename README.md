# Justeg

**Hide words in plain sight.** Justeg is a browser steganography lab: it writes a secret message into the lowest bits of an image's pixels, optionally encrypted, and reads it back. Nothing is uploaded; every pixel is processed on your device.

![Justeg hero](docs/images/hero.png)

The name comes from the idea behind it: **ju**st a simple **steg**anography tool. It also sounds a bit like an Easter egg, the hidden jokes developers leave in their programs, which is exactly what Justeg is for: hiding funny messages in small images or a website's favicon.

## What it does

- **Hide** any Unicode message in a PNG, JPEG, WebP, GIF, BMP, ICO or Netpbm (PBM/PGM/PPM) image and download the result as a lossless PNG, or as PPM for Netpbm covers.
- **Encrypt** with a passphrase: AES-256-GCM, a PBKDF2-SHA256 key (600k iterations), and bits scattered across the image by a keyed permutation. Without the passphrase there is nothing to find.
- **Reveal** messages, with automatic detection of 1- or 2-bit depth and tamper detection.
- **Inspect** any image's lowest bit plane, and after hiding, see a map of every channel that changed.
- **Read 2022 messages** from the original prototype's PBM images.
- **Read favicons** from any website. Try Justeg's own icon: there is an egg in it.

| Hide, then inspect the changes | Read a favicon |
|---|---|
| ![Changes view](docs/images/hide-changes.png) | ![Favicon Easter egg](docs/images/favicon-egg.png) |

## Engineering

| | |
|---|---|
| [How it works](docs/how-it-works.md) | LSB steganography from the pixel up, with diagrams and a worked example |
| [Requirements](docs/requirements.md) | Functional and non-functional requirements with IDs |
| [Architecture](docs/architecture.md) | Modules, data formats, flows and test strategy |
| [Threat model](docs/threat-model.md) | STRIDE analysis and honest limits |
| [Decisions](docs/adr/) | Why client-side, why a length header, why Feistel, how the proxy is hardened |

**Stack:** Next.js 16, React 19, TypeScript (strict), Web Crypto, Vitest, ESLint, Prettier, GitHub Actions.

## Quick start

```bash
npm ci
npm run dev
```

Then open http://localhost:3000.

Before pushing, run the same checks as CI:

```bash
npm run format:check   # Prettier; `npm run format` fixes it
npm run lint
npm run typecheck
npm test
```

For production, any Node.js 20.9+ host works: `npm ci`, `npm run build`, then `npm start`. The favicon reader needs a Node runtime, so a purely static host is not enough.

Each GitHub release also ships a prebuilt bundle with a signed build provenance attestation. Verify it before deploying, then install runtime dependencies and start:

```bash
gh attestation verify justeg-<version>.tar.gz --repo evansem/steganography
tar -xzf justeg-<version>.tar.gz && npm ci --omit=dev && npm start
```

## Limits

LSB steganography does not survive lossy recompression. Re-saving as JPEG, resizing or sending through most chat and social apps destroys the message, so share the PNG as a file. Statistical analysis can suggest that an image was edited even when it cannot read the message. Unencrypted mode is hidden, not secret.

## History

Justeg started in 2022 as a Python/Tkinter desktop app that hid 7-bit ASCII in PBM images with an end-of-transmission marker. That version lives in [`legacy/python`](legacy/python). Version 2 keeps the idea and fixes its weaknesses: no encryption, a predictable marker, sequential embedding and ASCII-only text. It still opens the prototype's PBM files and reads the messages hidden in its samples.

<details>
<summary>Screenshots of the 2022 version</summary>

| Before | After |
|:---:|:---:|
| ![](doc/encrypt_screenshot.png) | ![](doc/encrypt_screenshot_success.png) |
| ![](doc/decrypt_screenshot.png) | ![](doc/decrypt_screenshot_success.png) |

</details>
