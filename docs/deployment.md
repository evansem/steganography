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
