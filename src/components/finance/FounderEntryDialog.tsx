import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import founderLedgerService, { type FounderLedgerEntry } from '../../services/founderLedgerService';
import { logger } from '../../utils/logger';
import ImageUpload from '../common/ImageUpload';
import { FOUNDER_METHODS } from './expense-meta';

const NONE = 'none';

interface FounderEntryDialogProps {
  /** null = new. Mount with a fresh `key` per open. */
  entry: FounderLedgerEntry | null;
  founders: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// Balances group by the exact founder name, so a typo or stray space would
// split one founder in two — names are picked from existing ones where possible.
function FounderPicker({ value, onChange, founders }: { value: string; onChange: (v: string) => void; founders: string[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const typed = query.trim();
  const isNew = typed && !founders.some((f) => f.toLowerCase() === typed.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id="fl-founder" variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          <span className={cn('truncate', !value && 'text-muted-foreground')}>{value || 'Choose a founder'}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search or type a new name…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Type a name to add a founder.</CommandEmpty>
            {founders.length > 0 && (
              <CommandGroup heading="Founders">
                {founders.map((f) => (
                  <CommandItem
                    key={f}
                    value={f}
                    onSelect={() => {
                      onChange(f);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <Check className={cn(value === f ? 'opacity-100' : 'opacity-0')} />
                    {f}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {isNew && (
              <CommandGroup>
                <CommandItem
                  value={`__new__${typed}`}
                  onSelect={() => {
                    onChange(typed);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <Plus />
                  Add “{typed}”
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function FounderEntryDialog({ entry, founders, open, onOpenChange, onSaved }: FounderEntryDialogProps) {
  const [form, setForm] = useState({
    date: entry ? entry.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    type: entry?.type ?? ('contribution' as 'contribution' | 'reimbursement'),
    founderName: entry?.founderName ?? (founders.length === 1 ? founders[0] : ''),
    amount: entry ? String(Number(entry.amount)) : '',
    method: entry?.method ?? NONE,
    approvedBy: entry?.approvedBy ?? '',
    notes: entry?.notes ?? '',
    receiptUrl: entry?.receiptUrl ?? '',
  });
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const methods = form.method === NONE || FOUNDER_METHODS.some((m) => m.value === form.method) ? FOUNDER_METHODS : [{ value: form.method, label: form.method }, ...FOUNDER_METHODS];

  const save = async () => {
    const amount = Number.parseFloat(form.amount);
    if (!form.founderName.trim()) return setProblem('Choose a founder.');
    if (!(amount > 0)) return setProblem('Enter an amount above 0.');
    setProblem(null);
    const payload = {
      date: form.date,
      type: form.type,
      founderName: form.founderName.trim(),
      amount,
      method: form.method === NONE ? '' : form.method,
      approvedBy: form.approvedBy.trim(),
      notes: form.notes.trim(),
      receiptUrl: form.receiptUrl.trim(),
    };
    try {
      setSaving(true);
      if (entry) {
        await founderLedgerService.update(entry.id, payload);
        toast.success('Entry updated');
      } else {
        await founderLedgerService.create({
          ...payload,
          method: payload.method || undefined,
          approvedBy: payload.approvedBy || undefined,
          notes: payload.notes || undefined,
          receiptUrl: payload.receiptUrl || undefined,
        });
        toast.success(form.type === 'contribution' ? 'Contribution recorded' : 'Reimbursement recorded');
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save founder ledger entry:', err);
      setProblem(err instanceof Error ? err.message : 'Couldn’t save the entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit entry' : 'Record founder money'}</DialogTitle>
          <DialogDescription>Kept completely separate from revenue, expenses, and the P&L.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg border p-1">
            {[
              { value: 'contribution' as const, title: 'Money in', hint: 'Founder put money into DWOM', icon: ArrowDownLeft },
              { value: 'reimbursement' as const, title: 'Money out', hint: 'DWOM paid a founder back', icon: ArrowUpRight },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => set({ type: o.value })}
                aria-pressed={form.type === o.value}
                className={cn('rounded-md px-3 py-2 text-left transition-colors', form.type === o.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}
              >
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <o.icon className="size-4" />
                  {o.title}
                </p>
                <p className={cn('text-xs', form.type === o.value ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{o.hint}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="fl-founder">Founder</Label>
              <FounderPicker value={form.founderName} onChange={(v) => set({ founderName: v })} founders={founders} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fl-amount">Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">₵</span>
                <Input id="fl-amount" type="number" min={0} step="0.01" value={form.amount} onChange={(e) => set({ amount: e.target.value })} className="pl-7 tabular-nums" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fl-date">Date</Label>
              <Input id="fl-date" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fl-method">Method</Label>
              <Select value={form.method} onValueChange={(v) => set({ method: v })}>
                <SelectTrigger id="fl-method" className="w-full">
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

          <div className="grid gap-1.5">
            <Label htmlFor="fl-approved">Approved by</Label>
            <Input id="fl-approved" value={form.approvedBy} onChange={(e) => set({ approvedBy: e.target.value })} placeholder="Optional" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fl-notes">Notes</Label>
            <Textarea id="fl-notes" rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Optional" />
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
            {entry ? 'Save changes' : 'Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
