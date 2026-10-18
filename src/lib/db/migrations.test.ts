import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MIGRATIONS, schemaSql } from "./migrations";

describe("migrations", () => {
  it("have unique, increasing ids", () => {
    const ids = MIGRATIONS.map((m) => m.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("match the committed db/schema.sql (run npm run db:schema)", () => {
    expect(readFileSync("db/schema.sql", "utf8")).toBe(schemaSql());
  });
});
