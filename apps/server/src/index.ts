import './otel';
import cors from 'cors';
import express from 'express';
import { db } from './db';
import { ensureRedis, redis } from './redis';

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const checks = { postgres: false, redis: false };
  try {
    await db.query('SELECT 1');
    checks.postgres = true;
  } catch (err) {
    console.error('postgres check failed:', err);
  }
  try {
    await redis.ping();
    checks.redis = true;
  } catch (err) {
    console.error('redis check failed:', err);
  }
  const ok = checks.postgres && checks.redis;
  res.status(ok ? 200 : 503).json({ ok, checks, time: new Date().toISOString() });
});

app.get('/api/employees', async (_req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, started_at
       FROM employee
       ORDER BY name`,
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get('/api/teams', async (_req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         t.id,
         t.name,
         t.manager_id,
         m.name AS manager_name,
         COUNT(a.id) FILTER (WHERE a.to_date IS NULL) AS active_allocations
       FROM team t
       LEFT JOIN employee m ON m.id = t.manager_id
       LEFT JOIN employee_team_allocation a ON a.team_id = t.id
       GROUP BY t.id, m.name
       ORDER BY t.name`,
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

async function main() {
  await ensureRedis();
  app.listen(port, () => {
    console.log(`server: http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error('fatal:', err);
  process.exit(1);
});
