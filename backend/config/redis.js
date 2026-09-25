import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let redisUrl =
  process.env.REDIS_URL ||
  process.env.REDIS_PUBLIC_URL ||
  process.env.REDIS_PRIVATE_URL ||
  "redis://127.0.0.1:6379";

const redisOptions = {
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
};

// Handle TLS for secure connections (rediss://) or managed cloud providers like Upstash
const isUpstash = redisUrl.includes("upstash.io");
const isSecureProtocol = redisUrl.startsWith("rediss://");

if (isUpstash || isSecureProtocol) {
  // If Upstash URL was provided with redis://, convert to rediss:// for ioredis
  if (redisUrl.startsWith("redis://")) {
    redisUrl = redisUrl.replace(/^redis:\/\//, "rediss://");
  }
  redisOptions.tls = {
    rejectUnauthorized: false,
  };
}

const redis = new Redis(redisUrl, redisOptions);

redis.on("ready", () => {
  console.log("Redis Ready & Connected Successfully (Upstash/Remote)");
});

redis.on("error", (err) => {
  console.error("Redis Connection Error:", err.message);
});

redis.on("reconnecting", (delay) => {
  console.warn(`⚠️ Redis reconnecting in ${delay}ms...`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await redis.quit();
});
process.on("SIGTERM", async () => {
  await redis.quit();
});

export default redis;
