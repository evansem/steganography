/**
 * Database helpers.
 *   npm run db:schema   writes db/schema.sql (for phpMyAdmin import)
 *   npm run db:migrate  applies pending migrations using DB_* or DATABASE_URL
 *
 * The app also migrates itself on first use, so neither is required on
 * Hostinger; they exist for local work and for manual setups.
 */
import { writeFileSync } from "node:fs";
import { readDbConfig } from "../src/lib/db/config";
import mysql from "mysql2/promise";
import { migrate } from "../src/lib/db/pool";
import { schemaSql } from "../src/lib/db/migrations";

async function main(command: string | undefined) {
  if (command === "schema") {
    writeFileSync("db/schema.sql", schemaSql());
    console.log("Wrote db/schema.sql");
    return;
  }
  if (command === "migrate") {
    const config = readDbConfig();
    if (!config) throw new Error("Set DATABASE_URL or DB_NAME and DB_USER first.");
    const pool = mysql.createPool({ ...config, connectionLimit: 1 });
    const applied = await migrate(pool);
    console.log(applied.length ? `Applied migrations: ${applied.join(", ")}` : "Database is up to date.");
    await pool.end();
    return;
  }
  throw new Error("Usage: tsx scripts/db.ts schema|migrate");
}

main(process.argv[2]).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
