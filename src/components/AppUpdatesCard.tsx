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

const FIELDS = [
  { key: 'appMinVersionIos', label: 'iPhone minimum' },
  { key: 'appMinVersionAndroid', label: 'Android minimum' },
  { key: 'appLatestVersionIos', label: 'iPhone latest' },
  { key: 'appLatestVersionAndroid', label: 'Android latest' },
] as const;
type Key = (typeof FIELDS)[number]['key'];
const VERSION = /^\d+(\.\d+){0,2}$/;

// Force customers onto a new version of the app. Only raise a minimum once
// that version is live in the store, or they'd have nothing to update to.
export default function AppUpdatesCard() {
  const [form, setForm] = useState<Record<Key, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [block, setBlock] = useState(false);

  useEffect(() => {
    settingsService
      .getSettings()
      .then((s) => {
        setForm({ appMinVersionIos: s.appMinVersionIos ?? '', appMinVersionAndroid: s.appMinVersionAndroid ?? '', appLatestVersionIos: s.appLatestVersionIos ?? '', appLatestVersionAndroid: s.appLatestVersionAndroid ?? '' });
        setBlock(!!s.blockOldAppOrders);
      })
      .catch((err) => logger.error('Failed to load app versions:', err));
  }, []);

  const save = async (patch: Record<string, unknown>, success: string) => {
    setSaving(true);
    try {
      await settingsService.updateSettings(patch);
      toast.success(success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t save.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  if (!form) return null;
  const invalid = FIELDS.some((f) => form[f.key] && !VERSION.test(form[f.key].trim()));

  return (
    <Card>
      <CardHeader>
        <CardTitle>App updates</CardTitle>
        <CardDescription>Below the minimum, the app shows a full-screen update message. Below the latest, customers get a prompt they can skip. Only raise a version once it’s live in that store.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FIELDS.map((f) => (
            <div key={f.key} className="grid gap-1.5">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Input id={f.key} value={form[f.key]} placeholder="e.g. 1.5.0" onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="tabular-nums" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{invalid ? 'Use a version like 1.5.0.' : 'Leave a box empty to turn that check off.'}</p>
          <Button size="sm" disabled={saving || invalid} onClick={() => void save(form, 'App versions saved').catch(() => undefined)}>
            {saving && <Loader2 className="animate-spin" />}
            Save versions
          </Button>
        </div>
        <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
          <div className="grid gap-0.5">
            <Label htmlFor="block-old">Stop out-of-date apps from ordering</Label>
            <p className="text-xs text-muted-foreground">For phones on versions without the update screen. They can still browse, but checkout asks them to update. This includes every version released before the update screen.</p>
          </div>
          <Switch
            id="block-old"
            checked={block}
            disabled={saving}
            onCheckedChange={(on) => {
              setBlock(on);
              void save({ blockOldAppOrders: on }, on ? 'Out-of-date apps can’t order now' : 'All app versions can order').catch(() => setBlock(!on));
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
