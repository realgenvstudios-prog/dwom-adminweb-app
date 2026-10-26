import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, FileCog, RotateCw, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import riderApplicationsService, { type ApplicationRow, type ApprovalStatus } from '../../../services/riderApplicationsService';
import { can } from '../../../config/permissions';
import { logger } from '../../../utils/logger';
import { APPROVAL, vehicleLabel, when } from './application-meta';
import ApplicationSheet from './ApplicationSheet';
import DocumentRulesDialog from './DocumentRulesDialog';
import ExpiringDocuments from './ExpiringDocuments';

const FILTERS: { key: ApprovalStatus | 'open'; label: string }[] = [
  { key: 'pending', label: 'Waiting for review' },
  { key: 'changes_requested', label: 'Needs changes' },
  { key: 'incomplete', label: 'Not finished' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'approved', label: 'Approved' },
];

function Tick({ ok }: { ok: boolean }) {
  return ok ? <Check className="size-4 text-emerald-600" /> : <X className="size-4 text-muted-foreground" />;
}

/** New riders signing up: check their documents, then approve, ask for changes or reject. */
export default function ApplicationsTab() {
  const [filter, setFilter] = useState<ApprovalStatus | 'open'>('pending');
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [counts, setCounts] = useState<Partial<Record<ApprovalStatus, number>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      // Everything not yet approved, in one call; approved riders only when asked for.
      const open = await riderApplicationsService.list();
      const c: Partial<Record<ApprovalStatus, number>> = {};
      for (const r of open) c[r.approvalStatus] = (c[r.approvalStatus] ?? 0) + 1;
      setCounts(c);
      setRows(filter === 'approved' ? await riderApplicationsService.list('approved') : open.filter((r) => r.approvalStatus === filter));
    } catch (err) {
      logger.error('Failed to load rider applications:', err);
      setError(err instanceof Error ? err.message : 'Couldn’t load applications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="flex flex-col gap-4">
      <ExpiringDocuments onOpen={setOpenId} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setLoading(true);
                setFilter(f.key);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                filter === f.key ? 'border-foreground bg-foreground text-background' : 'bg-background hover:bg-muted',
              )}
            >
              {f.label}
              {f.key !== 'approved' && f.key !== 'open' && (counts[f.key] ?? 0) > 0 && <span className="tabular-nums opacity-70">{counts[f.key]}</span>}
            </button>
          ))}
        </div>
        {can('riders.documentRules') && (
          <Button variant="outline" onClick={() => setRulesOpen(true)}>
            <FileCog />
            Document rules
          </Button>
        )}
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <Card className="gap-0 py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rider</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead className="text-center">Payout</TableHead>
                <TableHead className="text-center">Briefing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {loading ? 'Loading…' : filter === 'pending' ? 'No applications waiting. New riders show up here when they send their documents.' : 'Nobody here.'}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpenId(r.id)}>
                  <TableCell>
                    <p className="font-medium">{r.name || 'No name yet'}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{r.phone}</p>
                  </TableCell>
                  <TableCell>{vehicleLabel(r.vehicleType)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={APPROVAL[r.approvalStatus].className}>
                      {APPROVAL[r.approvalStatus].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{when(r.submittedAt)}</TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {r.documents.total} uploaded
                    {r.documents.pending > 0 && <span className="text-sky-700"> · {r.documents.pending} to check</span>}
                    {r.documents.rejected > 0 && <span className="text-red-700"> · {r.documents.rejected} rejected</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Tick ok={r.payoutReady} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Tick ok={r.briefingDone} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {openId !== null && <ApplicationSheet key={openId} riderId={openId} onOpenChange={(o) => !o && setOpenId(null)} onChanged={() => void load()} />}
      {rulesOpen && <DocumentRulesDialog onOpenChange={setRulesOpen} />}
    </div>
  );
}
