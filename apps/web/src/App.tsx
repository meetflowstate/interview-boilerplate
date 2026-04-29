import { Activity, Database, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Health = {
  ok: boolean;
  checks: { postgres: boolean; redis: boolean };
  time: string;
};

type Employee = {
  id: number;
  name: string;
  email: string;
  role: string;
  started_at: string;
};

type Team = {
  id: number;
  name: string;
  manager_id: number | null;
  manager_name: string | null;
  active_allocations: string;
};

export function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    Promise.all([
      fetch('/api/health').then((r) => r.json() as Promise<Health>),
      fetch('/api/employees').then((r) => r.json() as Promise<Employee[]>),
      fetch('/api/teams').then((r) => r.json() as Promise<Team[]>),
    ])
      .then(([h, e, t]) => {
        setHealth(h);
        setEmployees(e);
        setTeams(t);
      })
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex items-center justify-between py-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Interview boilerplate</h1>
            <p className="text-sm text-muted-foreground">
              Postgres + Redis + OpenTelemetry, ready to go.
            </p>
          </div>
          <Button variant="outline" onClick={load}>
            Refresh
          </Button>
        </div>
      </header>

      <main className="container space-y-6 py-8">
        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">API error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<Database className="h-4 w-4 text-muted-foreground" />}
            label="Postgres"
            value={health ? (health.checks.postgres ? 'connected' : 'down') : '…'}
            ok={health?.checks.postgres ?? false}
          />
          <StatCard
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            label="Redis"
            value={health ? (health.checks.redis ? 'connected' : 'down') : '…'}
            ok={health?.checks.redis ?? false}
          />
          <StatCard
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            label="Employees seeded"
            value={`${employees.length}`}
            ok={employees.length > 0}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teams</CardTitle>
            <CardDescription>From <code>/api/teams</code></CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Active allocations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.manager_name ?? '—'}</TableCell>
                    <TableCell className="text-right">{t.active_allocations}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <CardDescription>From <code>/api/employees</code></CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="text-muted-foreground">{e.email}</TableCell>
                    <TableCell>{e.role}</TableCell>
                    <TableCell className="text-right">{e.started_at.slice(0, 10)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-semibold">{value}</div>
          <Badge variant={ok ? 'secondary' : 'destructive'}>{ok ? 'ok' : 'check'}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
