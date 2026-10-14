import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertCircle, CheckCircle2, Clock, Eraser, Loader2, MoreHorizontal, RotateCw, ShieldCheck, ShieldQuestion, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DataTable, DataTableColumnHeader, facetedFilterFn } from '@/components/data-table';
import { StatCard } from '@/components/stat-card';
import { cn } from '@/lib/utils';
import deletionRequestsService, { type DeletionAction, type DeletionRequest } from '../services/deletionRequestsService';
import { logger } from '../utils/logger';

type Stage = 'check' | 'approve' | 'waiting' | 'due' | 'erased' | 'rejected';

const STAGES: Record<Stage, { label: string; className: string }> = {
  check: { label: 'Check identity', className: 'border-amber-500/20 bg-amber-500/10 text-amber-700' },
  approve: { label: 'Ready to approve', className: 'border-sky-500/20 bg-sky-500/10 text-sky-700' },
  waiting: { label: 'Waiting period', className: 'border-violet-500/20 bg-violet-500/10 text-violet-700' },
  due: { label: 'Due to erase', className: 'border-red-500/20 bg-red-500/10 text-red-700' },
  erased: { label: 'Erased', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' },
  rejected: { label: 'Rejected / cancelled', className: 'text-muted-foreground' },
};

function stageOf(r: DeletionRequest, now: number): Stage {
  switch (r.status) {
    case 'PENDING':
      return 'check';
    case 'VERIFIED':
      return 'approve';
    case 'APPROVED':
      return r.scheduledDeletionDate && new Date(r.scheduledDeletionDate).getTime() > now ? 'waiting' : 'due';
    case 'COMPLETED':
      return 'erased';
    default:
      return 'rejected';
  }
}

const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'None');
const daysUntil = (iso: string, now: number) => Math.ceil((new Date(iso).getTime() - now) / 86400000);
// In-app requests without an email get a placeholder "<digits>@dwom.app" — not a real address.
const realEmail = (e: string) => (e && !e.endsWith('@dwom.app') ? e : null);

const ACTION_COPY: Record<DeletionAction, { title: string; body: string; cta: string; destructive?: boolean }> = {
  verify: {
    title: 'Confirm it’s really them',
    body: 'This came from the website form, so anyone could have typed this number. Contact the customer on this phone number and confirm they asked for deletion before verifying.',
    cta: 'Mark verified',
  },
  approve: {
    title: 'Approve the deletion',
    body: 'Starts a 30-day waiting period. The customer can cancel from the app until then; after that you can erase the account.',
    cta: 'Approve',
  },
  complete: {
    title: 'Erase this customer',
    body: 'Permanently erases their name, phone, email, password, saved addresses, chats, notifications, carts and reviews, and cancels their subscriptions. Their orders are kept without personal details, for your accounts. This can’t be undone.',
    cta: 'Erase permanently',
    destructive: true,
  },
  reject: {
    title: 'Reject this request',
    body: 'Nothing is deleted. Add a note explaining why (e.g. couldn’t confirm identity).',
    cta: 'Reject',
    destructive: true,
  },
};

export default function DataDeletionRequestsPage() {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ request: DeletionRequest; action: DeletionAction } | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      setError(null);
      setRequests(await deletionRequestsService.getAll());
    } catch (err) {
      logger.error('Failed to load deletion requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load deletion requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const open = (request: DeletionRequest, action: DeletionAction) => {
    setNotes('');
    setPending({ request, action });
  };

  const submit = async () => {
    if (!pending) return;
    const { request, action } = pending;
    if (action === 'reject' && !notes.trim()) return toast.error('Add a short reason for rejecting.');
    try {
      setSaving(true);
      const updated = await deletionRequestsService.act(request.id, action, notes.trim() || undefined);
      toast.success(
        action === 'verify' ? 'Marked verified' : action === 'approve' ? `Approved. Can be erased from ${fmt(updated.scheduledDeletionDate)}` : action === 'complete' ? 'Customer erased' : 'Request rejected',
        action === 'complete' && updated.notes ? { description: updated.notes } : undefined,
      );
      setPending(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t update the request.');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<ColumnDef<DeletionRequest>[]>(
    () => [
      {
        id: 'customer',
        accessorFn: (r) => `${r.phoneNumber} ${r.email}`,
        header: 'Customer',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="min-w-[160px]">
            <p className="font-medium tabular-nums">{row.original.phoneNumber}</p>
            <p className="truncate text-xs text-muted-foreground">{realEmail(row.original.email) ?? 'No email'}</p>
          </div>
        ),
        meta: { title: 'Customer' },
      },
      {
        id: 'stage',
        accessorFn: (r) => stageOf(r, now),
        header: 'Status',
        filterFn: facetedFilterFn,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const s = STAGES[stageOf(row.original, now)];
          return (
            <Badge variant="outline" className={s.className}>
              {s.label}
            </Badge>
          );
        },
        meta: { title: 'Status' },
      },
      {
        id: 'requested',
        accessorFn: (r) => new Date(r.requestedAt).getTime(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Requested" />,
        enableGlobalFilter: false,
        cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{fmt(row.original.requestedAt)}</span>,
        meta: { title: 'Requested' },
      },
      {
        id: 'when',
        header: 'Erase',
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const r = row.original;
          if (r.status === 'COMPLETED') return <span className="whitespace-nowrap text-muted-foreground">Erased {fmt(r.completedAt)}</span>;
          if (r.status !== 'APPROVED' || !r.scheduledDeletionDate) return <span className="text-muted-foreground">None</span>;
          const d = daysUntil(r.scheduledDeletionDate, now);
          return d > 0 ? (
            <span className="whitespace-nowrap text-muted-foreground">
              in {d} day{d === 1 ? '' : 's'} ({fmt(r.scheduledDeletionDate)})
            </span>
          ) : (
            <span className="font-medium whitespace-nowrap text-red-700">Due now</span>
          );
        },
        meta: { title: 'Erase' },
      },
      {
        id: 'reason',
        accessorFn: (r) => `${r.reason ?? ''} ${r.notes ?? ''}`,
        header: 'Reason / notes',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="max-w-[280px]">
            <p className="truncate text-sm">{row.original.reason || <span className="text-muted-foreground">No reason given</span>}</p>
            {row.original.notes && <p className="truncate text-xs text-muted-foreground">{row.original.notes}</p>}
          </div>
        ),
        meta: { title: 'Reason / notes' },
      },
      {
        id: 'actions',
        enableHiding: false,
        enableSorting: false,
        meta: { className: 'w-10' },
        cell: ({ row }) => {
          const r = row.original;
          const stage = stageOf(r, now);
          if (stage === 'erased' || stage === 'rejected') return null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="data-[state=open]:bg-muted">
                  <MoreHorizontal />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {stage === 'check' && (
                  <DropdownMenuItem onSelect={() => open(r, 'verify')}>
                    <ShieldCheck />
                    Mark verified
                  </DropdownMenuItem>
                )}
                {stage === 'approve' && (
                  <DropdownMenuItem onSelect={() => open(r, 'approve')}>
                    <CheckCircle2 />
                    Approve
                  </DropdownMenuItem>
                )}
                {(stage === 'due' || stage === 'waiting') && (
                  <DropdownMenuItem variant="destructive" disabled={stage === 'waiting'} onSelect={() => open(r, 'complete')}>
                    <Eraser />
                    {stage === 'waiting' ? 'Erase (after waiting period)' : 'Erase now'}
                  </DropdownMenuItem>
                )}
                {(stage === 'check' || stage === 'approve') && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => open(r, 'reject')}>
                      <XCircle />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [now],
  );

  const count = (s: Stage) => requests.filter((r) => stageOf(r, now) === s).length;
  const copy = pending ? ACTION_COPY[pending.action] : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Data deletion</h1>
        <p className="text-sm text-muted-foreground">Customers asking for their account and personal data to be erased.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Need you"
          value={String(count('check') + count('approve'))}
          hint={`${count('check')} to verify · ${count('approve')} to approve`}
          icon={ShieldQuestion}
          tint="bg-amber-500/10 text-amber-600"
          loading={loading}
          failed={!!error}
        />
        <StatCard label="Due to erase" value={String(count('due'))} hint="Waiting period is over" icon={Trash2} tint="bg-red-500/10 text-red-600" loading={loading} failed={!!error} />
        <StatCard label="In waiting period" value={String(count('waiting'))} hint="Customer can still cancel" icon={Clock} tint="bg-violet-500/10 text-violet-600" loading={loading} failed={!!error} />
        <StatCard label="Erased" value={String(count('erased'))} hint={`${count('rejected')} rejected or cancelled`} icon={CheckCircle2} tint="bg-emerald-500/10 text-emerald-600" loading={loading} failed={!!error} />
      </div>

      <Card className="py-4">
        <CardContent className="grid gap-3 text-sm sm:grid-cols-4">
          {[
            { n: 1, t: 'Check identity', d: 'Website-form requests only. In-app requests are already verified.' },
            { n: 2, t: 'Approve', d: 'Starts a 30-day waiting period.' },
            { n: 3, t: 'Waiting period', d: 'The customer can cancel from the app.' },
            { n: 4, t: 'Erase', d: 'Personal data erased; orders kept anonymously.' },
          ].map((s) => (
            <div key={s.n} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{s.n}</span>
              <div>
                <p className="font-medium">{s.t}</p>
                <p className="text-xs text-muted-foreground">{s.d}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load requests: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={requests}
        isLoading={loading}
        getRowId={(r) => String(r.id)}
        initialSorting={[{ id: 'requested', desc: true }]}
        searchPlaceholder="Search phone, email or reason…"
        filters={[{ columnId: 'stage', title: 'Status', options: (Object.keys(STAGES) as Stage[]).map((s) => ({ value: s, label: STAGES[s].label })) }]}
        emptyMessage={requests.length === 0 ? 'No deletion requests yet.' : 'No requests match.'}
      />

      <Dialog open={!!pending} onOpenChange={(o) => !o && !saving && setPending(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{copy?.title}</DialogTitle>
            <DialogDescription>{copy?.body}</DialogDescription>
          </DialogHeader>
          {pending && (
            <div className="grid gap-3">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-medium tabular-nums">{pending.request.phoneNumber}</p>
                <p className="text-muted-foreground">{realEmail(pending.request.email) ?? 'No email'} · requested {fmt(pending.request.requestedAt)}</p>
                {pending.request.reason && <p className="mt-1">“{pending.request.reason}”</p>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="dd-notes">{pending.action === 'reject' ? 'Reason for rejecting' : 'Note (optional)'}</Label>
                <Textarea id="dd-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)} disabled={saving}>
              Cancel
            </Button>
            <Button variant={copy?.destructive ? 'destructive' : 'default'} onClick={() => void submit()} disabled={saving} className={cn(copy?.destructive && 'text-white')}>
              {saving && <Loader2 className="animate-spin" />}
              {copy?.cta}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
