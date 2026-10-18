import { readDbConfig } from "@/lib/db/config";
import { getDatabase } from "@/lib/db/pool";
import { createMemoryStores } from "./memory";
import { createMysqlStores } from "./mysql";
import type { Stores } from "./types";

export * from "./types";

const cache = globalThis as unknown as { __justegMemoryStores?: Stores };

/**
 * Returns MySQL stores when database settings are present, otherwise
 * process-local memory stores (local development, CI, tests).
 */
export function getStores(): Stores {
  const config = readDbConfig();
  if (config) {
    const { pool, ready } = getDatabase(config);
    return createMysqlStores(pool, ready);
  }
  cache.__justegMemoryStores ??= createMemoryStores();
  return cache.__justegMemoryStores;
}
