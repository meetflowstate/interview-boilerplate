import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Did you copy .env or run via npm scripts?');
}

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

db.on('error', (err) => {
  console.error('postgres pool error:', err);
});
