# Justeg requirements

Justeg hides text inside images using least-significant-bit (LSB) steganography. Version 2 rebuilds the 2022 Python/Tkinter prototype as a web app that runs on Hostinger Business web hosting.

This document states what the app must do (functional requirements), how well it must do it (non-functional requirements), and what is deliberately out of scope. Each requirement has an ID so code, tests and pull requests can refer to it.

## Goals

1. Let anyone hide a short message in an image, and recover it, from a browser on any device.
2. Keep the user's images and messages private: they never leave the device.
3. Fix the prototype's known weaknesses: no encryption, a predictable end marker, sequential embedding that is easy to spot, ASCII-only text and PBM-only files.
4. Serve as a portfolio piece that shows requirements, architecture, security reasoning, tests and CI, not only a UI.

## Users and scenarios

| Persona | Scenario |
|---|---|
| Curious visitor | Lands on the site, hides "hello" in a photo, downloads it, reveals it again, and looks at the bit-plane view to understand how it works. |
| Two friends | One hides an encrypted note in a holiday photo and sends the PNG as a file; the other reveals it with a passphrase shared in person. |
| Easter-egg hunter | Pastes a website address and checks whether its favicon carries a hidden message. |
| Reviewer / recruiter | Reads the README, requirements and threat model, skims the tests and CI, and opens the live demo. |

## Functional requirements

### Hiding

| ID | Requirement |
|---|---|
| FR-1 | The user can choose a cover image by file picker or drag and drop. Any format the browser can decode is accepted (PNG, JPEG, WebP, GIF, BMP, ICO). |
| FR-2 | The user can type a message of any Unicode text, stored as UTF-8. |
| FR-3 | The app shows, live, how many bytes the message uses and how many the image can hold with the current settings, and blocks hiding when it does not fit. |
| FR-4 | The user can choose 1 bit per channel ("stealth") or 2 bits per channel ("capacity"). |
| FR-5 | The user can optionally protect the message with a passphrase. Encryption is on by default. |
| FR-6 | The result is offered as a lossless PNG download. |
| FR-7 | After hiding, the user can compare the original and encoded images: the encoded image, its lowest bit plane, and a map of every changed channel with a count. |

### Revealing

| ID | Requirement |
|---|---|
| FR-8 | The user can load an image and reveal a hidden message, entering a passphrase when one was used. |
| FR-9 | The app detects the bit depth automatically. |
| FR-10 | A wrong passphrase, a tampered image and an image with no message all produce the same clear "no message found" result, never garbled text. |
| FR-11 | The revealed text can be copied to the clipboard and is labelled as encrypted-and-verified or unencrypted. |
| FR-12 | The user can view any loaded image's lowest bit plane, to inspect it for hidden data. |

### Favicon reader

| ID | Requirement |
|---|---|
| FR-13 | The user can enter a website address and the app fetches that site's favicon. |
| FR-14 | The fetched icon opens in the reveal tool so it can be inspected and read like any other image. |
| FR-15 | Justeg's own favicon carries a hidden message, so the feature can be demonstrated without a third-party site. |

## Non-functional requirements

### Security and privacy

| ID | Requirement |
|---|---|
| NFR-S1 | Images and messages are processed only in the browser. The server never receives them. |
| NFR-S2 | Encrypted messages use authenticated encryption (AES-256-GCM) with a key derived from the passphrase by PBKDF2-SHA256 at ≥ 600,000 iterations and a random 16-byte salt per image. |
| NFR-S3 | Encrypted payloads carry no fixed signature, and their bits are scattered across the image by a key-dependent permutation. |
| NFR-S4 | The favicon proxy cannot be used for server-side request forgery: it reaches only public http(s) hosts on standard ports, re-checks every redirect, validates the resolved IP address at connect time, enforces size and time limits, and returns only raster images verified by their magic bytes. |
| NFR-S5 | The favicon proxy is rate limited per client. |
| NFR-S6 | Every response sends a restrictive Content-Security-Policy and standard hardening headers (nosniff, frame denial, Referrer-Policy, Permissions-Policy, COOP, HSTS). |
| NFR-S7 | No third-party scripts, fonts or trackers are loaded. |
| NFR-S8 | Runtime dependencies have no known high-severity vulnerabilities, checked in CI. |

### Correctness and quality

| ID | Requirement |
|---|---|
| NFR-Q1 | The steganography core is pure TypeScript with no browser or framework dependencies, so it can be unit tested in Node. |
| NFR-Q2 | Every pull request must pass lint, type-check, unit tests and a production build in CI. |
| NFR-Q3 | Round-trip tests cover both bit depths, both modes, Unicode, empty and exactly-full messages, wrong passphrases and tampering. |

### Performance

| ID | Requirement |
|---|---|
| NFR-P1 | Hiding or revealing an unencrypted message in a 12-megapixel photo completes in under 2 seconds on a mid-range laptop. Key derivation adds under 1 second. |
| NFR-P2 | Input is capped at 25 MB and 24 megapixels to keep memory bounded on phones. |
| NFR-P3 | The keyed permutation uses O(1) memory regardless of image size. |

### Usability and accessibility

| ID | Requirement |
|---|---|
| NFR-U1 | The layout works from 360 px wide phones to desktop without horizontal scrolling. |
| NFR-U2 | All controls are keyboard operable with visible focus, form fields have labels, and status changes are announced to screen readers. |
| NFR-U3 | Animations are disabled when the user prefers reduced motion. |
| NFR-U4 | Error messages say what happened and what to do next. |

### Operability

| ID | Requirement |
|---|---|
| NFR-O1 | The app deploys to Hostinger Business web hosting as a Node.js web app built with `npm run build` and run with `npm start`. |
| NFR-O2 | The app runs on Node.js 20.9 or later. |

## Out of scope

- Surviving lossy recompression, resizing or social-media upload. LSB data does not survive these; the UI says so.
- Hiding files or images inside images.
- Reading images produced by the 2022 Python prototype (raw PBM bytes with a 7-bit EOT marker).
- Accounts, storage, or sharing images through the server.
