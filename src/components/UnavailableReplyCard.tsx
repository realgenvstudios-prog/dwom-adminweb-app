import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { settingsService } from '../services/settingsService';
import { logger } from '../utils/logger';

export default function UnavailableReplyCard() {
  const [minutes, setMinutes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService
      .getSettings()
      .then((s) => setMinutes(String(s.unavailableReplyMinutes ?? 10)))
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
      <CardContent className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="reply-minutes">Minutes to reply</Label>
          <Input id="reply-minutes" type="number" min={1} max={120} value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-32 tabular-nums" />
        </div>
        <Button size="sm" disabled={saving || !valid} onClick={() => void save()}>
          {saving && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
