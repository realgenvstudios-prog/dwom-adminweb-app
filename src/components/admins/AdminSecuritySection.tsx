import { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import adminsService from '../../services/adminsService';

// Your own password. The old "Enable 2FA" / "IP access control" switches
// were removed: they were saved to settings but enforced nowhere, so they
// looked like protection without being any.
export default function AdminSecuritySection() {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" />
          Your password
        </CardTitle>
        <CardDescription>Changes the password for the account you’re signed in with.</CardDescription>
      </CardHeader>
      <CardContent>
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
            <Input id="pw-new" type="password" autoComplete="new-password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} placeholder="At least 8 characters" />
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
      </CardContent>
    </Card>
  );
}
