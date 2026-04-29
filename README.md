# Interview boilerplate

A minimal full-stack TypeScript starter so you can spend the session on the problem,
not on plumbing. Everything is local — Postgres, Redis and a Jaeger trace viewer
all run via `docker compose`. Tweak, replace, or rip out any of it.

## Stack

| Layer        | Choice                                                              |
| ------------ | ------------------------------------------------------------------- |
| Frontend     | [Vite](https://vitejs.dev) + React 18 + TS + Tailwind + [shadcn/ui](https://ui.shadcn.com) (`apps/web`) |
| Backend      | [Express](https://expressjs.com) + TypeScript via [tsx](https://tsx.is) (`apps/server`) |
| Database     | Postgres 16 (`pg` client) + raw SQL migrations & seed               |
| Cache        | Redis 7 (`redis` client)                                            |
| Tracing      | OpenTelemetry → [Jaeger](https://www.jaegertracing.io) (UI at `:16686`) |
| Workspace    | npm workspaces — one command boots both apps                        |

You are free to swap anything (Drizzle/Prisma/Kysely, Hono, Next.js, Tailwind,
TanStack Query, etc.) — nothing here is sacred.

## Prerequisites

- **Node.js 20.6+** (`.nvmrc` provided — `nvm use` if you have nvm)
- **npm 10+** (ships with Node 20)
- **Docker** with Compose v2 (Docker Desktop, OrbStack, Rancher Desktop, etc.).
  If you only have legacy `docker-compose` (v1), substitute that for `docker compose`
  in the scripts below.

That's it. No local Postgres, Redis or Jaeger install needed — they all run in
containers.

## Quickstart

```bash
npm run setup
npm run dev
```

`npm run setup` does the following in order:

1. `docker compose up -d --wait` — starts Postgres, Redis and Jaeger
2. `npm install` — installs Node deps for both workspaces
3. `npm run db:migrate` — applies SQL files in `apps/server/db/migrations`
4. `npm run db:seed` — loads `apps/server/db/seed.sql`

Once `npm run dev` is running:

- Web → <http://localhost:5173>
- API → <http://localhost:3001> (try `/api/health`, `/api/notes`)
- Jaeger UI → <http://localhost:16686> (pick service `api` and search)
- Postgres → `localhost:54329` (user `app`, password `app`, db `app`)
- Redis → `localhost:63790`

The Vite dev server proxies `/api/*` to the backend, so calls from the browser
hit Express without CORS configuration.

## Scripts

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run setup`        | One-shot: docker up, install, migrate, seed              |
| `npm run dev`          | Run server and web together                              |
| `npm run dev:server`   | Run only the API (auto-reload on changes)                |
| `npm run dev:web`      | Run only the Vite dev server                             |
| `npm run docker:up`    | Start the docker stack                                   |
| `npm run docker:down`  | Stop the docker stack (keeps data volume)                |
| `npm run docker:reset` | Stop and **wipe** the data volume, then start again      |
| `npm run docker:logs`  | Follow logs from all containers                          |
| `npm run db:migrate`   | Apply any pending SQL migrations                         |
| `npm run db:seed`      | Re-run `seed.sql` (truncates and re-inserts)             |
| `npm run db:reset`     | Wipe Postgres volume, migrate, seed                      |
| `npm run db:psql`      | Open `psql` inside the Postgres container                |
| `npm run redis:cli`    | Open `redis-cli` inside the Redis container              |
| `npm run typecheck`    | Type-check every workspace                               |
| `npm run build`        | Build the web app for production                         |
| `npm run format`       | Prettier across the repo                                 |

## Layout

```
.
├── apps
│   ├── server          Express + Postgres + Redis + OpenTelemetry
│   │   ├── db
│   │   │   ├── migrations/
│   │   │   │   └── 0001_init.sql      Sample table — replace this
│   │   │   └── seed.sql               Sample data — replace this
│   │   └── src
│   │       ├── otel.ts                OpenTelemetry SDK init (imported first)
│   │       ├── index.ts               HTTP entry point
│   │       ├── db.ts                  pg Pool
│   │       ├── redis.ts               Redis client
│   │       └── scripts
│   │           ├── migrate.ts         Applies migrations (tracks _migrations)
│   │           └── seed.ts            Runs seed.sql
│   └── web             React + Vite + Tailwind + shadcn/ui
│       └── src
│           ├── main.tsx
│           ├── App.tsx                Demo dashboard (health, teams, employees)
│           ├── components/ui/         shadcn primitives (button, card, table, badge)
│           ├── lib/utils.ts           cn() helper
│           └── index.css              Tailwind + shadcn theme tokens
├── docker-compose.yml  Postgres, Redis, Jaeger
├── .env                Local-dev defaults — committed on purpose
├── .env.example        Mirror of .env for resets
└── package.json        npm workspaces root
```

## How tracing works

`apps/server/src/otel.ts` boots `@opentelemetry/sdk-node` with auto-instrumentations
(Express, http, pg, redis). It is **the very first import** in `index.ts` so the
SDK can monkey-patch modules before they load — keep it that way. Spans ship via
OTLP/HTTP to Jaeger at `OTEL_EXPORTER_OTLP_ENDPOINT` (default
`http://localhost:4318`).

Make a request (e.g. `curl http://localhost:3001/api/notes`) then open
<http://localhost:16686>, select the `api` service and click *Find Traces*.

## Migrations & seeding

- Migrations are plain SQL files in `apps/server/db/migrations/`. They run in
  alphabetical order, each in a transaction, and applied names are tracked in a
  `_migrations` table — re-running `db:migrate` is safe.
- `seed.sql` is a single file that is re-run from scratch each time (`TRUNCATE …
  RESTART IDENTITY` then `INSERT`). Keep it idempotent.
- To start over from scratch: `npm run db:reset` (drops the Postgres volume).

The shipped schema (`employee`, `team`, `employee_team_allocation`,
`employee_salary_adjustment`, `currency`, `currency_conversion`) and the seeded
fixtures are placeholders — extend or replace them as the brief calls for.

### Adding more shadcn components

`components.json` is set up with the standard aliases (`@/components/ui`,
`@/lib/utils`). Add new primitives with:

```bash
npx shadcn@latest add dialog
```

…or just paste the source in by hand from <https://ui.shadcn.com> — every
component is self-contained.

## Ports

| Service        | Host port  | Container port |
| -------------- | ---------- | -------------- |
| Postgres       | **54329**  | 5432           |
| Redis          | **63790**  | 6379           |
| Jaeger UI      | 16686      | 16686          |
| OTLP HTTP      | 4318       | 4318           |
| OTLP gRPC      | 4317       | 4317           |
| API            | 3001       | n/a (host)     |
| Web (Vite)     | 5173       | n/a (host)     |

Postgres and Redis are deliberately on non-default ports so they don't collide
with anything you might already have running locally. Override any port via
`.env`.

## Troubleshooting

- **Containers won't start** — make sure Docker is running. If port 54329, 63790
  or 16686 is taken, edit `.env` and re-run `npm run docker:reset`.
- **`db:migrate` fails with "DATABASE_URL is not set"** — the script reads
  `.env` via `--env-file`. Run it through the npm script (`npm run db:migrate`)
  rather than calling `tsx` directly.
- **Redis connection refused** — `npm run docker:up` and confirm with
  `npm run docker:logs`.
- **No traces in Jaeger** — make sure you've made at least one HTTP request to
  the API since starting it. The auto-instrumentation only emits when the API
  handles traffic.
- **Stale types after dependency changes** — restart your editor's TS server.
