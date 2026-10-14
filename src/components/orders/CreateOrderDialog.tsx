import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import ordersService from '../../services/ordersService';
import { logger } from '../../utils/logger';
import { PAYMENT_METHODS } from './order-status';

interface Line {
  key: number;
  productId: string;
  quantity: number;
}

const emptyForm = () => ({
  customerId: '',
  addressId: '',
  paymentMethod: 'cash',
  riderNotes: '',
  lines: [{ key: Date.now(), productId: '', quantity: 1 }] as Line[],
});

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateOrderDialog({ open, onOpenChange, onCreated }: CreateOrderDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const setLine = (key: number, patch: Partial<Line>) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId || !form.addressId || form.lines.some((l) => !l.productId || l.quantity < 1)) {
      toast.error('Fill in the customer, address, and every product line.');
      return;
    }
    try {
      setSaving(true);
      const created = await ordersService.createOrder({
        userId: Number.parseInt(form.customerId, 10),
        deliveryAddressId: Number.parseInt(form.addressId, 10),
        paymentMethod: form.paymentMethod,
        riderNotes: form.riderNotes.trim() || undefined,
        items: form.lines.map((l) => ({ productId: Number.parseInt(l.productId, 10), quantity: l.quantity })),
      });
      toast.success(`Order #${created.id} created`);
      setForm(emptyForm());
      onOpenChange(false);
      onCreated();
    } catch (err) {
      logger.error('❌ [CreateOrderDialog] Failed to create order:', err);
      toast.error(`Couldn't create the order. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create manual order</DialogTitle>
          <DialogDescription>For orders taken by phone or in person. Customer IDs are shown on the Customers page.</DialogDescription>
        </DialogHeader>

        <form id="create-order" onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="co-customer">Customer ID</Label>
              <Input
                id="co-customer"
                inputMode="numeric"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value.replace(/\D/g, '') })}
                placeholder="e.g. 128"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="co-address">Delivery address ID</Label>
              <Input
                id="co-address"
                inputMode="numeric"
                value={form.addressId}
                onChange={(e) => setForm({ ...form, addressId: e.target.value.replace(/\D/g, '') })}
                placeholder="e.g. 342"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="co-method">Payment method</Label>
            <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
              <SelectTrigger id="co-method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <m.icon />
                    {m.value === 'cash' ? 'Cash on delivery' : m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Items</Label>
            <div className="grid gap-2">
              {form.lines.map((line, i) => (
                <div key={line.key} className="flex gap-2">
                  <Input
                    aria-label={`Product ID, line ${i + 1}`}
                    inputMode="numeric"
                    value={line.productId}
                    onChange={(e) => setLine(line.key, { productId: e.target.value.replace(/\D/g, '') })}
                    placeholder="Product ID"
                  />
                  <Input
                    aria-label={`Quantity, line ${i + 1}`}
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => setLine(line.key, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={form.lines.length === 1}
                    onClick={() => setForm((f) => ({ ...f, lines: f.lines.filter((l) => l.key !== line.key) }))}
                    aria-label="Remove line"
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="justify-self-start"
              onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, { key: Date.now(), productId: '', quantity: 1 }] }))}
            >
              <Plus />
              Add item
            </Button>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="co-notes">Note for the rider (optional)</Label>
            <Textarea
              id="co-notes"
              rows={2}
              value={form.riderNotes}
              onChange={(e) => setForm({ ...form, riderNotes: e.target.value })}
              placeholder="e.g. Call on arrival, blue gate"
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="create-order" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Create order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
