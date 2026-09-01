import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl =
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
};

// Handle TLS if using a secure rediss:// connection (e.g. Railway public endpoint)
if (redisUrl.startsWith("rediss://")) {
  redisOptions.tls = {
    rejectUnauthorized: false,
  };
}

const redis = new Redis(redisUrl, redisOptions);

redis.on("connect", () => {
  console.log("Redis Connected Successfully (Railway/Remote)");
});

redis.on("error", (err) => {
  console.error("Redis Connection Error:", err.message);
});

export default redis;
