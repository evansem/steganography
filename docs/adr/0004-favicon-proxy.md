# ADR 0004: A hardened server proxy for favicons

**Status:** Accepted

## Context

Reading a favicon's pixels requires the image to be same-origin (or served with CORS), otherwise the canvas is tainted. Most sites do not send CORS headers for their icons, so the browser cannot read them directly.

## Decision

Add `GET /api/favicon?site=…`, which fetches the icon server-side and returns the raw bytes. The proxy is treated as the app's main attack surface:

- `node:http(s)` with a custom `lookup` that rejects private, loopback, link-local, CGNAT, multicast and reserved IPv4/IPv6 addresses. Because the check runs at connect time, DNS rebinding cannot swap the address after validation.
- Scheme, port and credential allow-lists; literal IPs checked before any request.
- Manual redirects, each re-validated, at most three.
- Streaming size caps and timeouts.
- Only raster images verified by magic bytes; SVG is never fetched.
- Per-IP fixed-window rate limit.

## Consequences

- The app needs a Node runtime rather than a pure static export. Hostinger Business supports Node.js apps.
- The proxy sees which sites a visitor looks up, but never their images.
- The in-memory rate limiter does not coordinate across instances. Hostinger runs one instance per app, so this is acceptable.
