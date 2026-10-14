import { useEffect, useState } from 'react';
import { Bell, Loader2, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import marketingService, { type CustomerGroup, type NotificationTemplate } from '../../services/marketingService';
import schedulesService from '../../services/marketing/schedulesService';
import { logger } from '../../utils/logger';
import AudiencePicker from './AudiencePicker';
import { audienceFields, audienceProblem, defaultAudience, type AudienceValue } from './audience';
import { useCustomerDirectory } from './customer-directory';
import RepeatPicker from './RepeatPicker';
import { defaultWhen, toRepeat, whenProblem, type WhenValue } from './when';
import { fmtRun } from './schedule-rules';

interface SendNotificationDialogProps {
  /** Loaded by the dialog when not passed. */
  templates?: NotificationTemplate[];
  /** Preselects a template. Mount with a fresh `key` per open. */
  templateId?: number;
  /** Opens with these customers already chosen, e.g. everyone who used a discount code. */
  initialUserIds?: number[];
  /** Opens with this saved group chosen. */
  initialGroupId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
}

type MessageMode = 'template' | 'custom';

const CHANNEL_OPTIONS = [
  { key: 'sendPush', label: 'Push + app inbox', icon: Bell },
  { key: 'sendSms', label: 'SMS', icon: MessageSquare },
  { key: 'sendEmail', label: 'Email', icon: Mail },
] as const;

const TITLE_MAX = 80;
const BODY_MAX = 500;

export default function SendNotificationDialog({ templates: given, templateId, initialUserIds, initialGroupId, open, onOpenChange, onSent }: SendNotificationDialogProps) {
  const [templates, setTemplates] = useState<NotificationTemplate[] | null>(given ?? null);
  const [messageMode, setMessageMode] = useState<MessageMode>(templateId || (given?.length && !initialUserIds?.length && !initialGroupId) ? 'template' : 'custom');
  const [audience, setAudience] = useState<AudienceValue>(() =>
    defaultAudience(initialGroupId ? { mode: 'group', groupId: String(initialGroupId) } : initialUserIds?.length ? { mode: 'customers', userIds: initialUserIds } : {}),
  );
  const [when, setWhen] = useState<WhenValue>(defaultWhen);
  const [form, setForm] = useState({
    templateId: String(templateId ?? given?.[0]?.id ?? ''),
    title: '',
    body: '',
    sendPush: true,
    sendSms: false,
    sendEmail: false,
  });
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const { customers } = useCustomerDirectory();
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const template = templates?.find((t) => String(t.id) === form.templateId);

  useEffect(() => {
    if (given) return;
    marketingService
      .getTemplates()
      .then((t) => {
        setTemplates(t);
        setForm((f) => (f.templateId ? f : { ...f, templateId: String(t[0]?.id ?? '') }));
      })
      .catch((err) => {
        logger.error('Failed to load templates:', err);
        setTemplates([]);
      });
  }, [given]);

  const who =
    audience.mode === 'customers'
      ? audience.userIds.length === 1
        ? (customers?.find((c) => c.id === audience.userIds[0])?.name ?? '1 customer')
        : `${audience.userIds.length} customers`
      : audience.mode === 'group'
        ? groups.find((g) => String(g.id) === audience.groupId)?.name
        : null;
  const scheduled = when.mode !== 'now';
  const sendLabel = scheduled ? (when.mode === 'once' ? 'Schedule' : 'Start repeating') : who ? `Send to ${who}` : 'Send now';

  const message = () => (messageMode === 'template' ? { templateId: template!.id } : { title: form.title.trim(), body: form.body.trim() });
  const channels = () => ({ sendPush: form.sendPush, sendSms: form.sendSms, sendEmail: form.sendEmail });

  const send = async () => {
    setProblem(null);
    if (messageMode === 'template' && !template) return setProblem('Choose a template.');
    if (messageMode === 'custom' && (!form.title.trim() || !form.body.trim())) return setProblem('Write a title and a message.');
    const bad = audienceProblem(audience) ?? whenProblem(when);
    if (bad) return setProblem(bad);
    if (!form.sendPush && !form.sendSms && !form.sendEmail) return setProblem('Pick at least one channel.');
    try {
      setSending(true);
      if (scheduled) {
        const s = await schedulesService.create({
          name: messageMode === 'template' ? template!.name : form.title.trim(),
          ...message(),
          ...audienceFields(audience),
          ...channels(),
          repeat: toRepeat(when)!,
        });
        toast.success(when.mode === 'once' ? 'Scheduled' : 'Repeating send set up', {
          description: `${s.summary ?? ''}${s.nextRunAt ? `. First send ${fmtRun(s.nextRunAt)}` : ''}`,
        });
      } else {
        const r = await marketingService.sendNotification({ ...message(), ...audienceFields(audience), sendNow: true, ...channels() });
        if (r.status === 'failed') throw new Error('Delivery failed. Check the history for details.');
        const label = r.audienceLabel ?? `${r.totalRecipients.toLocaleString()} customer${r.totalRecipients === 1 ? '' : 's'}`;
        toast.success(`Sent to ${label}`, {
          description: r.failureCount ? `${r.failureCount.toLocaleString()} deliveries failed (no app, phone or email).` : undefined,
        });
      }
      onSent?.();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to send notification:', err);
      setProblem(err instanceof Error ? err.message : 'Couldn’t send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send a notification</DialogTitle>
          <DialogDescription>
            {scheduled ? 'Goes out at the times below. You can pause or stop it under Scheduled.' : 'Goes out immediately and can’t be recalled.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <section className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Message</Label>
              <Tabs value={messageMode} onValueChange={(v) => setMessageMode(v as MessageMode)}>
                <TabsList className="h-8">
                  <TabsTrigger value="template" className="text-xs" disabled={templates !== null && templates.length === 0}>
                    Template
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="text-xs">
                    Write one
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {messageMode === 'template' ? (
              <>
                <Select value={form.templateId} onValueChange={(v) => set({ templateId: v })} disabled={!templates}>
                  <SelectTrigger aria-label="Template" className="w-full">
                    <SelectValue placeholder={templates ? 'Choose a template' : 'Loading templates…'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(templates ?? []).map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {template && (
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                    <p className="font-medium">{template.title}</p>
                    <p className="text-muted-foreground">{template.body}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="grid gap-2">
                <Input aria-label="Title" value={form.title} maxLength={TITLE_MAX} onChange={(e) => set({ title: e.target.value })} placeholder="Title, e.g. Your order is on us" />
                <Textarea
                  aria-label="Message"
                  rows={3}
                  value={form.body}
                  maxLength={BODY_MAX}
                  onChange={(e) => set({ body: e.target.value })}
                  placeholder="What you want to tell them"
                />
                <p className="text-right text-xs text-muted-foreground tabular-nums">
                  {form.body.length}/{BODY_MAX}
                </p>
              </div>
            )}
          </section>

          <section className="grid gap-2">
            <Label>Who</Label>
            <AudiencePicker value={audience} onChange={setAudience} onGroups={setGroups} />
          </section>

          <section className="grid gap-2">
            <Label>When</Label>
            <RepeatPicker value={when} onChange={setWhen} />
          </section>

          <section className="grid gap-1.5">
            <Label>Channels</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {CHANNEL_OPTIONS.map((c) => (
                <label
                  key={c.key}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <Checkbox checked={form[c.key]} onCheckedChange={(v) => set({ [c.key]: v === true })} />
                  <c.icon className="size-4 text-muted-foreground" />
                  {c.label}
                </label>
              ))}
            </div>
            {form.sendSms && (
              <p className="text-xs text-amber-700">SMS goes to every chosen customer with a phone number and uses SMS credit{scheduled ? ' each time it sends' : ''}.</p>
            )}
          </section>
        </div>

        <DialogFooter className="items-center">
          {problem && <p className="mr-auto text-sm text-destructive">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={() => void send()} disabled={sending}>
            {sending && <Loader2 className="animate-spin" />}
            {sendLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
