import { useEffect, useState } from 'react';
import { ExternalLink, Info, Loader2, Pause, Pencil, Play, Rocket, Square, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import marketingService, { type Campaign } from '../../services/marketingService';
import type { Zone } from '../../services/ridersService';
import { logger } from '../../utils/logger';
import { formatDate } from '../customers/CustomerTypes';
import { formatGhs } from '../orders/order-status';
import { AUDIENCES, channelOf, num, objectiveLabel, statusOf } from './campaign-meta';
import customerGroupsService from '../../services/marketing/customerGroupsService';
import { useCustomerDirectory } from './customer-directory';
import { fmtRun } from './schedule-rules';

interface CampaignSheetProps {
  campaign: Campaign;
  zones: Zone[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (c: Campaign) => void;
  onChanged: () => void;
}

const errText = (err: unknown) => (err instanceof Error ? err.message : '');

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function CampaignSheet({ campaign: c, zones, open, onOpenChange, onEdit, onChanged }: CampaignSheetProps) {
  const channel = channelOf(c.channel);
  const status = statusOf(c.status);
  const spend = num(c.actualSpend);
  const manual = c.channel === 'social' || c.metricsAreEstimate;
  // Push and in-app cost nothing to send; SMS uses credit; social is ad spend.
  const hasCost = c.channel === 'social' || c.channel === 'sms' || spend > 0;
  const [results, setResults] = useState({
    spend: spend ? String(spend) : '',
    impressions: c.impressions ? String(c.impressions) : '',
    clicks: c.clicks ? String(c.clicks) : '',
    conversions: c.metricsAreEstimate && c.conversions ? String(c.conversions) : '',
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'launch' | 'delete' | null>(null);

  const zoneNames = c.targetZones?.length ? c.targetZones.map((id) => zones.find((z) => z.id === id)?.name ?? `Zone #${id}`).join(', ') : 'Every zone';
  const { customers } = useCustomerDirectory();
  const [groupName, setGroupName] = useState<string | null>(null);
  useEffect(() => {
    if (!c.targetGroupId) return;
    customerGroupsService
      .list()
      .then((gs) => setGroupName(gs.find((g) => g.id === c.targetGroupId)?.name ?? 'A deleted group'))
      .catch(() => setGroupName('A saved group'));
  }, [c.targetGroupId]);
  const chosen = c.targetUserIds ?? [];
  const picked = c.targetGroupId
    ? `Group: ${groupName ?? '…'}`
    : chosen.length
      ? chosen.length <= 3
        ? chosen.map((id) => customers?.find((x) => x.id === id)?.name ?? `Customer #${id}`).join(', ')
        : `${chosen.length} chosen customers`
      : null;
  const audience = picked ?? AUDIENCES.find((a) => a.value === (c.targetSubscriptionStatus || 'all'))?.label ?? c.targetSubscriptionStatus;
  const schedule = c.Schedule ?? null;

  const run = async (key: string, fn: () => Promise<unknown>, success: string) => {
    try {
      setBusy(key);
      await fn();
      toast.success(success);
      onChanged();
    } catch (err) {
      logger.error(`Campaign action ${key} failed:`, err);
      toast.error(`Couldn’t update the campaign. ${errText(err)}`.trim());
    } finally {
      setBusy(null);
    }
  };

  const launch = async () => {
    setConfirm(null);
    try {
      setBusy('launch');
      const r = await marketingService.launchCampaign(c.id);
      if (c.channel === 'social') toast.success('Campaign is live. Record its results here as they come in');
      else if (r.scheduled) toast.success('Campaign launched', { description: r.nextRunAt ? `First send ${fmtRun(r.nextRunAt)} (Ghana time).` : undefined });
      else
        toast.success(`Sent to ${r.successCount.toLocaleString()} of ${r.totalRecipients.toLocaleString()} customers`, {
          description: r.failureCount ? `${r.failureCount.toLocaleString()} couldn’t be reached (no app, phone or email).` : undefined,
        });
      onChanged();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to launch campaign:', err);
      toast.error(`Couldn’t launch. ${errText(err)}`.trim());
    } finally {
      setBusy(null);
    }
  };

  const saveResults = () => {
    const toNum = (v: string) => (v.trim() === '' ? 0 : Number(v));
    const s = toNum(results.spend);
    const imp = Math.round(toNum(results.impressions));
    const clk = Math.round(toNum(results.clicks));
    const conv = Math.round(toNum(results.conversions));
    if ([s, imp, clk, conv].some((n) => !Number.isFinite(n) || n < 0)) return toast.error('Results must be 0 or more.');
    void run(
      'results',
      () =>
        marketingService.updateCampaign(c.id, {
          actualSpend: s,
          ...(manual && { impressions: imp, clicks: clk }),
          ...(c.metricsAreEstimate && {
            conversions: conv,
            cac: conv > 0 ? Math.round((s / conv) * 100) / 100 : 0,
          }),
        }),
      'Results saved',
    );
  };

  const remove = async () => {
    setConfirm(null);
    try {
      setBusy('delete');
      await marketingService.deleteCampaign(c.id);
      toast.success('Campaign deleted');
      onChanged();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to delete campaign:', err);
      toast.error(`Couldn’t delete. ${errText(err)}`.trim());
    } finally {
      setBusy(null);
    }
  };

  const setStatus = (next: Campaign['status'], msg: string) => run(next, () => marketingService.updateCampaign(c.id, { status: next }), msg);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="border-b p-6 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <channel.icon className="size-3" />
              {channel.label}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              {objectiveLabel(c.objective)}
            </Badge>
          </div>
          <SheetTitle className="text-xl">{c.name}</SheetTitle>
          <SheetDescription>
            {formatDate(c.startDate)}
            {c.endDate ? ` – ${formatDate(c.endDate)}` : ''}
            {c.budget != null && num(c.budget) > 0 ? ` · Budget ${formatGhs(num(c.budget))}` : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
          {c.status !== 'draft' && (
            <section className="grid gap-3">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Results</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Metric label={c.channel === 'social' ? 'Reach' : 'Delivered'} value={c.impressions.toLocaleString()} />
                <Metric label="Orders" value={c.conversions.toLocaleString()} hint={c.metricsAreEstimate ? 'Entered by hand' : 'Paid, credited automatically'} />
                <Metric label="Revenue" value={c.metricsAreEstimate ? 'Not tracked' : formatGhs(c.revenue)} />
                <Metric label="Spend" value={formatGhs(spend)} />
                <Metric label="Cost per order" value={c.conversions > 0 && spend > 0 ? formatGhs(spend / c.conversions) : 'None'} />
                <Metric label="Return on spend" value={!c.metricsAreEstimate && spend > 0 ? `${(c.revenue / spend).toFixed(1)}×` : 'None'} />
              </div>
              {c.Coupon && c.Coupon.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Linked code{c.Coupon.length > 1 ? 's' : ''}:{' '}
                  {c.Coupon.map((k) => (
                    <span key={k.id} className="mr-2 inline-flex items-center gap-1">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{k.code}</code>
                      {k.usageCount} use{k.usageCount === 1 ? '' : 's'}
                    </span>
                  ))}
                </p>
              )}
              <p className="flex gap-2 text-xs text-muted-foreground">
                <Info className="mt-px size-3.5 shrink-0" />
                {channel.credit}
              </p>
            </section>
          )}

          {c.status !== 'draft' && (hasCost || manual) && (
            <section className="grid gap-3">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Record results</h3>
              <div className="grid grid-cols-2 gap-3">
                {hasCost && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="cr-spend">{c.channel === 'sms' ? 'SMS cost' : 'Spend so far'}</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">₵</span>
                      <Input
                        id="cr-spend"
                        type="number"
                        min={0}
                        step="0.01"
                        value={results.spend}
                        onChange={(e) => setResults({ ...results, spend: e.target.value })}
                        className="pl-7 tabular-nums"
                      />
                    </div>
                  </div>
                )}
                {manual && (
                  <>
                    <div className="grid gap-1.5">
                      <Label htmlFor="cr-imp">Reach</Label>
                      <Input
                        id="cr-imp"
                        type="number"
                        min={0}
                        value={results.impressions}
                        onChange={(e) =>
                          setResults({
                            ...results,
                            impressions: e.target.value,
                          })
                        }
                        className="tabular-nums"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="cr-clk">Clicks</Label>
                      <Input
                        id="cr-clk"
                        type="number"
                        min={0}
                        value={results.clicks}
                        onChange={(e) => setResults({ ...results, clicks: e.target.value })}
                        className="tabular-nums"
                      />
                    </div>
                  </>
                )}
                {c.metricsAreEstimate && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="cr-conv">Orders (estimate)</Label>
                    <Input
                      id="cr-conv"
                      type="number"
                      min={0}
                      value={results.conversions}
                      onChange={(e) => setResults({ ...results, conversions: e.target.value })}
                      className="tabular-nums"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {c.metricsAreEstimate
                  ? 'No orders have been credited to this campaign yet, so your estimate is shown. Real orders replace it automatically.'
                  : 'Orders and revenue are tracked automatically. Spend is what you paid (ads, SMS credit).'}
              </p>
              <div>
                <Button size="sm" variant="outline" onClick={saveResults} disabled={!!busy}>
                  {busy === 'results' && <Loader2 className="animate-spin" />}
                  Save results
                </Button>
              </div>
            </section>
          )}

          <section className="grid gap-3">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Message</h3>
            <div className="rounded-lg border bg-muted/40 p-4">
              {c.title && <p className="font-medium">{c.title}</p>}
              <p className="text-sm whitespace-pre-wrap">{c.content}</p>
              {c.ctaLink && (
                <p className="mt-2 flex items-center gap-1 text-xs break-all text-muted-foreground">
                  <ExternalLink className="size-3 shrink-0" />
                  {c.ctaLink}
                </p>
              )}
            </div>
            {c.channel !== 'social' && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
                {!picked && (
                  <>
                    <dt className="text-muted-foreground">Zones</dt>
                    <dd>{zoneNames}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">Who</dt>
                <dd>{audience}</dd>
                <dt className="text-muted-foreground">When</dt>
                <dd>{schedule ? (schedule.summary ?? 'On a schedule') : 'Once, when launched'}</dd>
                {schedule && (
                  <>
                    <dt className="text-muted-foreground">Next send</dt>
                    <dd>
                      {schedule.active && schedule.nextRunAt
                        ? fmtRun(schedule.nextRunAt)
                        : c.status === 'draft'
                          ? 'Starts when launched'
                          : c.status === 'paused'
                            ? 'Paused'
                            : 'None, finished'}
                      {schedule.runCount > 0 && <span className="text-muted-foreground"> · sent {schedule.runCount}×</span>}
                    </dd>
                    {schedule.lastError && (
                      <>
                        <dt className="text-muted-foreground">Last problem</dt>
                        <dd className="text-destructive">{schedule.lastError}</dd>
                      </>
                    )}
                  </>
                )}
              </dl>
            )}
            {c.description && <p className="text-sm text-muted-foreground">Notes: {c.description}</p>}
          </section>
        </div>

        <SheetFooter className="flex-row flex-wrap items-center gap-2 border-t p-4">
          {c.status === 'draft' ? (
            <>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirm('delete')} disabled={!!busy}>
                <Trash2 />
                Delete
              </Button>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(c)} disabled={!!busy}>
                  <Pencil />
                  Edit
                </Button>
                <Button size="sm" onClick={() => setConfirm('launch')} disabled={!!busy}>
                  {busy === 'launch' ? <Loader2 className="animate-spin" /> : <Rocket />}
                  {c.channel === 'social' ? 'Mark as live' : 'Launch'}
                </Button>
              </div>
            </>
          ) : c.status === 'ended' ? (
            <p className="text-sm text-muted-foreground">This campaign has ended. Its results stay here.</p>
          ) : (
            <div className="ml-auto flex gap-2">
              {c.status === 'active' ? (
                <Button variant="outline" size="sm" onClick={() => void setStatus('paused', 'Campaign paused')} disabled={!!busy}>
                  {busy === 'paused' ? <Loader2 className="animate-spin" /> : <Pause />}
                  Pause
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => void setStatus('active', 'Campaign resumed')} disabled={!!busy}>
                  {busy === 'active' ? <Loader2 className="animate-spin" /> : <Play />}
                  Resume
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => void setStatus('ended', 'Campaign ended')} disabled={!!busy}>
                {busy === 'ended' ? <Loader2 className="animate-spin" /> : <Square />}
                End
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          {confirm === 'launch' ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{c.channel === 'social' ? 'Mark as live?' : schedule ? `Launch “${c.name}”?` : `Send “${c.name}” now?`}</AlertDialogTitle>
                <AlertDialogDescription>
                  {c.channel === 'social'
                    ? 'Nothing is sent. This just starts tracking it; post it on your social channels yourself.'
                    : schedule
                      ? `It goes to ${picked ?? audience?.toLowerCase()} on its schedule: ${schedule.summary ?? ''}. Pause or end it any time.`
                      : picked
                        ? `This sends a ${channel.label.toLowerCase()} message right now to ${picked}. It can’t be undone.`
                        : `This sends a ${channel.label.toLowerCase()} message right now to ${audience?.toLowerCase()} in ${zoneNames === 'Every zone' ? 'every zone' : zoneNames}. It can’t be undone.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => void launch()}>{c.channel === 'social' ? 'Mark as live' : schedule ? 'Launch' : 'Send now'}</AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
                <AlertDialogDescription>“{c.name}” hasn’t been sent. It’s removed for good.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => void remove()}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
