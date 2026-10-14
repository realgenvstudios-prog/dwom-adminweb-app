import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import expensesService, { EXPENSE_CATEGORIES, type Expense } from '../../services/expensesService';
import { logger } from '../../utils/logger';
import ImageUpload from '../common/ImageUpload';
import { EXPENSE_METHODS } from './expense-meta';

interface ExpenseDialogProps {
  /** null = new. Mount with a fresh `key` per open. */
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const NONE = 'none';
const todayKey = () => new Date().toISOString().slice(0, 10);

export default function ExpenseDialog({ expense, open, onOpenChange, onSaved }: ExpenseDialogProps) {
  const [form, setForm] = useState({
    date: expense ? expense.date.slice(0, 10) : todayKey(),
    category: expense?.category ?? EXPENSE_CATEGORIES[0],
    amount: expense ? String(Number(expense.amount)) : '',
    isCapex: expense?.isCapex ?? false,
    recurring: expense?.recurring ?? false,
    paidBy: expense?.paidBy ?? '',
    paymentMethod: expense?.paymentMethod ?? NONE,
    receiptUrl: expense?.receiptUrl ?? '',
    notes: expense?.notes ?? '',
  });
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  // Keep any legacy category / method an old entry used selectable.
  const categories = EXPENSE_CATEGORIES.includes(form.category) ? EXPENSE_CATEGORIES : [form.category, ...EXPENSE_CATEGORIES];
  const methods = form.paymentMethod === NONE || EXPENSE_METHODS.some((m) => m.value === form.paymentMethod)
    ? EXPENSE_METHODS
    : [{ value: form.paymentMethod, label: form.paymentMethod }, ...EXPENSE_METHODS];

  const save = async () => {
    const amount = Number.parseFloat(form.amount);
    if (!(amount > 0)) return setProblem('Enter an amount above 0.');
    if (!form.date) return setProblem('Pick a date.');
    setProblem(null);
    const payload = {
      date: form.date,
      category: form.category,
      amount,
      isCapex: form.isCapex,
      recurring: form.recurring,
      paidBy: form.paidBy.trim(),
      paymentMethod: form.paymentMethod === NONE ? '' : form.paymentMethod,
      receiptUrl: form.receiptUrl.trim(),
      notes: form.notes.trim(),
    };
    try {
      setSaving(true);
      if (expense) {
        // Empty strings so clearing a field on edit sticks.
        await expensesService.update(expense.id, payload);
        toast.success('Expense updated');
      } else {
        await expensesService.create({
          ...payload,
          paidBy: payload.paidBy || undefined,
          paymentMethod: payload.paymentMethod || undefined,
          receiptUrl: payload.receiptUrl || undefined,
          notes: payload.notes || undefined,
        });
        toast.success('Expense recorded');
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save expense:', err);
      setProblem(err instanceof Error ? err.message : 'Couldn’t save the expense.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit expense' : 'Record an expense'}</DialogTitle>
          <DialogDescription>Operating costs feed the P&L. Capital spending (equipment, assets) is kept out of it.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ex-amount">Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">₵</span>
                <Input id="ex-amount" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => set({ amount: e.target.value })} className="pl-7 tabular-nums" autoFocus />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ex-date">Date</Label>
              <Input id="ex-date" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ex-cat">Category</Label>
              <Select value={form.category} onValueChange={(v) => set({ category: v })}>
                <SelectTrigger id="ex-cat" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg border p-1">
            {[
              { capex: false, title: 'Operating cost', hint: 'Rent, fees, supplies. Counts in the P&L' },
              { capex: true, title: 'Capital spend', hint: 'Equipment, assets. Kept out of the P&L' },
            ].map((o) => (
              <button
                key={String(o.capex)}
                type="button"
                onClick={() => set({ isCapex: o.capex })}
                aria-pressed={form.isCapex === o.capex}
                className={cn('rounded-md px-3 py-2 text-left transition-colors', form.isCapex === o.capex ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              >
                <p className="text-sm font-medium">{o.title}</p>
                <p className={cn('text-xs', form.isCapex === o.capex ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{o.hint}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="ex-by">Paid by</Label>
              <Input id="ex-by" value={form.paidBy} onChange={(e) => set({ paidBy: e.target.value })} placeholder="Optional" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ex-method">Payment method</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => set({ paymentMethod: v })}>
                <SelectTrigger id="ex-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not specified</SelectItem>
                  {methods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.recurring} onCheckedChange={(v) => set({ recurring: v })} />
            Recurring (e.g. monthly rent)
          </label>

          <div className="grid gap-1.5">
            <Label htmlFor="ex-notes">Notes</Label>
            <Textarea id="ex-notes" rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Optional" />
          </div>

          <ImageUpload label="Receipt (optional)" value={form.receiptUrl} onChange={(url) => set({ receiptUrl: url })} />
        </div>

        <DialogFooter className="items-center">
          {problem && <p className="mr-auto text-sm text-destructive">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {expense ? 'Save changes' : 'Record expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
