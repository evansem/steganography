# ADR 0005: MySQL on Hostinger for server-side state

**Status:** Accepted

## Context

Justeg is hosted as a Node.js web app on Hostinger Business web hosting. The plan includes MySQL databases (created in hPanel under **Databases → Management**) that the app reaches on `localhost:3306`. It does not offer Redis, Postgres or a writable persistent disk outside the deployment folder, and npm commands cannot be run over SSH, so there is no separate step in which to run migrations.

Before this decision the server kept two pieces of state in memory: the favicon rate limiter and nothing else. Every restart or redeploy reset the limiter, and every favicon lookup went to the remote site even when the same icon had just been fetched.

The core privacy promise (NFR-S1) is that images, messages and passphrases never reach the server. Any database must not weaken that.

## Decision

Use the plan's MySQL database for three server-side concerns only:

| Table | Purpose | Contents |
|---|---|---|
| `rate_limits` | Per-client fixed-window limits that survive restarts. | HMAC-SHA256 of the client address, window start, hit count. |
| `favicon_cache` | 24-hour cache of fetched icons. | Host name, source URL, MIME type, image bytes, fetch time. |
| `usage_counters` | Anonymous totals shown in the footer. | Event name (`hide`, `reveal`, `favicon`) and a number. |

Supporting choices:

- **Driver:** `mysql2/promise` with a pool of 5 connections, the same driver Hostinger's own Node.js guide uses. Shared hosting limits connections per database user, so the pool stays small.
- **Configuration:** `DATABASE_URL` or the `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` variables from Hostinger's guide, set in the website dashboard's **Environment variables**.
- **Migrations run themselves.** On the first request after a deploy the app applies pending migrations inside a `GET_LOCK` so two processes cannot migrate at once. `db/schema.sql` is generated from the same source for anyone who prefers a phpMyAdmin import, and a test keeps them in sync.
- **Portable SQL.** Only features common to MySQL 8 and MariaDB 10.x (`ON DUPLICATE KEY UPDATE` with `VALUES()`, InnoDB, utf8mb4), so it runs on whichever engine the plan provides. CI runs the store tests against MariaDB.
- **No raw addresses.** Rate-limit keys are `HMAC(RATE_LIMIT_SECRET, scope:ip)`. The database cannot be used to list visitors.
- **Optional.** Without database settings the same interfaces are backed by in-memory stores, so local development, tests and preview builds need no database.

## Alternatives considered

- **Keep everything in memory.** Simple, but limits reset on every deploy and the cache is lost.
- **SQLite file.** Hostinger overwrites the deployment folder on each build, so the file would be wiped.
- **A hosted service (Upstash, PlanetScale).** Adds an external dependency, another account and network latency, when the plan already includes MySQL on the same machine.
- **An ORM (Prisma, Drizzle).** Three small tables do not justify a code generator or a migration CLI that cannot run on the host.

## Consequences

- The app now has a data store to secure and back up; Hostinger's backups include databases.
- If the database is misconfigured, the favicon route fails closed with 503 rather than running without a rate limit. `/api/health` reports the database state for diagnosis.
- Favicon lookups for popular sites are served from the cache, which reduces outbound requests and the plan's CPU use.
- A schema change is a new entry in `src/lib/db/migrations.ts`, followed by `npm run db:schema`.
