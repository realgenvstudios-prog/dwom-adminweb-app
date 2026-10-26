import { useCallback, useEffect, useState } from 'react';
import { Banknote, CircleDollarSign, Clock, Loader2, MoreHorizontal, Settings2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/stat-card';
import adminApiClient from '../../../services/apiClient';
import { can } from '../../../config/permissions';
import { formatGhs } from '../../orders/order-status';
import PaySettingsDialog from './PaySettingsDialog';

interface Balance {
  id: number;
  name: string;
  phone: string;
  payoutAccount: string | null;
  payoutAccountName: string | null;
  balance: number;
  cashHeld: number;
  week: { amount: number; orders: number };
  lastPayout: { amount: number; paidAt: string; kind: string } | null;
}

interface Payout {
  id: number;
  riderId: number;
  rider: string;
  kind: 'weekly' | 'cashout' | 'manual';
  amount: number;
  fee: number;
  status: 'requested' | 'approved' | 'processing' | 'paid' | 'failed' | 'rejected';
  account: string | null;
  accountName: string | null;
  failureReason: string | null;
  requestedAt: string;
  paidAt: string | null;
}

const STATUS: Record<Payout['status'], { label: string; className: string }> = {
  requested: { label: 'Needs approval', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700' },
  approved: { label: 'To pay', className: 'border-sky-500/30 bg-sky-500/10 text-sky-700' },
  processing: { label: 'Sending', className: 'border-violet-500/30 bg-violet-500/10 text-violet-700' },
  paid: { label: 'Paid', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' },
  failed: { label: 'Failed', className: 'border-red-500/30 bg-red-500/10 text-red-700' },
  rejected: { label: 'Rejected', className: 'border-border bg-muted text-muted-foreground' },
};

type Adjust = { rider: Balance; type: 'bonus' | 'deduction' | 'cash_handed_in' };

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** What each rider is owed, the cash they hold, and payouts to approve or send. */
export default function RiderPayTab() {
  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [payouts, setPayouts] = useState<Payout[] | null>(null);
  const [viaPaystack, setViaPaystack] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adjust, setAdjust] = useState<Adjust | null>(null);
  const [rejecting, setRejecting] = useState<Payout | null>(null);
  const manage = can('riderPay.manage');

  const load = useCallback(async () => {
    try {
      const [b, p, s] = await Promise.all([
        adminApiClient.get<Balance[]>('/rider-pay/balances'),
        adminApiClient.get<Payout[]>('/rider-pay/payouts?status=all'),
        adminApiClient.get<{ payoutsViaPaystack: boolean }>('/rider-pay/settings'),
      ]);
      setBalances(b);
      setPayouts(p);
      setViaPaystack(s.payoutsViaPaystack);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t load rider pay');
      setBalances((x) => x ?? []);
      setPayouts((x) => x ?? []);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const act = async (p: Payout, path: string, done: string) => {
    setBusy(p.id);
    try {
      const res = await adminApiClient.post<Payout>(`/rider-pay/payouts/${p.id}/${path}`);
      toast[res.status === 'failed' ? 'error' : 'success'](res.status === 'failed' ? `Paystack: ${res.failureReason ?? 'transfer failed'}` : done);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'That didn’t work');
    } finally {
      setBusy(null);
    }
  };

  const open = payouts?.filter((p) => ['requested', 'approved', 'processing', 'failed'].includes(p.status)) ?? [];
  const history = payouts?.filter((p) => ['paid', 'rejected'].includes(p.status)).slice(0, 30) ?? [];
  const owed = balances?.reduce((s, b) => s + Math.max(0, b.balance), 0) ?? 0;
  const cash = balances?.reduce((s, b) => s + b.cashHeld, 0) ?? 0;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const paidWeek = payouts?.filter((p) => p.status === 'paid' && p.paidAt && new Date(p.paidAt) >= weekStart).reduce((s, p) => s + p.amount, 0) ?? 0;
  const loading = !balances;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Owed to riders" value={formatGhs(owed)} hint="Earned and not paid yet" icon={Wallet} tint="bg-sky-500/10 text-sky-600" loading={loading} />
        <StatCard label="Cash with riders" value={formatGhs(cash)} hint="Collected on cash orders, not handed in" icon={Banknote} tint="bg-amber-500/10 text-amber-600" loading={loading} />
        <StatCard label="Payouts waiting" value={String(open.length)} hint="To approve, send or retry" icon={Clock} tint="bg-violet-500/10 text-violet-600" loading={loading} />
        <StatCard label="Paid this week" value={formatGhs(paidWeek)} hint="Since Monday" icon={CircleDollarSign} tint="bg-emerald-500/10 text-emerald-600" loading={loading} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Payouts waiting</h3>
        {manage && (
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings2 />
            Pay settings
          </Button>
        )}
      </div>
      <Card className="gap-0 py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {open.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {loading ? 'Loading…' : 'Nothing waiting. Weekly payouts and cash-out requests show up here.'}
                  </TableCell>
                </TableRow>
              )}
              {open.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.rider}</p>
                    <p className="text-xs text-muted-foreground">{when(p.requestedAt)}</p>
                  </TableCell>
                  <TableCell>{p.kind === 'weekly' ? 'Weekly' : 'Cash out'}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <p className="font-medium">{formatGhs(p.amount)}</p>
                    {p.fee > 0 && <p className="text-xs text-muted-foreground">+ {formatGhs(p.fee)} fee</p>}
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>{p.account ?? 'No account'}</p>
                    {p.accountName && <p className="text-xs text-muted-foreground">{p.accountName}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS[p.status].className}>
                      {STATUS[p.status].label}
                    </Badge>
                    {p.failureReason && <p className="mt-1 max-w-[220px] text-xs text-red-700">{p.failureReason}</p>}
                  </TableCell>
                  <TableCell className="text-right">
                    {manage && (
                      <div className="flex justify-end gap-2">
                        {busy === p.id && <Loader2 className="size-4 animate-spin self-center text-muted-foreground" />}
                        {p.status === 'requested' && (
                          <Button size="sm" onClick={() => void act(p, 'approve', viaPaystack ? 'Approved and sent with Paystack' : 'Approved')} disabled={busy !== null}>
                            Approve
                          </Button>
                        )}
                        {viaPaystack && ['approved', 'failed'].includes(p.status) && (
                          <Button size="sm" onClick={() => void act(p, 'send', 'Sent with Paystack')} disabled={busy !== null}>
                            {p.status === 'failed' ? 'Retry' : 'Send'}
                          </Button>
                        )}
                        {['requested', 'approved', 'failed'].includes(p.status) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" aria-label="More">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => void act(p, 'paid', 'Marked as paid')}>I sent it myself: mark paid</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setRejecting(p)}>
                                Reject and return to balance
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <h3 className="text-sm font-medium">Rider balances</h3>
      <Card className="gap-0 py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rider</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Cash held</TableHead>
                <TableHead className="text-right">This week</TableHead>
                <TableHead>Last payout</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No approved riders yet.
                  </TableCell>
                </TableRow>
              )}
              {balances?.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <p className="font-medium">{b.name || 'Rider'}</p>
                    <p className="text-xs text-muted-foreground">{b.payoutAccount ?? 'No payout account'}</p>
                  </TableCell>
                  <TableCell className={`text-right font-medium tabular-nums ${b.balance < 0 ? 'text-red-700' : ''}`}>
                    {formatGhs(b.balance)}
                    {b.balance < 0 && <p className="text-xs font-normal">owes DWOM</p>}
                  </TableCell>
                  <TableCell className={`text-right tabular-nums ${b.cashHeld > 0 ? 'text-amber-700' : 'text-muted-foreground'}`}>{formatGhs(b.cashHeld)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatGhs(b.week.amount)}
                    <p className="text-xs text-muted-foreground">{b.week.orders} deliveries</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.lastPayout ? `${formatGhs(b.lastPayout.amount)} · ${when(b.lastPayout.paidAt)}` : 'None yet'}</TableCell>
                  <TableCell className="text-right">
                    {manage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" aria-label={`Actions for ${b.name}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setAdjust({ rider: b, type: 'cash_handed_in' })}>Cash handed in</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAdjust({ rider: b, type: 'bonus' })}>Add bonus</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAdjust({ rider: b, type: 'deduction' })}>Add deduction</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {history.length > 0 && (
        <>
          <h3 className="text-sm font-medium">Recent payouts</h3>
          <Card className="gap-0 py-0">
            <ul className="divide-y text-sm">
              {history.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <span>
                    {p.rider} · {p.kind === 'weekly' ? 'Weekly' : 'Cash out'}
                    <span className="text-muted-foreground"> · {when(p.paidAt ?? p.requestedAt)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">{formatGhs(p.amount)}</span>
                    <Badge variant="outline" className={STATUS[p.status].className}>
                      {STATUS[p.status].label}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {settingsOpen && <PaySettingsDialog onClose={() => setSettingsOpen(false)} onSaved={() => void load()} />}
      {adjust && <AdjustDialog adjust={adjust} onClose={() => setAdjust(null)} onSaved={() => void load()} />}
      {rejecting && <RejectDialog payout={rejecting} onClose={() => setRejecting(null)} onSaved={() => void load()} />}
    </div>
  );
}

const ADJUST_TEXT: Record<Adjust['type'], { title: string; hint: string; button: string }> = {
  bonus: { title: 'Add a bonus', hint: 'Added to what DWOM owes the rider. They see the reason.', button: 'Add bonus' },
  deduction: { title: 'Add a deduction', hint: 'Taken from what DWOM owes the rider. They see the reason.', button: 'Add deduction' },
  cash_handed_in: { title: 'Cash handed in', hint: 'Cash the rider gave back from cash orders.', button: 'Record' },
};

function AdjustDialog({ adjust, onClose, onSaved }: { adjust: Adjust; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(adjust.type === 'cash_handed_in' && adjust.rider.cashHeld ? String(adjust.rider.cashHeld) : '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const text = ADJUST_TEXT[adjust.type];

  const save = async () => {
    setSaving(true);
    try {
      await adminApiClient.post(`/rider-pay/riders/${adjust.rider.id}/adjust`, { type: adjust.type, amount: Number(amount), note: note.trim() || undefined });
      toast.success('Saved');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {text.title}: {adjust.rider.name}
          </DialogTitle>
          <DialogDescription>{text.hint}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="adj-amount">Amount (GH₵)</Label>
            <Input id="adj-amount" type="number" min={0} step={0.5} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="adj-note">{adjust.type === 'cash_handed_in' ? 'Note (optional)' : 'Reason'}</Label>
            <Input id="adj-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={adjust.type === 'bonus' ? 'e.g. Rainy day bonus' : adjust.type === 'deduction' ? 'e.g. Damaged eggs on order #120' : ''} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving || !Number(amount)}>
            {saving && <Loader2 className="animate-spin" />}
            {text.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ payout, onClose, onSaved }: { payout: Payout; onClose: () => void; onSaved: () => void }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await adminApiClient.post(`/rider-pay/payouts/${payout.id}/reject`, { reason: reason.trim() });
      toast.success('Rejected. The amount is back on the rider’s balance.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t reject');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject {formatGhs(payout.amount)} to {payout.rider}?</DialogTitle>
          <DialogDescription>The money goes back on their balance. They see your reason.</DialogDescription>
        </DialogHeader>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. MoMo name doesn’t match the Ghana Card" autoFocus />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Keep it
          </Button>
          <Button variant="destructive" onClick={() => void save()} disabled={saving || !reason.trim()}>
            {saving && <Loader2 className="animate-spin" />}
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
