import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Loader2, MapPinned, Percent, RotateCw, Store, Undo2, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { settingsService } from '../services/settingsService';
import { logger } from '../utils/logger';

// Only settings the backend actually uses live here; fees moved to
// Finance → Settings, next to the small-order fee. The old page also
// showed ~20 controls nothing reads (auto-assign, timezone, retry logic,
// notification toggles, Paystack/SMTP key boxes filled with fake values,
// 2FA / IP access), so changing them did nothing.
interface Form {
  isServiceClosed: boolean;
  serviceClosedMessage: string;
}

const toForm = (s: Record<string, unknown>): Form => ({
  isServiceClosed: !!s.isServiceClosed,
  serviceClosedMessage: String(s.serviceClosedMessage ?? ''),
});

export default function SettingsPage() {
  const [saved, setSaved] = useState<Form | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'status' | 'message' | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const f = toForm((await settingsService.getSettings()) as unknown as Record<string, unknown>);
      setSaved(f);
      setMessage(f.serviceClosedMessage);
    } catch (err) {
      logger.error('Failed to load settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const save = async (key: 'status' | 'message', patch: Record<string, unknown>, success: string) => {
    try {
      setBusy(key);
      await settingsService.updateSettings(patch);
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t save.');
    } finally {
      setBusy(null);
    }
  };

  const setOpen = (open: boolean) => {
    if (!open && !message.trim()) return toast.error('Write the message customers will see first.');
    void save('status', { isServiceClosed: !open, ...(open ? {} : { serviceClosedMessage: message.trim() }) }, open ? 'Open — customers can order again' : 'Closed — new orders are paused');
  };

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load settings: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const closed = saved?.isServiceClosed ?? false;
  const messageChanged = !!saved && message !== saved.serviceClosedMessage;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Store-wide controls. Changes apply to new orders immediately.</p>
      </div>

      {!saved ? (
        <Skeleton className="h-64 max-w-2xl rounded-xl" />
      ) : (
        <div className="grid max-w-2xl gap-6">
          <Card className={cn(closed && 'border-red-500/40')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="size-4" />
                Store status
                <Badge variant="outline" className={closed ? 'border-red-500/20 bg-red-500/10 text-red-700' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700'}>
                  {closed ? 'Closed' : 'Open'}
                </Badge>
              </CardTitle>
              <CardDescription>While closed, the app refuses new orders and shows customers your message. Orders already placed aren’t affected.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div>
                  <Label htmlFor="st-open" className="text-sm">
                    Accepting orders
                  </Label>
                  <p className="text-xs text-muted-foreground">{closed ? 'Turn on to reopen.' : 'Turn off to pause new orders (e.g. overnight).'}</p>
                </div>
                {busy === 'status' ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <Switch id="st-open" checked={!closed} onCheckedChange={(on) => (on ? setOpen(true) : setConfirmClose(true))} />
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="st-msg">Message customers see while closed</Label>
                <Textarea id="st-msg" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. We’re closed for the night. See you at 7am!" />
                {messageChanged && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={busy === 'message' || !message.trim()} onClick={() => void save('message', { serviceClosedMessage: message.trim() }, 'Message saved')}>
                      {busy === 'message' && <Loader2 className="animate-spin" />}
                      Save message
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setMessage(saved.serviceClosedMessage)}>
                      <Undo2 />
                      Undo
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Elsewhere</CardTitle>
          <CardDescription>Settings that live next to what they affect.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3">
          {[
            { to: '/finance?tab=settings', icon: Percent, title: 'Fees & costs', desc: 'Service, delivery and small-order fees; cost assumptions; picker pay' },
            { to: '/field-operations?tab=zones', icon: MapPinned, title: 'Delivery zones & fees', desc: 'Where you deliver and what each area costs' },
            { to: '/admins', icon: Users, title: 'Admins & roles', desc: 'Who can sign in and what they can see' },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
              <l.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{l.title}</p>
                <p className="text-xs text-muted-foreground">{l.desc}</p>
              </div>
              <ArrowRight className="mt-0.5 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause new orders?</AlertDialogTitle>
            <AlertDialogDescription>
              Customers can’t check out until you reopen. They’ll see: “{message.trim() || '…'}”
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep open</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => setOpen(false)}>
              Close the store
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
