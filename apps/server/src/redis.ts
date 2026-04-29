import { createClient } from 'redis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not set. Did you copy .env or run via npm scripts?');
}

export const redis = createClient({ url: process.env.REDIS_URL });

redis.on('error', (err) => {
  console.error('redis error:', err);
});

let connected = false;

export async function ensureRedis() {
  if (connected) return redis;
  await redis.connect();
  connected = true;
  return redis;
}
