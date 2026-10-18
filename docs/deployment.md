# Deploying Justeg to Hostinger

Justeg runs as a Node.js web app with a MySQL database on Hostinger's Business web hosting plan (Cloud plans work the same way). It needs a Node runtime, not just static hosting, because the favicon reader, usage counters and health check are server routes. The database is part of the plan; nothing external is required.

```mermaid
flowchart LR
  GH[GitHub: evansem/steganography] -- "push to main" --> Build["Hostinger build<br/>npm ci, npm run build"]
  Build --> App["Node.js web app<br/>npm start"]
  App -- "localhost:3306" --> DB[("MySQL database<br/>created in hPanel")]
  Visitor((Visitor)) -- https --> App
```

## What you need

- Hostinger Business web hosting (or a Cloud plan).
- This repository on GitHub.
- About ten minutes.

## 1. Create the database

1. In hPanel, open **Websites**, choose **Dashboard** for the website, then **Databases → Management**.
2. Under **Create a new MySQL database and database user**, enter a database name and a user name, and generate a strong password. Hostinger prefixes both with your account ID, for example `u123456789_justeg`.
3. Click **Create** and note the full database name, user name and password.

You do not need to create any tables. The app creates them on its first request (see [Schema and migrations](#schema-and-migrations)).

## 2. Create the web app

1. In hPanel, open **Websites → Create website → Web App → Import Git Repository**.
2. Authorise GitHub and pick `evansem/steganography`, branch `main`.
3. Confirm the build settings. Hostinger detects Next.js; check they match:

   | Setting | Value |
   |---|---|
   | Framework | Next.js |
   | Node version | 22.x (20.x also works; `.nvmrc` pins 22) |
   | Install | `npm ci` |
   | Build | `npm run build` |
   | Start | `npm start` |
   | Output directory | `.next` |

4. Click **Deploy**.
5. Attach your domain. A domain already used by another Hostinger website must be removed from it first.

## 3. Set environment variables

In the web app's **Website Dashboard → Environment variables**, add:

| Name | Value |
|---|---|
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_NAME` | the full database name, e.g. `u123456789_justeg` |
| `DB_USER` | the full user name, e.g. `u123456789_app` |
| `DB_PASSWORD` | the password from step 1 |
| `RATE_LIMIT_SECRET` | a random 64-character hex string (`openssl rand -hex 32`) |

Instead of the five `DB_*` variables you can set one `DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/DATABASE`. Percent-encode any special characters in the password.

Click **Apply changes**. Hostinger restarts the app with the new values; no rebuild is needed. Never commit these values: `.env*` files are ignored by git, and [`.env.example`](../.env.example) lists the names only.

`RATE_LIMIT_SECRET` keys the hash used for rate-limit buckets. Without it the app picks a random secret at start-up, which works but resets limits on every restart.

## 4. Check the deployment

1. Open `https://your-domain/api/health`. You should see:

   ```json
   {"status":"ok","database":"connected"}
   ```

   | Response | Meaning |
   |---|---|
   | `"database":"connected"` | Connected and migrated. |
   | `"database":"not configured"` | The `DB_*` variables are missing; the app is running on in-memory stores. |
   | `"database":"unreachable"` (503) | Wrong name, user or password, or the user has no rights on the database. |
   | `"database":"misconfigured"` (503) | `DATABASE_URL` is not a valid `mysql://` URL. |

2. Open the site, hide a message in any photo, download it and reveal it again.
3. In the **Favicon** tab, press **Try Justeg's icon**, then fetch a real site such as `github.com`. A second fetch of the same site returns the header `x-favicon-cache: hit`.
4. The footer shows running totals once something has been counted.
5. Check the response headers include `Content-Security-Policy`, for example with `curl -I https://your-domain`.

In hPanel's **Databases → phpMyAdmin** you should now see the tables `schema_migrations`, `rate_limits`, `favicon_cache` and `usage_counters`.

## Schema and migrations

npm commands cannot be run over SSH on this plan, so the app migrates itself. The first database call after a start-up applies any pending migrations inside a MySQL named lock, so overlapping processes during a redeploy cannot run them twice. Migrations only ever add; a redeploy never drops data.

If you prefer to create the tables yourself, open **phpMyAdmin**, select the database, choose **Import** and upload [`db/schema.sql`](../db/schema.sql). It records itself in `schema_migrations`, so the app will not try again.

## Updates, backups and data

- Every push to `main` redeploys automatically. A failed build leaves the previous version live. Hostinger keeps the two most recent builds.
- Files under `public_html` and `hbuilds/` are overwritten on each deployment. Change the source and push instead of editing on the server. The database is not touched by deployments.
- Hostinger's backups include databases. To take one yourself, use phpMyAdmin's **Export**.
- What is stored: hashed rate-limit buckets (no IP addresses), cached favicons for 24 hours, and three counters. No images, messages, passphrases or file names. Clearing any table is safe; the app rebuilds what it needs.

## Running locally

```bash
nvm use            # Node 22
npm ci
npm run dev        # http://localhost:3000, in-memory stores
npm test           # unit tests
npm run build && npm start   # production build
```

To use a local MySQL or MariaDB, copy `.env.example` to `.env.local` and fill in the `DB_*` values. Other scripts:

| Command | Does |
|---|---|
| `npm run db:migrate` | Applies pending migrations to the configured database. |
| `npm run db:schema` | Regenerates `db/schema.sql` after editing `src/lib/db/migrations.ts`. |
| `TEST_DATABASE_URL=mysql://… npm test` | Also runs the store tests against a real server. **They drop the tables**, so use a throwaway database. |
| `npm run icon` | Regenerates `src/app/icon.png` with its hidden message. |
