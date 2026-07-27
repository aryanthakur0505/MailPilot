// ==================================================
// MailPilot — Redis Connection
// ==================================================
// Singleton Redis client using ioredis.
// Works with both local Redis and Upstash Redis.

import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL;

  if (!url) {
    console.warn("[MailPilot] REDIS_URL not set — Redis features disabled");
    // Return a client that will fail gracefully
    return new Redis({ lazyConnect: true, maxRetriesPerRequest: 0 });
  }

  return new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
