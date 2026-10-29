import { useCallback, useEffect, useState } from 'react';
import { CircleAlert, KeyRound, LifeBuoy, Phone, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/stat-card';
import { usePermissions } from '@/hooks/use-permissions';
import analyticsService, { type SignupInsights, type StuckSignIn } from '../../services/analyticsService';
import { logger } from '../../utils/logger';

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

function ago(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function duration(mins: number | null) {
  if (mins == null) return null;
  if (mins < 60) return `${mins} min`;
  if (mins < 48 * 60) return `${Math.round(mins / 60)} h`;
  return `${Math.round(mins / 1440)} days`;
}

function Unavailable() {
  return <p className="py-8 text-center text-sm text-muted-foreground">Couldn’t load this. Refresh to try again.</p>;
}

/** People who tried to sign in or up and never got in. Support only: shows phone numbers. */
function PeopleToCall() {
  const can = usePermissions();
  const [rows, setRows] = useState<StuckSignIn[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await analyticsService.getStuckSignIns());
      setFailed(false);
    } catch (err) {
      logger.error('Failed to load stuck sign-ins:', err);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markCalled = async (row: StuckSignIn) => {
    setSaving(row.id);
    try {
      const { contactedAt } = await analyticsService.markContacted(row.id);
      setRows((prev) => prev?.map((r) => (r.id === row.id ? { ...r, contactedAt, contactedBy: 'You' } : r)) ?? null);
      toast.success(`Marked ${row.phoneNumber} as called`);
    } catch (err) {
      logger.error('Failed to mark as called:', err);
      toast.error('Couldn’t save that. Try again.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>People to call</CardTitle>
        <CardDescription>Tried to sign in or sign up in the last 7 days and never got in. Numbers are deleted after 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {failed ? (
          <Unavailable />
        ) : !rows ? (
          <Skeleton className="h-48 w-full" />
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nobody is stuck right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Trying to</TableHead>
                  <TableHead>What happened</TableHead>
                  <TableHead className="text-right">Codes</TableHead>
                  <TableHead>Last tried</TableHead>
                  <TableHead className="text-right">Called</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <a href={`tel:${r.phoneNumber}`} className="inline-flex items-center gap-1.5 font-medium tabular-nums hover:underline">
                        <Phone className="size-3.5 text-muted-foreground" />
                        {r.phoneNumber}
                      </a>
                      <div className="text-xs text-muted-foreground">{r.network}</div>
                    </TableCell>
                    <TableCell>{r.flow === 'signup' ? 'Sign up' : 'Log in'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span>{r.reason}</span>
                        {r.askedForHelp && <Badge variant="secondary">Asked for help</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.codesSent}
                      {r.wrongCodes > 0 && <span className="ml-1 text-xs text-muted-foreground">({r.wrongCodes} wrong)</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{ago(r.lastTriedAt)}</TableCell>
                    <TableCell className="text-right">
                      {r.contactedAt ? (
                        <span className="text-xs text-muted-foreground">
                          {r.contactedBy ? `${r.contactedBy}, ` : ''}
                          {ago(r.contactedAt)}
                        </span>
                      ) : can('support.reply') ? (
                        <Button size="sm" variant="outline" disabled={saving === r.id} onClick={() => void markCalled(r)}>
                          Mark as called
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not yet</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SignupsTab({ data, loading, failed }: { data: SignupInsights | null; loading: boolean; failed: boolean }) {
  const can = usePermissions();
  const g = data?.guests;
  const a = data?.attempts;
  const funnelTop = data?.signupFunnel[0]?.sessions ?? 0;
  const maxReason = data?.reasons[0]?.count ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Guests who signed up"
          value={(g?.becameCustomers ?? 0).toLocaleString()}
          hint={g ? `${pct(g.becameCustomers, g.guestInstalls)}% of ${g.guestInstalls.toLocaleString()} guests${g.medianMinutesToSignUp != null ? ` · typically after ${duration(g.medianMinutesToSignUp)}` : ''}` : undefined}
          icon={UserPlus}
          tint="bg-emerald-500/10 text-emerald-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label="Got in"
          value={a ? `${pct(a.signedIn, a.total)}%` : '0%'}
          hint={a ? `${a.signedIn.toLocaleString()} of ${a.total.toLocaleString()} sign-in attempts` : undefined}
          icon={KeyRound}
          tint="bg-sky-500/10 text-sky-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label="Stuck"
          value={(a?.stuck ?? 0).toLocaleString()}
          hint={a ? `${a.stuckSignup.toLocaleString()} signing up · ${a.stuckLogin.toLocaleString()} logging in` : undefined}
          icon={CircleAlert}
          tint="bg-rose-500/10 text-rose-600"
          loading={loading}
          failed={failed}
        />
        <StatCard
          label="Needed another code"
          value={(a?.neededMoreThanOneCode ?? 0).toLocaleString()}
          hint={a ? `${a.typedAWrongCode.toLocaleString()} typed a wrong code · ${a.askedForHelp.toLocaleString()} asked for help` : undefined}
          icon={LifeBuoy}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={failed}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Sign-up steps</CardTitle>
            <CardDescription>Phones reaching each step. The name and address steps are counted from app 1.5.0.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : !data ? (
              <Unavailable />
            ) : (
              <div className="grid gap-5">
                <ol className="grid gap-3">
                  {data.signupFunnel.map((f, i) => {
                    const prev = data.signupFunnel[i - 1];
                    const width = funnelTop > 0 ? (f.sessions / funnelTop) * 100 : 0;
                    return (
                      <li key={f.step} className="grid gap-1">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="font-medium">{f.label}</span>
                          <span className="tabular-nums">
                            {f.sessions.toLocaleString()}
                            {prev && prev.sessions > 0 && <span className="ml-1.5 text-xs text-muted-foreground">{pct(f.sessions, prev.sessions)}% of previous</span>}
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(width, f.sessions > 0 ? 1.5 : 0)}%`, opacity: 1 - i * 0.1 }} />
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <p className="text-sm text-muted-foreground">
                  Logging in: {data.login.codeRequested.toLocaleString()} asked for a code, {data.login.codeVerified.toLocaleString()} got in
                  {data.login.codeRequested > 0 && ` (${pct(data.login.codeVerified, data.login.codeRequested)}%)`}.
                  {g && g.signedInToExisting > 0 && ` ${g.signedInToExisting.toLocaleString()} guests logged in to an account they already had.`}
                  {g && g.becameCustomers > 0 && ` ${g.hadCartBeforeSignUp.toLocaleString()} of the new sign-ups had filled a cart first.`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Why people got stuck</CardTitle>
              <CardDescription>The last thing that happened before they gave up</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : !data ? (
                <Unavailable />
              ) : data.reasons.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nobody got stuck in this range.</p>
              ) : (
                <ul className="grid gap-2">
                  {data.reasons.map((r) => (
                    <li key={r.reason} className="relative overflow-hidden rounded-md">
                      <div className="absolute inset-y-0 left-0 rounded-md bg-rose-500/10" style={{ width: `${maxReason > 0 ? Math.max(2, (r.count / maxReason) * 100) : 0}%` }} />
                      <div className="relative flex items-center justify-between gap-3 px-3 py-1.5 text-sm">
                        <span className="truncate">{r.reason}</span>
                        <span className="shrink-0 tabular-nums">{r.count.toLocaleString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By network</CardTitle>
              <CardDescription>A network that stands out may be losing codes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : !data ? (
                <Unavailable />
              ) : data.networks.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No sign-in attempts in this range.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Network</TableHead>
                      <TableHead className="text-right">Attempts</TableHead>
                      <TableHead className="text-right">Stuck</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.networks.map((n) => (
                      <TableRow key={n.network}>
                        <TableCell>{n.network}</TableCell>
                        <TableCell className="text-right tabular-nums">{n.attempts.toLocaleString()}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {n.stuck.toLocaleString()}
                          <span className="ml-1.5 text-xs text-muted-foreground">{pct(n.stuck, n.attempts)}%</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {can('support.view') && <PeopleToCall />}
    </div>
  );
}
