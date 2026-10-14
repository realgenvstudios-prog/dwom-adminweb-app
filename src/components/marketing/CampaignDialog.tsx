import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import marketingService, { type Campaign } from '../../services/marketingService';
import ridersService, { type Zone } from '../../services/ridersService';
import { logger } from '../../utils/logger';
import { AUDIENCES, CHANNELS, OBJECTIVES, num } from './campaign-meta';
import ZonePicker from './ZonePicker';

interface CampaignDialogProps {
  /** null = new campaign; a draft = edit its wording. Mount with a fresh `key` per open. */
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function CampaignDialog({ campaign, open, onOpenChange, onSaved }: CampaignDialogProps) {
  const editing = !!campaign;
  const [form, setForm] = useState({
    name: campaign?.name ?? '',
    channel: (campaign?.channel ?? 'push') as Campaign['channel'],
    objective: (campaign?.objective ?? 'conversion') as Campaign['objective'],
    targetZones: (campaign?.targetZones ?? []) as number[],
    audience: campaign?.targetSubscriptionStatus || 'all',
    title: campaign?.title ?? '',
    content: campaign?.content ?? '',
    startDate: campaign ? campaign.startDate.slice(0, 10) : today(),
    endDate: campaign?.endDate ? campaign.endDate.slice(0, 10) : '',
    budget: campaign?.budget != null ? String(num(campaign.budget)) : '',
    description: campaign?.description ?? '',
  });
  const [zones, setZones] = useState<Zone[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (editing) return;
    ridersService
      .getAllZones()
      .then(setZones)
      .catch((err) => logger.error('Failed to load zones:', err));
  }, [editing]);

  const isSocial = form.channel === 'social';
  const smsLength = `${form.title || form.name}: ${form.content}`.length;

  const save = async () => {
    if (!form.name.trim()) return setProblem('Give the campaign a name.');
    if (!form.content.trim()) return setProblem('Write the message.');
    if (isSocial && form.endDate && form.endDate < form.startDate) return setProblem('The end date is before the start date.');
    // Dates and budget only mean something for social: every other channel
    // sends the moment it's launched and costs per message, not a budget.
    const budget = !isSocial || form.budget.trim() === '' ? undefined : Number.parseFloat(form.budget);
    if (budget !== undefined && !(budget >= 0)) return setProblem('Budget must be 0 or more.');
    setProblem(null);
    try {
      setSaving(true);
      if (campaign) {
        await marketingService.updateCampaign(campaign.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          title: form.title.trim() || undefined,
          content: form.content.trim(),
          ...(budget !== undefined && { budget }),
        });
        toast.success('Campaign updated');
      } else {
        await marketingService.createCampaign({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          channel: form.channel,
          objective: form.objective,
          targetZones: form.targetZones.length ? form.targetZones : undefined,
          targetSubscriptionStatus: form.audience,
          startDate: isSocial ? form.startDate : today(),
          endDate: (isSocial && form.endDate) || undefined,
          budget,
          title: form.title.trim() || undefined,
          content: form.content.trim(),
        });
        toast.success(isSocial ? 'Campaign saved as a draft' : 'Draft saved — open it to launch when you’re ready');
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save campaign:', err);
      setProblem(err instanceof Error ? err.message : 'Couldn’t save the campaign.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit draft' : 'New campaign'}</DialogTitle>
          <DialogDescription>{editing ? 'Channel and audience are fixed once a campaign is created.' : 'Saved as a draft. Nothing is sent until you launch it.'}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-1.5">
            <Label htmlFor="cp-name">Name</Label>
            <Input id="cp-name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Weekend fresh produce push" autoFocus={!editing} />
          </div>

          {!editing && (
            <div className="grid gap-1.5">
              <Label>Channel</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {CHANNELS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => set({ channel: c.value })}
                    aria-pressed={form.channel === c.value}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors',
                      form.channel === c.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted',
                    )}
                  >
                    <c.icon className="size-4" />
                    <span className="text-sm font-medium">{c.label}</span>
                  </button>
                ))}
              </div>
              <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                <p className="text-foreground">{CHANNELS.find((c) => c.value === form.channel)?.hint}</p>
                <p>{CHANNELS.find((c) => c.value === form.channel)?.credit}</p>
              </div>
            </div>
          )}

          {!editing && !isSocial && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="cp-zones">Zones</Label>
                <ZonePicker id="cp-zones" zones={zones} value={form.targetZones} onChange={(v) => set({ targetZones: v })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cp-aud">Who</Label>
                <Select value={form.audience} onValueChange={(v) => set({ audience: v })}>
                  <SelectTrigger id="cp-aud" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="-mt-2 text-xs text-muted-foreground sm:col-span-2">A zone matches customers with any saved address inside it.</p>
            </div>
          )}

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="cp-title">{form.channel === 'email' ? 'Subject' : 'Title'}</Label>
              <Input id="cp-title" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder={`Optional — defaults to the campaign name`} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cp-content">{isSocial ? 'Post copy' : 'Message'}</Label>
              <Textarea
                id="cp-content"
                rows={3}
                value={form.content}
                onChange={(e) => set({ content: e.target.value })}
                placeholder="e.g. Fresh tomatoes and peppers are in — 10% off this weekend only."
              />
              {form.channel === 'sms' && (
                <p className={cn('text-xs', smsLength > 160 ? 'text-amber-700' : 'text-muted-foreground')}>
                  {smsLength} characters as sent
                  {smsLength > 160 ? ` — ${Math.ceil(smsLength / 153)} SMS parts per customer` : ''}
                </p>
              )}
            </div>
          </div>

          {isSocial && (
            <div className="grid gap-4 sm:grid-cols-3">
              {!editing && (
                <>
                  <div className="grid gap-1.5">
                    <Label htmlFor="cp-start">Start</Label>
                    <Input id="cp-start" type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="cp-end">End</Label>
                    <Input id="cp-end" type="date" value={form.endDate} min={form.startDate} onChange={(e) => set({ endDate: e.target.value })} />
                  </div>
                </>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="cp-budget">Budget</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">₵</span>
                  <Input
                    id="cp-budget"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.budget}
                    onChange={(e) => set({ budget: e.target.value })}
                    placeholder="Optional"
                    className="pl-7 tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            {!editing && (
              <div className="grid gap-1.5">
                <Label htmlFor="cp-obj">Goal</Label>
                <Select value={form.objective} onValueChange={(v) => set({ objective: v as Campaign['objective'] })}>
                  <SelectTrigger id="cp-obj" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBJECTIVES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className={cn('grid gap-1.5', editing && 'sm:col-span-2')}>
              <Label htmlFor="cp-desc">Internal notes</Label>
              <Input id="cp-desc" value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Optional — only admins see this" />
            </div>
          </div>
        </div>

        <DialogFooter className="items-center">
          {problem && <p className="mr-auto text-sm text-destructive">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {editing ? 'Save changes' : 'Save draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
