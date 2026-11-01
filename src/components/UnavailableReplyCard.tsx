import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { settingsService } from '../services/settingsService';
import { logger } from '../utils/logger';

export default function UnavailableReplyCard() {
  const [minutes, setMinutes] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoRefunds, setAutoRefunds] = useState(false);
  const [nudge, setNudge] = useState(true);

  useEffect(() => {
    settingsService
      .getSettings()
      .then((s) => {
        setMinutes(String(s.unavailableReplyMinutes ?? 10));
        setAutoRefunds(s.autoRefunds ?? false);
        setNudge(s.forgotAnythingNudge ?? true);
      })
      .catch((err) => logger.error('Failed to load reply time:', err));
  }, []);

  const value = Number(minutes);
  const valid = Number.isInteger(value) && value >= 1 && value <= 120;

  const save = async () => {
    setSaving(true);
    try {
      await settingsService.updateSettings({ unavailableReplyMinutes: value });
      toast.success('Reply time saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unavailable items</CardTitle>
        <CardDescription>How long a customer has to choose a replacement. After that, the item is removed from their order.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="reply-minutes">Minutes to reply</Label>
          <Input id="reply-minutes" type="number" min={1} max={120} value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-32 tabular-nums" />
        </div>
        <Button size="sm" disabled={saving || !valid} onClick={() => void save()}>
          {saving && <Loader2 className="animate-spin" />}
          Save
        </Button>
        </div>
        <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
          <div className="grid gap-0.5">
            <Label htmlFor="auto-refunds">Send refunds automatically</Label>
            <p className="text-xs text-muted-foreground">When an order change or cancellation leaves money owed, it goes back through Paystack within about a minute. If Paystack refuses, you get an alert to retry from the order.</p>
          </div>
          <Switch
            id="auto-refunds"
            checked={autoRefunds}
            onCheckedChange={(on) => {
              setAutoRefunds(on);
              settingsService
                .updateSettings({ autoRefunds: on })
                .then(() => toast.success(on ? 'Refunds send automatically' : 'Refunds wait for an admin'))
                .catch((err) => {
                  setAutoRefunds(!on);
                  toast.error(err instanceof Error ? err.message : 'Couldn’t save.');
                });
            }}
          />
        </div>
        <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
          <div className="grid gap-0.5">
            <Label htmlFor="forgot-nudge">“Forgot anything?” when sorting starts</Label>
            <p className="text-xs text-muted-foreground">Replaces the sorting notification with a prompt to add items.</p>
          </div>
          <Switch
            id="forgot-nudge"
            checked={nudge}
            onCheckedChange={(on) => {
              setNudge(on);
              settingsService
                .updateSettings({ forgotAnythingNudge: on })
                .then(() => toast.success(on ? 'Nudge is on' : 'Nudge is off'))
                .catch((err) => {
                  setNudge(!on);
                  toast.error(err instanceof Error ? err.message : 'Couldn’t save.');
                });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
