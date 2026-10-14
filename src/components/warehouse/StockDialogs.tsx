import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import inventoryService from '../../services/inventoryService';
import { logger } from '../../utils/logger';
import { MOVEMENTS, type InventoryRow } from './inventory-meta';

export type StockAction = 'receive' | 'move' | 'levels';

interface StockDialogProps {
  /** Mount with a fresh `key` per open. */
  row: InventoryRow;
  action: StockAction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

const errText = (err: unknown) => (err instanceof Error ? err.message : '');

export default function StockDialog({ row, action, open, onOpenChange, onDone }: StockDialogProps) {
  const name = row.Product?.nameEnglish ?? `Product #${row.productId}`;
  const unit = row.Product?.unitType ?? 'units';
  const [qty, setQty] = useState('');
  const [type, setType] = useState<(typeof MOVEMENTS)[number]['value']>('wastage');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [reorderLevel, setReorderLevel] = useState(String(row.reorderLevel));
  const [reorderQuantity, setReorderQuantity] = useState(String(row.reorderQuantity));
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const n = Number.parseInt(qty, 10);
  const movement = MOVEMENTS.find((m) => m.value === type)!;
  const after = action === 'receive' ? row.quantity + (n || 0) : action === 'move' ? row.quantity + (movement.adds ? 1 : -1) * (n || 0) : row.quantity;

  const save = async () => {
    try {
      if (action === 'levels') {
        const lvl = Number.parseInt(reorderLevel, 10);
        const rq = Number.parseInt(reorderQuantity, 10);
        if (!(lvl >= 0) || !(rq >= 0)) return setProblem('Both numbers must be 0 or more.');
        setSaving(true);
        await inventoryService.updateThresholds(row.productId, lvl, rq);
        toast.success(`Reorder levels saved for ${name}`);
      } else {
        if (!(n >= 1)) return setProblem('Enter a quantity of at least 1.');
        if (action === 'move' && !movement.adds && n > row.quantity) return setProblem(`Only ${row.quantity} ${unit} on hand.`);
        setSaving(true);
        if (action === 'receive') {
          await inventoryService.restock(row.productId, { quantity: n });
          toast.success(`Received ${n} ${unit} of ${name}`);
        } else {
          await inventoryService.recordMovement(row.productId, {
            movementType: type,
            quantity: n,
            reference: reference.trim() || undefined,
            notes: notes.trim() || undefined,
          });
          toast.success(`${movement.label}: ${movement.adds ? '+' : '−'}${n} ${unit} of ${name}`);
        }
      }
      setProblem(null);
      onDone();
      onOpenChange(false);
    } catch (err) {
      logger.error('Stock update failed:', err);
      setProblem(errText(err) || 'Couldn’t save that.');
    } finally {
      setSaving(false);
    }
  };

  const title = action === 'receive' ? `Receive ${name}` : action === 'move' ? `Record a stock change` : `Reorder levels`;
  const description =
    action === 'receive'
      ? 'Adds to the warehouse count and marks today as the last restock.'
      : action === 'move'
        ? `${name} · ${row.quantity} ${unit} on hand`
        : `When ${name} drops to the reorder level it’s flagged to reorder.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {action === 'move' && (
            <div className="grid gap-1.5">
              <Label htmlFor="sd-type">What happened?</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger id="sd-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENTS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className={m.adds ? 'text-emerald-600' : 'text-red-600'}>{m.adds ? '+' : '−'}</span>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {action !== 'levels' && (
            <div className="grid gap-1.5">
              <Label htmlFor="sd-qty">Quantity ({unit})</Label>
              <Input id="sd-qty" type="number" min={1} inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus />
              {n >= 1 && (
                <p className="text-xs text-muted-foreground tabular-nums">
                  {row.quantity} → <span className={after < 0 ? 'text-destructive' : 'font-medium text-foreground'}>{after}</span> {unit}
                </p>
              )}
            </div>
          )}

          {action === 'move' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="sd-ref">Reference</Label>
                <Input id="sd-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sd-notes">Note</Label>
                <Input id="sd-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
              </div>
            </div>
          )}

          {action === 'levels' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="sd-level">Reorder at</Label>
                <Input id="sd-level" type="number" min={0} value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
                <p className="text-xs text-muted-foreground">{unit} or fewer</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sd-rq">Usual reorder</Label>
                <Input id="sd-rq" type="number" min={0} value={reorderQuantity} onChange={(e) => setReorderQuantity(e.target.value)} />
                <p className="text-xs text-muted-foreground">{unit} per restock</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="items-center">
          {problem && <p className="mr-auto text-sm text-destructive">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {action === 'receive' ? 'Receive' : action === 'move' ? 'Record' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
