import mysql from "mysql2/promise";
import { afterAll, describe, expect, it } from "vitest";
import { readDbConfig } from "@/lib/db/config";
import { migrate } from "@/lib/db/pool";
import { storeContract } from "./contract";
import { createMysqlStores } from "./mysql";

/**
 * Runs against a real server when TEST_DATABASE_URL is set, for example
 * mysql://justeg:justeg@localhost:3306/justeg_test. Tables are dropped
 * between tests, so never point this at a database you care about.
 */
const config = readDbConfig({ DATABASE_URL: process.env.TEST_DATABASE_URL });

if (!config) {
  describe.skip("mysql stores (set TEST_DATABASE_URL to run)", () => {
    it("skipped", () => {});
  });
} else {
  const pool = mysql.createPool({ ...config, connectionLimit: 2 });
  afterAll(() => pool.end());

  storeContract("mysql", async () => {
    for (const table of ["rate_limits", "favicon_cache", "usage_counters", "schema_migrations"]) {
      await pool.query(`DROP TABLE IF EXISTS ${table}`);
    }
    await migrate(pool);
    return createMysqlStores(pool, Promise.resolve());
  });

  describe("mysql migrations", () => {
    it("are idempotent", async () => {
      expect(await migrate(pool)).toEqual([]);
    });
  });
}
