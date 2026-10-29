import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Copy, KeyRound, Phone, RotateCw, Send, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import otpHelpService, { type OtpHelpRequest, type OtpHelpStatus } from '../../services/otpHelpService';
import { refreshSignInHelpCount } from '../../hooks/use-signin-help';
import { usePermissions } from '../../hooks/use-permissions';
import { logger } from '../../utils/logger';
import { ago } from './support-meta';

const POLL_MS = 15_000;

// Ghana network codes Hubtel reports.
const NETWORKS: Record<string, string> = { '62001': 'MTN', '62002': 'Telecel', '62003': 'AT', '62006': 'AT', '62007': 'Glo' };
const network = (id: string | null) => (id ? NETWORKS[id] ?? id : 'Unknown network');

const STATUS: Record<OtpHelpStatus, { label: string; className: string }> = {
  open: { label: 'Waiting', className: 'border-amber-500/20 bg-amber-500/10 text-amber-700' },
  verified: { label: 'Confirmed, signing in', className: 'border-sky-500/20 bg-sky-500/10 text-sky-700' },
  signed_in: { label: 'Signed in', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' },
  closed: { label: 'Closed', className: 'border-border bg-muted text-muted-foreground' },
  expired: { label: 'Expired', className: 'border-border bg-muted text-muted-foreground' },
  replaced: { label: 'Asked again', className: 'border-border bg-muted text-muted-foreground' },
};

const errorText = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong');
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function RequestCard({ req, now, canAct, onChanged }: { req: OtpHelpRequest; now: number; canAct: boolean; onChanged: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'verify' | 'resend' | 'close' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isOpen = req.status === 'open';
  const st = STATUS[req.status];

  const run = async (kind: 'verify' | 'resend' | 'close', fn: () => Promise<unknown>, done: string) => {
    setBusy(kind);
    setError(null);
    try {
      await fn();
      toast.success(done);
      setCode('');
      onChanged();
    } catch (err) {
      setError(errorText(err));
      if (kind === 'verify') onChanged(); // attempts left / closed after too many
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold">{req.name || 'New customer'}</p>
            <Badge variant="outline">{req.flow === 'signup' ? 'Signing up' : 'Logging in'}</Badge>
            <Badge variant="outline" className={st.className}>{st.label}</Badge>
          </div>
          <p className="font-mono text-sm tabular-nums text-muted-foreground">{req.phoneNumber}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className={cn('tabular-nums', isOpen && 'font-medium text-amber-700')}>
            {isOpen ? `Waiting ${ago(req.createdAt, now)}` : `Asked ${ago(req.createdAt, now)} ago`}
          </p>
          {req.verifiedBy && <p>Confirmed by {req.verifiedBy}</p>}
          {req.closedNote && <p>{req.closedNote}</p>}
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30">
        <p className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">Codes we sent (newest first). Quote the message ID to Hubtel.</p>
        {req.codesSent.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-muted-foreground">No texts recorded in the last 7 days.</p>
        ) : (
          <ul className="divide-y text-sm">
            {req.codesSent.map((m) => (
              <li key={`${m.createdAt}-${m.messageId}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
                <span className="w-12 tabular-nums text-muted-foreground">{time(m.createdAt)}</span>
                <span className="w-16 font-medium">{network(m.networkId)}</span>
                <span className={cn('w-24', m.error || (m.httpStatus && m.httpStatus >= 400) ? 'text-destructive' : '')}>
                  {m.error ? 'Failed' : m.status || 'Sent'}
                </span>
                {m.messageId ? (
                  <button
                    type="button"
                    className="inline-flex min-w-0 items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => void navigator.clipboard.writeText(m.messageId!).then(() => toast.success('Message ID copied'))}
                    title="Copy message ID"
                  >
                    <span className="truncate">{m.messageId}</span>
                    <Copy className="size-3 shrink-0" />
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">No message ID</span>
                )}
                {m.error && <span className="w-full text-xs text-destructive">{m.error}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isOpen && canAct && (
        <div className="flex flex-col gap-3">
          <ol className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-3">
            <li><span className="font-medium text-foreground">1.</span> Call this number.</li>
            <li><span className="font-medium text-foreground">2.</span> Ask for the 4-digit help code on their screen.</li>
            <li><span className="font-medium text-foreground">3.</span> Type it here. Their app signs in.</li>
          </ol>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <a href={`tel:${req.phoneNumber}`}>
                <Phone />
                Call
              </a>
            </Button>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void run('verify', () => otpHelpService.verify(req.id, code), 'Confirmed. Their app is signing in.');
              }}
            >
              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Help code"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label={`Help code for ${req.phoneNumber}`}
                  className="w-36 pl-8 font-mono tracking-[0.3em]"
                />
              </div>
              <Button type="submit" disabled={code.length !== 4 || !!busy}>
                <ShieldCheck />
                {busy === 'verify' ? 'Checking…' : 'Verify'}
              </Button>
            </form>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" disabled={!!busy} onClick={() => void run('resend', () => otpHelpService.resend(req.id), 'New code sent by SMS')}>
                <Send />
                {busy === 'resend' ? 'Sending…' : 'Resend code'}
              </Button>
              <Button
                variant="ghost"
                disabled={!!busy}
                onClick={() => {
                  const note = window.prompt('Why are you closing this? (optional)') ?? undefined;
                  void run('close', () => otpHelpService.close(req.id, note), 'Request closed');
                }}
              >
                <X />
                Close
              </Button>
            </div>
          </div>
          {error && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              {error}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

/** Customers whose login code didn't arrive, waiting for a call. */
export default function SignInHelpPanel() {
  const can = usePermissions();
  const [scope, setScope] = useState<'open' | 'recent'>('open');
  const [rows, setRows] = useState<OtpHelpRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      setRows(await otpHelpService.list(scope));
      setError(null);
    } catch (err) {
      logger.error('Failed to load sign-in help:', err);
      setError(errorText(err));
      setRows((r) => r ?? []);
    }
    setNow(Date.now());
    void refreshSignInHelpCount();
  }, [scope]);

  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const id = setInterval(() => document.visibilityState === 'visible' && void load(), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Customers whose login code didn’t arrive. Never read a login code out. Call the number, ask for the help code on their screen, and confirm it here.
        </p>
        <Tabs
          value={scope}
          onValueChange={(v) => {
            setRows(null);
            setScope(v as 'open' | 'recent');
          }}
        >
          <TabsList>
            <TabsTrigger value="open">Waiting</TabsTrigger>
            <TabsTrigger value="recent">Last 7 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load sign-in help: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      {rows === null ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center text-sm text-muted-foreground">
          <CheckCircle2 className="size-8 text-emerald-600" />
          {scope === 'open' ? 'Nobody is waiting. Everyone’s codes are getting through.' : 'No sign-in help requests in the last 7 days.'}
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <RequestCard key={r.id} req={r} now={now} canAct={can('support.reply')} onChanged={() => void load()} />
          ))}
        </div>
      )}
    </div>
  );
}
