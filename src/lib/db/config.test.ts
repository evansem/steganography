import { describe, expect, it } from "vitest";
import { readDbConfig } from "./config";

describe("readDbConfig", () => {
  it("returns null when nothing is configured", () => {
    expect(readDbConfig({})).toBeNull();
  });

  it("reads Hostinger-style DB_* variables with defaults", () => {
    expect(readDbConfig({ DB_NAME: "u1_justeg", DB_USER: "u1_app", DB_PASSWORD: "pw" })).toEqual({
      host: "localhost",
      port: 3306,
      user: "u1_app",
      password: "pw",
      database: "u1_justeg",
    });
  });

  it("prefers DATABASE_URL and decodes credentials", () => {
    const config = readDbConfig({ DATABASE_URL: "mysql://u1_app:p%40ss@db.local:3307/u1_justeg", DB_NAME: "other" });
    expect(config).toMatchObject({
      host: "db.local",
      port: 3307,
      user: "u1_app",
      password: "p@ss",
      database: "u1_justeg",
    });
  });

  it("rejects non-MySQL URLs", () => {
    expect(() => readDbConfig({ DATABASE_URL: "postgres://a:b@localhost/db" })).toThrow(/mysql/);
  });
});
