# Deploying Justeg to Hostinger

Justeg runs as a Node.js web app on Hostinger's Business web hosting (or any Cloud plan). It needs a Node runtime, not just static hosting, because the favicon reader has a server route.

## Requirements

- Hostinger Business web hosting or a Cloud plan (both support Node.js web apps).
- Node.js 22.x selected in the app settings (20.x also works; `.nvmrc` pins 22).
- This repository on GitHub.

## First deployment

1. In hPanel, open **Websites → Create website → Web App → Import Git Repository**.
2. Authorise GitHub and pick `evansem/steganography`, branch `main`.
3. Confirm the build settings. Hostinger detects Next.js; check they match:

   | Setting | Value |
   |---|---|
   | Framework | Next.js |
   | Node version | 22.x |
   | Install | `npm ci` |
   | Build | `npm run build` |
   | Start | `npm start` |
   | Output directory | `.next` |

4. Click **Deploy**. No environment variables are needed.
5. Attach your domain. A domain already used by another Hostinger website must be removed from it first.

Every push to `main` redeploys automatically. A failed build leaves the previous version live.

## After deploying

- Open the site, hide a message in any photo, download it and reveal it again.
- In the **Favicon** tab, press **Try Justeg's icon** to confirm the Easter egg reads correctly, then fetch a real site such as `github.com` to confirm outbound requests work.
- Check the response headers include `Content-Security-Policy` (for example with `curl -I https://your-domain`).

## Hosting sample images

Justeg is stateless: it has no database and nothing is uploaded, so the server never stores anything at run time. Sample images for visitors to try are therefore part of the build, not something added on the server.

### Recommended: ship them in `public/`

Put the files in the repository under `public/samples/` and push. Next.js serves everything in `public/` from the site root, so `public/samples/hidden-message.png` becomes `https://your-domain/samples/hidden-message.png`. Hostinger builds from Git, so the images deploy with every push and are versioned with the code that reads them.

```
public/
  samples/
    original.png          # untouched cover image
    hidden-message.png    # same image with a plain message hidden by Justeg
    sealed-message.png    # optional: encrypted, passphrase given in the page copy
```

Rules that keep the hidden messages intact:

- **PNG only.** Any lossy format (JPEG, lossy WebP) rewrites the low bits and destroys the message.
- **Create the samples with Justeg itself.** Hide the message in the running app and download the PNG. Do not resize, compress or "optimise" the downloaded file afterwards; tools such as TinyPNG quantise colours and wipe the payload.
- **Link the files directly.** Use a plain `<a href="/samples/…">` or `fetch("/samples/…")`. Do not render them through `next/image`, whose optimiser re-encodes images. The same applies to any image optimisation or "polish" setting on a CDN or proxy in front of the site.
- **Keep them small.** A few hundred KB to about 2 MB each keeps the repository and deploys light. They load from the same origin, so the existing Content-Security-Policy (`img-src 'self'` and `connect-src 'self'`) already allows them.

Check after deploying: download a sample from the live site, then reveal it in Justeg. If the message comes back, nothing in the delivery path altered the pixels.

### What not to do

- **Uploading through File Manager, FTP or SSH.** Files under `public_html` and `hbuilds/` are managed by the deployment system and overwritten on every deployment, so manual uploads disappear on the next push ([Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger)).
- **A separate image host.** It adds a third-party origin that the CSP would have to allow, which weakens NFR-S7 for no gain at this size.

### Converting the 2022 samples

`legacy/python/sample_images/` holds the prototype's images. Despite the `.pbm` extension they are binary PPM (`P6`) files, which browsers cannot open, and the prototype's hidden-message format is not readable by Justeg v2. To reuse the pictures:

1. Convert the clean original to PNG, for example `magick legacy/python/sample_images/1.original_sample_img.pbm public/samples/original.png` with ImageMagick 7 (`convert` on ImageMagick 6), or any editor that exports PNG.
2. Open `original.png` in Justeg, hide a new message, and save the download as `public/samples/hidden-message.png`.
3. Skip `2.hidden_hello_world.pbm`: its message uses the old format and would not reveal.

## Notes

- Files under `public_html` and `hbuilds/` are overwritten on each deployment. Change the source and push instead of editing on the server.
- npm commands cannot be run over SSH on this plan; they run during deployment.
- The favicon rate limiter keeps state in memory, so it resets when the app restarts.

## Running locally

```bash
nvm use            # Node 22
npm ci
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run build && npm start   # production build
```

`npm run icon` regenerates `src/app/icon.png` with its hidden message.
