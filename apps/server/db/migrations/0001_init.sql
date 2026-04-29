-- Sample schema to verify the boilerplate is wired up.
-- Replace, extend, or rename anything here.

CREATE TABLE IF NOT EXISTS currency (
  id    TEXT PRIMARY KEY,          -- ISO 4217 code (GBP, USD, EUR, ...)
  name  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS currency_conversion (
  id              BIGSERIAL PRIMARY KEY,
  currency_id     TEXT NOT NULL REFERENCES currency(id),
  to_currency_id  TEXT NOT NULL REFERENCES currency(id),
  multiplier      NUMERIC(20, 10) NOT NULL,
  effective_from  DATE NOT NULL DEFAULT CURRENT_DATE,
  CHECK (currency_id <> to_currency_id),
  UNIQUE (currency_id, to_currency_id, effective_from)
);

CREATE TABLE IF NOT EXISTS employee (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL,
  started_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  manager_id  BIGINT REFERENCES employee(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_team_allocation (
  id           BIGSERIAL PRIMARY KEY,
  team_id      BIGINT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
  employee_id  BIGINT NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  from_date    DATE NOT NULL,
  to_date      DATE,                       -- NULL = current
  CHECK (to_date IS NULL OR to_date >= from_date)
);

CREATE INDEX IF NOT EXISTS employee_team_allocation_employee_idx
  ON employee_team_allocation (employee_id);
CREATE INDEX IF NOT EXISTS employee_team_allocation_team_idx
  ON employee_team_allocation (team_id);

CREATE TABLE IF NOT EXISTS employee_salary_adjustment (
  id           BIGSERIAL PRIMARY KEY,
  employee_id  BIGINT NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  from_date    DATE NOT NULL,
  amount       NUMERIC(14, 2) NOT NULL,
  currency_id  TEXT NOT NULL REFERENCES currency(id),
  UNIQUE (employee_id, from_date)
);

CREATE INDEX IF NOT EXISTS employee_salary_adjustment_employee_idx
  ON employee_salary_adjustment (employee_id, from_date DESC);
