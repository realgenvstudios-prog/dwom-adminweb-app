import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Check, CheckCircle2, Loader2, MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import adminAuthService from '../services/authService';
import AuthLayout from './auth/AuthLayout';
import PasswordInput from './auth/PasswordInput';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneFor, setDoneFor] = useState<string | null>(null);

  const checks = [
    { ok: form.password.length >= 8, label: 'At least 8 characters' },
    { ok: !!form.password && form.password === form.confirm, label: 'Both passwords match' },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checks.every((c) => c.ok)) return setError('Check your password meets both rules.');
    try {
      setLoading(true);
      setError(null);
      const r = await adminAuthService.resetPassword(token, form.password);
      setDoneFor(r.email || 'your account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t reset the password.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Reset link incomplete" description="This page needs the full link from your email.">
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800">
          <MailWarning className="mt-0.5 size-4 shrink-0" />
          Open the link straight from the email. If it still doesn’t work, ask a Super Admin to send a new one.
        </div>
        <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
          Go to sign in
        </Button>
      </AuthLayout>
    );
  }

  if (doneFor) {
    return (
      <AuthLayout title="Password changed" description={`You can now sign in to ${doneFor} with your new password.`}>
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          Your old password no longer works.
        </div>
        <Button className="w-full" onClick={() => navigate('/login', { replace: true })}>
          Sign in
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" description="A Super Admin sent you this link. It works once and expires 24 hours after it was sent.">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}
      <form className="grid gap-4" onSubmit={(e) => void submit(e)} noValidate>
        <div className="grid gap-1.5">
          <Label htmlFor="rp-new">New password</Label>
          <PasswordInput id="rp-new" autoComplete="new-password" autoFocus value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} disabled={loading} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rp-confirm">Confirm new password</Label>
          <PasswordInput id="rp-confirm" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} disabled={loading} />
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
          {loading ? 'Saving…' : 'Set new password'}
        </Button>
      </form>
    </AuthLayout>
  );
}
