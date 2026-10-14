import { useEffect, useState } from 'react';
import { Bell, Loader2, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import marketingService, { type NotificationTemplate } from '../../services/marketingService';
import ridersService, { type Zone } from '../../services/ridersService';
import { logger } from '../../utils/logger';
import { AUDIENCES } from './campaign-meta';
import ZonePicker from './ZonePicker';

interface SendNotificationDialogProps {
  templates: NotificationTemplate[];
  /** Preselects a template. Mount with a fresh `key` per open. */
  templateId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: () => void;
}

const CHANNEL_OPTIONS = [
  { key: 'sendPush', label: 'Push + app inbox', icon: Bell },
  { key: 'sendSms', label: 'SMS', icon: MessageSquare },
  { key: 'sendEmail', label: 'Email', icon: Mail },
] as const;

export default function SendNotificationDialog({ templates, templateId, open, onOpenChange, onSent }: SendNotificationDialogProps) {
  const [form, setForm] = useState({
    templateId: String(templateId ?? templates[0]?.id ?? ''),
    targetZones: [] as number[],
    audience: 'all',
    sendPush: true,
    sendSms: false,
    sendEmail: false,
  });
  const [zones, setZones] = useState<Zone[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const template = templates.find((t) => String(t.id) === form.templateId);

  useEffect(() => {
    ridersService
      .getAllZones()
      .then(setZones)
      .catch((err) => logger.error('Failed to load zones:', err));
  }, []);

  const send = async () => {
    setProblem(null);
    try {
      if (!template) return setProblem('Choose a template.');
      if (!form.sendPush && !form.sendSms && !form.sendEmail) return setProblem('Pick at least one channel.');
      setSending(true);
      const r = await marketingService.sendNotification({
        templateId: template.id,
        sendNow: true,
        targetZones: form.targetZones.length ? form.targetZones : undefined,
        targetSubscriptionStatus: form.audience,
        sendPush: form.sendPush,
        sendSms: form.sendSms,
        sendEmail: form.sendEmail,
      });
      if (r.status === 'failed') throw new Error('Delivery failed. Check the history for details.');
      toast.success(`Sent to ${r.totalRecipients.toLocaleString()} customers`, {
        description: r.failureCount ? `${r.failureCount.toLocaleString()} deliveries failed (no app, phone or email).` : undefined,
      });
      onSent();
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

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="sn-tpl">Template</Label>
            <Select value={form.templateId} onValueChange={(v) => set({ templateId: v })}>
              <SelectTrigger id="sn-tpl" className="w-full">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="sn-zones">Zones</Label>
              <ZonePicker id="sn-zones" zones={zones} value={form.targetZones} onChange={(v) => set({ targetZones: v })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sn-aud">Who</Label>
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

          <div className="grid gap-1.5">
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
            {form.sendSms && <p className="text-xs text-amber-700">SMS is sent to every matching customer with a phone number and uses SMS credit.</p>}
          </div>
        </div>

        <DialogFooter className="items-center">
          {problem && <p className="mr-auto text-sm text-destructive">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={() => void send()} disabled={sending}>
            {sending && <Loader2 className="animate-spin" />}
            Send now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
