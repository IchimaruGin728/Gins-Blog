import type { KVNamespace } from "@cloudflare/workers-types";

export class Cache {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.kv.get(key, "json");
    return value as T | null;
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    const value = await fetchFn();
    if (value) {
      // Don't await the set operation to avoid blocking the response
      // Use waitUntil if available in context, otherwise just fire and forget (safe in CF workers usually)
      // But for correct strict execution await is safer
      await this.set(key, value, ttlSeconds);
    }
    return value;
  }
}

export function getCache(env: Env) {
  if (!env.GINS_CACHE) {
    throw new Error("GINS_CACHE KV binding not found");
  }
  return new Cache(env.GINS_CACHE);
}
