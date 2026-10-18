import { createMemoryStores } from "./memory";
import { storeContract } from "./contract";

storeContract("memory", async () => createMemoryStores());
