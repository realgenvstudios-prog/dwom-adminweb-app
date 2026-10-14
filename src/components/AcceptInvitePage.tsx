import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Check, Loader2, MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import adminAuthService from '../services/authService';
import AuthLayout from './auth/AuthLayout';
import PasswordInput from './auth/PasswordInput';

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const digits = form.phone.replace(/\D/g, '');
  const checks = [
    { ok: form.password.length >= 8, label: 'At least 8 characters' },
    { ok: !!form.password && form.password === form.confirm, label: 'Both passwords match' },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (digits.length < 9) return setError('Enter your phone number.');
    if (!checks.every((c) => c.ok)) return setError('Check your password meets both rules.');
    try {
      setLoading(true);
      setError(null);
      await adminAuthService.acceptInvite(token, form.password, form.phone.trim());
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t set up your account.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invite link incomplete" description="This page needs the full link from your invite email.">
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800">
          <MailWarning className="mt-0.5 size-4 shrink-0" />
          Open the link straight from the email (some email apps cut long links). If it still doesn’t work, ask a Super Admin to resend your invite.
        </div>
        <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
          Go to sign in
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set up your account" description="You’ve been invited to the DWOM admin dashboard. Add your phone number and choose a password.">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}
      <form className="grid gap-4" onSubmit={(e) => void submit(e)} noValidate>
        <div className="grid gap-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" type="tel" autoComplete="tel" autoFocus value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="024 400 0000" disabled={loading} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new-password">Password</Label>
          <PasswordInput id="new-password" autoComplete="new-password" value={form.password} onChange={(e) => set({ password: e.target.value })} disabled={loading} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <PasswordInput id="confirm-password" autoComplete="new-password" value={form.confirm} onChange={(e) => set({ confirm: e.target.value })} disabled={loading} />
        </div>
        <ul className="grid gap-1 text-xs">
          {checks.map((c) => (
            <li key={c.label} className={cn('flex items-center gap-1.5', c.ok ? 'text-emerald-700' : 'text-muted-foreground')}>
              <Check className={cn('size-3.5', !c.ok && 'opacity-30')} />
              {c.label}
            </li>
          ))}
        </ul>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? 'Setting up…' : 'Create account and sign in'}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">The link works once and expires 7 days after it was sent.</p>
    </AuthLayout>
  );
}
