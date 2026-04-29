-- Dummy data so the boilerplate has something to render end-to-end.
-- Replace with whatever fixtures you need.

TRUNCATE
  employee_salary_adjustment,
  employee_team_allocation,
  team,
  employee,
  currency_conversion,
  currency
RESTART IDENTITY CASCADE;

-- Currencies
INSERT INTO currency (id, name) VALUES
  ('GBP', 'Pound Sterling'),
  ('USD', 'US Dollar'),
  ('EUR', 'Euro');

-- FX rates (multiplier converts FROM -> TO).
INSERT INTO currency_conversion (currency_id, to_currency_id, multiplier, effective_from) VALUES
  ('GBP', 'USD', 1.27, '2025-01-01'),
  ('GBP', 'EUR', 1.17, '2025-01-01'),
  ('USD', 'GBP', 0.79, '2025-01-01'),
  ('USD', 'EUR', 0.92, '2025-01-01'),
  ('EUR', 'GBP', 0.85, '2025-01-01'),
  ('EUR', 'USD', 1.09, '2025-01-01'),
  -- A later GBP/USD revision so candidates see time-varying FX.
  ('GBP', 'USD', 1.31, '2026-01-01'),
  ('USD', 'GBP', 0.76, '2026-01-01');

-- Employees
INSERT INTO employee (id, name, email, role, started_at) VALUES
  (1, 'Ada Lovelace',     'ada@example.com',     'Staff Engineer',    '2023-04-01'),
  (2, 'Grace Hopper',     'grace@example.com',   'Engineering Manager','2022-09-15'),
  (3, 'Alan Turing',      'alan@example.com',    'Senior Engineer',   '2024-01-10'),
  (4, 'Margaret Hamilton','margaret@example.com','Senior Engineer',   '2024-06-01'),
  (5, 'Linus Torvalds',   'linus@example.com',   'Principal Engineer','2021-11-20'),
  (6, 'Katherine Johnson','katherine@example.com','Engineer',         '2025-02-03');
SELECT setval(pg_get_serial_sequence('employee', 'id'), (SELECT MAX(id) FROM employee));

-- Teams (Grace manages Platform, Linus manages Infra)
INSERT INTO team (id, name, manager_id) VALUES
  (1, 'Platform', 2),
  (2, 'Infra',    5),
  (3, 'Growth',   2);
SELECT setval(pg_get_serial_sequence('team', 'id'), (SELECT MAX(id) FROM team));

-- Allocations (some closed historical, some open / current)
INSERT INTO employee_team_allocation (team_id, employee_id, from_date, to_date) VALUES
  (1, 1, '2023-04-01', NULL),       -- Ada on Platform, current
  (1, 3, '2024-01-10', '2025-06-30'),-- Alan on Platform, ended
  (2, 3, '2025-07-01', NULL),        -- Alan moved to Infra
  (2, 4, '2024-06-01', NULL),        -- Margaret on Infra, current
  (2, 5, '2021-11-20', NULL),        -- Linus on Infra, current
  (3, 6, '2025-02-03', NULL),        -- Katherine on Growth
  (1, 2, '2022-09-15', NULL);        -- Grace also allocated to Platform

-- Salary adjustments (track raises over time, mixed currencies)
INSERT INTO employee_salary_adjustment (employee_id, from_date, amount, currency_id) VALUES
  (1, '2023-04-01',  95000.00, 'GBP'),
  (1, '2024-04-01', 105000.00, 'GBP'),
  (1, '2025-04-01', 115000.00, 'GBP'),
  (2, '2022-09-15', 110000.00, 'GBP'),
  (2, '2024-01-01', 125000.00, 'GBP'),
  (3, '2024-01-10',  85000.00, 'GBP'),
  (3, '2025-07-01',  98000.00, 'GBP'),
  (4, '2024-06-01', 110000.00, 'USD'),
  (4, '2025-06-01', 120000.00, 'USD'),
  (5, '2021-11-20', 140000.00, 'EUR'),
  (5, '2024-01-01', 160000.00, 'EUR'),
  (6, '2025-02-03',  72000.00, 'GBP');
