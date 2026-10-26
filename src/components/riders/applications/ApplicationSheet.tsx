import { useCallback, useEffect, useState } from 'react';
import { Check, ExternalLink, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import riderApplicationsService, { type Application, type DocRequirement } from '../../../services/riderApplicationsService';
import { can } from '../../../config/permissions';
import { APPROVAL, DOC_STATE, EVENT_LABELS, vehicleLabel, when } from './application-meta';

interface Props {
  riderId: number;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

type Asking = { kind: 'doc'; documentId: number; name: string } | { kind: 'changes_requested' } | { kind: 'rejected' };

function DocumentCard({ doc, busy, onApprove, onReject }: { doc: DocRequirement; busy: boolean; onApprove: () => void; onReject: () => void }) {
  const state = DOC_STATE[doc.state];
  const cur = doc.current;
  const reviewable = can('riders.review') && cur && cur.status === 'pending' && doc.state !== 'expired';
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{doc.name}</p>
          <p className="text-xs text-muted-foreground">{doc.rule === 'required' ? 'Required' : doc.rule === 'optional' ? 'Optional' : 'No longer asked for'}</p>
        </div>
        <Badge variant="outline" className={state.className}>
          {state.label}
        </Badge>
      </div>
      {cur?.files && cur.files.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {cur.files.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-md border bg-muted">
              <img src={url} alt={`${doc.name}${doc.sides === 2 ? (i === 0 ? ' front' : ' back') : ''}`} className="aspect-[4/3] w-full object-cover" />
              <span className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded bg-background/90 px-1.5 py-0.5 text-[11px] opacity-0 transition-opacity group-hover:opacity-100">
                {doc.sides === 2 ? (i === 0 ? 'Front' : 'Back') : 'Open'} <ExternalLink className="size-3" />
              </span>
            </a>
          ))}
        </div>
      )}
      {cur && (cur.number || cur.expiresAt) && (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {cur.number && (
            <div>
              <dt className="text-xs text-muted-foreground">{doc.numberLabel ?? 'Number'}</dt>
              <dd className="font-mono">{cur.number}</dd>
            </div>
          )}
          {cur.expiresAt && (
            <div>
              <dt className="text-xs text-muted-foreground">Expires</dt>
              <dd className={doc.state === 'expired' ? 'text-red-700' : ''}>{new Date(cur.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</dd>
            </div>
          )}
        </dl>
      )}
      {cur?.status === 'rejected' && cur.rejectionReason && <p className="text-sm text-red-700">Rejected: {cur.rejectionReason}</p>}
      {reviewable && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onApprove} disabled={busy}>
            <Check />
            Looks right
          </Button>
          <Button size="sm" variant="outline" onClick={onReject} disabled={busy}>
            <X />
            Ask to re-upload
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ApplicationSheet({ riderId, onOpenChange, onChanged }: Props) {
  const [app, setApp] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState<Asking | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      setApp(await riderApplicationsService.get(riderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t load this application');
    }
  }, [riderId]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const act = async (fn: () => Promise<Application>, done: string) => {
    setBusy(true);
    try {
      setApp(await fn());
      toast.success(done);
      setAsking(null);
      setReason('');
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'That didn’t work');
    } finally {
      setBusy(false);
    }
  };

  const sendAsk = () => {
    if (!asking || !reason.trim()) return;
    if (asking.kind === 'doc') void act(() => riderApplicationsService.reviewDocument(asking.documentId, 'rejected', reason.trim()), `Asked to re-upload ${asking.name}`);
    else void act(() => riderApplicationsService.decline(riderId, asking.kind, reason.trim()), asking.kind === 'rejected' ? 'Application rejected' : 'Sent back for changes');
  };

  const r = app?.rider;
  const status = r ? APPROVAL[r.approvalStatus] : null;
  const decidable = can('riders.review') && r && ['pending', 'changes_requested', 'incomplete'].includes(r.approvalStatus);

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="gap-2 border-b p-6 pb-4">
          <SheetTitle className="text-xl">{r?.name || (app ? 'No name yet' : 'Loading…')}</SheetTitle>
          {r && status && (
            <SheetDescription className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
              <span>{vehicleLabel(r.vehicleType)}</span>
              <span className="tabular-nums">· {r.phone}</span>
            </SheetDescription>
          )}
          {r?.rejectionReason && r.approvalStatus !== 'approved' && <p className="text-sm text-amber-800">Last message to rider: {r.rejectionReason}</p>}
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!app && !error && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          )}

          {app && (
            <>
              <section className="space-y-3">
                <h3 className="text-sm font-medium">Documents</h3>
                {app.documents.map((d) => (
                  <DocumentCard
                    key={d.key}
                    doc={d}
                    busy={busy}
                    onApprove={() => d.current && void act(() => riderApplicationsService.reviewDocument(d.current!.id, 'approved'), `${d.name} approved`)}
                    onReject={() => d.current && setAsking({ kind: 'doc', documentId: d.current.id, name: d.name })}
                  />
                ))}
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-medium">Payout account</h3>
                {app.rider.payout ? (
                  <div className="rounded-lg border p-4 text-sm">
                    <p className="font-medium">
                      {app.rider.payout.bankName} · <span className="font-mono">{app.rider.payout.accountNumber}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {app.rider.payout.accountName ? `Name on account: ${app.rider.payout.accountName}` : 'Paystack couldn’t confirm the name. Check it matches the Ghana Card before the first payout.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not added yet.</p>
                )}
                <p className="text-sm text-muted-foreground">Safety briefing: {app.rider.briefingCompletedAt ? `done ${when(app.rider.briefingCompletedAt)}` : 'not done yet'}</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-medium">History</h3>
                <ol className="space-y-1.5 text-sm">
                  {app.events.map((e) => (
                    <li key={e.id} className="flex justify-between gap-4">
                      <span>
                        {EVENT_LABELS[e.type] ?? e.type}
                        {typeof e.data?.reason === 'string' && <span className="text-muted-foreground"> — {e.data.reason}</span>}
                      </span>
                      <span className="shrink-0 text-muted-foreground tabular-nums">{when(e.createdAt)}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
        </div>

        {asking && (
          <div className="space-y-2 border-t bg-muted/40 p-4">
            <p className="text-sm font-medium">
              {asking.kind === 'doc' ? `What’s wrong with the ${asking.name}?` : asking.kind === 'rejected' ? 'Why is this rider rejected?' : 'What should the rider change?'}
            </p>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="The rider sees this message." autoFocus />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAsking(null)} disabled={busy}>
                Cancel
              </Button>
              <Button size="sm" variant={asking.kind === 'rejected' ? 'destructive' : 'default'} onClick={sendAsk} disabled={busy || !reason.trim()}>
                {busy && <Loader2 className="animate-spin" />}
                Send to rider
              </Button>
            </div>
          </div>
        )}

        {decidable && !asking && (
          <SheetFooter className="flex-row flex-wrap justify-end gap-2 border-t p-4">
            <Button variant="ghost" onClick={() => setAsking({ kind: 'rejected' })} disabled={busy}>
              Reject
            </Button>
            <Button variant="outline" onClick={() => setAsking({ kind: 'changes_requested' })} disabled={busy}>
              Ask for changes
            </Button>
            <Button onClick={() => void act(() => riderApplicationsService.approve(riderId), 'Rider approved')} disabled={busy || r?.approvalStatus === 'incomplete'}>
              {busy && <Loader2 className="animate-spin" />}
              Approve rider
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
