import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import adminsService from '../../services/adminsService';

// Your own password — available to every admin from the account menu
// (it used to live on the Super-Admin-only Admins page, so other admins
// had no way to change it). The old "Enable 2FA" / "IP access control"
// switches were removed: saved to settings but enforced nowhere.
export default function PasswordSection() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.current) return setProblem('Enter your current password.');
    if (form.next.length < 8) return setProblem('The new password needs at least 8 characters.');
    if (form.next !== form.confirm) return setProblem('The two new passwords don’t match.');
    setProblem(null);
    try {
      setSaving(true);
      await adminsService.changeOwnPassword(form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Couldn’t change the password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="grid gap-3">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Password</p>
          <p className="text-xs text-muted-foreground">For the account you’re signed in with.</p>
        </div>
      </div>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="pw-cur">Current password</Label>
          <Input id="pw-cur" type="password" autoComplete="current-password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="pw-new">New password</Label>
          <Input
            id="pw-new"
            type="password"
            autoComplete="new-password"
            value={form.next}
            onChange={(e) => setForm({ ...form, next: e.target.value })}
            placeholder="At least 8 characters"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="pw-conf">Confirm new password</Label>
          <Input id="pw-conf" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </div>
        {problem && <p className="text-sm text-destructive">{problem}</p>}
        <div>
          <Button type="submit" size="sm" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Change password
          </Button>
        </div>
      </form>
    </section>
  );
}
