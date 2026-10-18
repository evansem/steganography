/**
 * Database settings come from environment variables so the same build runs
 * locally and on Hostinger. Either set DATABASE_URL, or the DB_* variables
 * Hostinger's own guide uses. With neither, the app runs without a database.
 */
export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

type Env = Record<string, string | undefined>;

export function readDbConfig(env: Env = process.env): DbConfig | null {
  if (env.DATABASE_URL) {
    const url = new URL(env.DATABASE_URL);
    if (url.protocol !== "mysql:") throw new Error("DATABASE_URL must start with mysql://");
    return {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    };
  }
  if (env.DB_NAME && env.DB_USER) {
    return {
      host: env.DB_HOST || "localhost",
      port: Number(env.DB_PORT || 3306),
      user: env.DB_USER,
      password: env.DB_PASSWORD ?? "",
      database: env.DB_NAME,
    };
  }
  return null;
}
