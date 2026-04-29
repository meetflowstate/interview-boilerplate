import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Pool } from 'pg';

const seedFile = join(__dirname, '..', '..', 'db', 'seed.sql');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set.');
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const sql = await readFile(seedFile, 'utf-8');
  console.log('seeding...');
  await pool.query(sql);
  await pool.end();
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
