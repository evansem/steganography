import mysql, { type Pool } from "mysql2/promise";
import type { DbConfig } from "./config";
import { MIGRATIONS, MIGRATIONS_TABLE } from "./migrations";

/**
 * One small pool per process. Shared hosting caps connections per user, so
 * the pool stays at 5. The pool is kept on globalThis so dev hot reloads do
 * not open new ones.
 */
const POOL_SIZE = 5;

const cache = globalThis as unknown as { __justegPool?: { key: string; pool: Pool; ready: Promise<void> } };

export function getDatabase(config: DbConfig): { pool: Pool; ready: Promise<void> } {
  const key = `${config.user}@${config.host}:${config.port}/${config.database}`;
  if (cache.__justegPool?.key !== key) {
    const pool = mysql.createPool({
      ...config,
      connectionLimit: POOL_SIZE,
      waitForConnections: true,
      enableKeepAlive: true,
      supportBigNumbers: true,
      bigNumberStrings: false,
    });
    const ready = migrate(pool).then(() => undefined);
    // A failed migration should be retried on the next request, not cached.
    ready.catch(() => {
      if (cache.__justegPool?.pool === pool) delete cache.__justegPool;
      void pool.end().catch(() => {});
    });
    cache.__justegPool = { key, pool, ready };
  }
  return cache.__justegPool;
}

/**
 * Applies pending migrations. A named lock stops two processes (for example
 * during a Hostinger redeploy) from migrating at the same time.
 */
export async function migrate(pool: Pool): Promise<number[]> {
  const conn = await pool.getConnection();
  try {
    const [lock] = await conn.query("SELECT GET_LOCK('justeg_migrate', 15) AS ok");
    if ((lock as { ok: number }[])[0]?.ok !== 1) throw new Error("Could not acquire the migration lock.");
    try {
      await conn.query(MIGRATIONS_TABLE);
      const [rows] = await conn.query("SELECT id FROM schema_migrations");
      const done = new Set((rows as { id: number }[]).map((r) => r.id));
      const applied: number[] = [];
      for (const migration of MIGRATIONS) {
        if (done.has(migration.id)) continue;
        for (const statement of migration.statements) await conn.query(statement);
        await conn.query("INSERT INTO schema_migrations (id, name) VALUES (?, ?)", [migration.id, migration.name]);
        applied.push(migration.id);
      }
      return applied;
    } finally {
      await conn.query("SELECT RELEASE_LOCK('justeg_migrate')");
    }
  } finally {
    conn.release();
  }
}
