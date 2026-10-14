import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import adminAuthService from '../services/authService';
import AuthLayout from './auth/AuthLayout';
import PasswordInput from './auth/PasswordInput';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set by the API client when a request comes back 401 mid-session.
  const [expired] = useState(() => !!sessionStorage.getItem('session_expired'));

  useEffect(() => {
    sessionStorage.removeItem('session_expired');
  }, []);

  if (adminAuthService.isAuthenticated() && adminAuthService.getCurrentAdmin()) return <Navigate to="/dashboard" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Enter your email and password.');
    try {
      setLoading(true);
      setError(null);
      await adminAuthService.login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t sign in.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign in" description="Use the email and password for your DWOM admin account.">
      {expired && !error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-800">
          <Clock className="mt-0.5 size-4 shrink-0" />
          Your session ended. Sign in again to continue.
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}
      <form className="grid gap-4" onSubmit={(e) => void submit(e)} noValidate>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@dwom.org" disabled={loading} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        New here? Use the invite link from your email to set up your account. Forgot your password? Ask a Super Admin to send you a reset link.
      </p>
    </AuthLayout>
  );
}
