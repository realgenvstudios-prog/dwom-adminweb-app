import { useEffect, useState } from 'react';
import { Bell, Loader2, Mail, MessageSquare, Save } from 'lucide-react';
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
import customerGroupsService from '../../services/marketing/customerGroupsService';
import ridersService, { type Zone } from '../../services/ridersService';
import { logger } from '../../utils/logger';
import { AUDIENCES } from './campaign-meta';
import CustomerPicker from './CustomerPicker';
import { useCustomerDirectory } from './customer-directory';
import ZonePicker from './ZonePicker';

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
type AudienceMode = 'everyone' | 'customers' | 'group';

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
  const [audienceMode, setAudienceMode] = useState<AudienceMode>(initialGroupId ? 'group' : initialUserIds?.length ? 'customers' : 'everyone');
  const [form, setForm] = useState({
    templateId: String(templateId ?? given?.[0]?.id ?? ''),
    title: '',
    body: '',
    targetZones: [] as number[],
    audience: 'all',
    userIds: initialUserIds ?? ([] as number[]),
    groupId: initialGroupId ? String(initialGroupId) : '',
    sendPush: true,
    sendSms: false,
    sendEmail: false,
  });
  const [zones, setZones] = useState<Zone[]>([]);
  const [groups, setGroups] = useState<CustomerGroup[] | null>(null);
  const [groupName, setGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const { customers, failed: customersFailed } = useCustomerDirectory();
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const template = templates?.find((t) => String(t.id) === form.templateId);
  const group = groups?.find((g) => String(g.id) === form.groupId);

  useEffect(() => {
    ridersService
      .getAllZones()
      .then(setZones)
      .catch((err) => logger.error('Failed to load zones:', err));
    customerGroupsService
      .list()
      .then(setGroups)
      .catch((err) => {
        logger.error('Failed to load customer groups:', err);
        setGroups([]);
      });
    if (!given) {
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
    }
  }, [given]);

  const pickedName = form.userIds.length === 1 ? customers?.find((c) => c.id === form.userIds[0])?.name : undefined;
  const sendLabel =
    audienceMode === 'customers'
      ? form.userIds.length === 1
        ? `Send to ${pickedName ?? '1 customer'}`
        : `Send to ${form.userIds.length} customers`
      : audienceMode === 'group'
        ? group
          ? `Send to ${group.name}`
          : 'Send'
        : 'Send now';

  const saveGroup = async () => {
    const name = groupName.trim();
    if (!name) return;
    try {
      setSavingGroup(true);
      const g = await customerGroupsService.create({ name, userIds: form.userIds });
      setGroups((prev) => [...(prev ?? []), g].sort((a, b) => a.name.localeCompare(b.name)));
      setGroupName('');
      toast.success(`Saved “${g.name}” with ${g.members.length} customer${g.members.length === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t save the group.');
    } finally {
      setSavingGroup(false);
    }
  };

  const send = async () => {
    setProblem(null);
    if (messageMode === 'template' && !template) return setProblem('Choose a template.');
    if (messageMode === 'custom' && (!form.title.trim() || !form.body.trim())) return setProblem('Write a title and a message.');
    if (audienceMode === 'customers' && form.userIds.length === 0) return setProblem('Choose at least one customer.');
    if (audienceMode === 'group' && !group) return setProblem('Choose a group.');
    if (!form.sendPush && !form.sendSms && !form.sendEmail) return setProblem('Pick at least one channel.');
    try {
      setSending(true);
      const r = await marketingService.sendNotification({
        ...(messageMode === 'template' ? { templateId: template!.id } : { title: form.title.trim(), body: form.body.trim() }),
        ...(audienceMode === 'customers'
          ? { targetUserIds: form.userIds }
          : audienceMode === 'group'
            ? { groupId: group!.id }
            : { targetZones: form.targetZones.length ? form.targetZones : undefined, targetSubscriptionStatus: form.audience }),
        sendNow: true,
        sendPush: form.sendPush,
        sendSms: form.sendSms,
        sendEmail: form.sendEmail,
      });
      if (r.status === 'failed') throw new Error('Delivery failed. Check the history for details.');
      const who = r.audienceLabel ?? `${r.totalRecipients.toLocaleString()} customer${r.totalRecipients === 1 ? '' : 's'}`;
      toast.success(`Sent to ${who}`, {
        description: r.failureCount ? `${r.failureCount.toLocaleString()} deliveries failed (no app, phone or email).` : undefined,
      });
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
          <DialogDescription>Goes out immediately and can’t be recalled.</DialogDescription>
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
            <div className="flex items-center justify-between gap-3">
              <Label>Who</Label>
              <Tabs value={audienceMode} onValueChange={(v) => setAudienceMode(v as AudienceMode)}>
                <TabsList className="h-8">
                  <TabsTrigger value="everyone" className="text-xs">
                    Everyone
                  </TabsTrigger>
                  <TabsTrigger value="customers" className="text-xs">
                    Customers
                  </TabsTrigger>
                  <TabsTrigger value="group" className="text-xs">
                    Group
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {audienceMode === 'everyone' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="sn-zones" className="text-xs text-muted-foreground">
                    Zones
                  </Label>
                  <ZonePicker id="sn-zones" zones={zones} value={form.targetZones} onChange={(v) => set({ targetZones: v })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="sn-aud" className="text-xs text-muted-foreground">
                    Subscription
                  </Label>
                  <Select value={form.audience} onValueChange={(v) => set({ audience: v })}>
                    <SelectTrigger id="sn-aud" className="w-full">
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
              </div>
            )}

            {audienceMode === 'customers' && (
              <>
                <CustomerPicker customers={customers} failed={customersFailed} value={form.userIds} onChange={(ids) => set({ userIds: ids })} />
                {form.userIds.length >= 2 && (
                  <div className="flex gap-2">
                    <Input
                      aria-label="Group name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void saveGroup()}
                      placeholder="Save these customers as a group, e.g. VIPs"
                      className="h-8 text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={() => void saveGroup()} disabled={!groupName.trim() || savingGroup}>
                      {savingGroup ? <Loader2 className="animate-spin" /> : <Save />}
                      Save
                    </Button>
                  </div>
                )}
              </>
            )}

            {audienceMode === 'group' &&
              (groups && groups.length === 0 ? (
                <p className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
                  No groups yet. Choose customers, then save them as a group, or create one under Customer groups.
                </p>
              ) : (
                <>
                  <Select value={form.groupId} onValueChange={(v) => set({ groupId: v })} disabled={!groups}>
                    <SelectTrigger aria-label="Group" className="w-full">
                      <SelectValue placeholder={groups ? 'Choose a group' : 'Loading groups…'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(groups ?? []).map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.name} · {g.members.length}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {group && (
                    <p className="text-xs text-muted-foreground">
                      {group.members
                        .slice(0, 6)
                        .map((m) => m.name || m.phoneNumber)
                        .join(', ')}
                      {group.members.length > 6 ? ` and ${group.members.length - 6} more` : ''}
                    </p>
                  )}
                </>
              ))}
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
            {form.sendSms && <p className="text-xs text-amber-700">SMS goes to every chosen customer with a phone number and uses SMS credit.</p>}
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
