import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ordersService from '../../services/ordersService';
import ridersService from '../../services/ridersService';
import workersService from '../../services/workersService';
import { logger } from '../../utils/logger';
import type { Order, PersonSummary } from './OrderTypes';

type Kind = 'rider' | 'picker';

interface Option {
  id: number;
  name: string;
  detail: string;
}

const COPY: Record<Kind, { noun: string; empty: string }> = {
  rider: { noun: 'rider', empty: 'No active riders available. Add one under Field Operations › Riders.' },
  picker: { noun: 'picker', empty: 'No active pickers available. Add one under Field Operations › Pickers.' },
};

async function loadOptions(kind: Kind): Promise<Option[]> {
  if (kind === 'rider') {
    const riders = await ridersService.getAllRiders();
    return riders
      // Only approved riders who can work; applicants stay in Field Operations → Applications.
      .filter((r) => r.isActive && (!r.approvalStatus || r.approvalStatus === 'approved'))
      .map((r) => ({ id: r.id, name: r.name, detail: [r.status?.replace('_', ' '), r.zone].filter(Boolean).join(' · ') }));
  }
  const workers = await workersService.getAll();
  return workers.filter((w) => w.active).map((w) => ({ id: w.id, name: w.name, detail: w.type }));
}

interface AssignPersonDialogProps {
  kind: Kind;
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: (orderId: string, person: PersonSummary) => void;
}

export default function AssignPersonDialog({ kind, order: incoming, open, onOpenChange, onAssigned }: AssignPersonDialogProps) {
  // Keep the last order on screen while the dialog animates closed.
  const [lastOrder, setLastOrder] = useState(incoming);
  if (incoming && incoming !== lastOrder) setLastOrder(incoming);
  const order = incoming ?? lastOrder;
  const [options, setOptions] = useState<Option[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving] = useState(false);
  const { noun, empty } = COPY[kind];
  const current = kind === 'rider' ? order?.rider : order?.picker;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSelectedId('');
    setOptionsLoading(true);
    loadOptions(kind)
      .then((opts) => !cancelled && setOptions(opts))
      .catch((err) => {
        logger.error(`❌ [Orders] Failed to load ${noun}s:`, err);
        if (!cancelled) setOptions([]);
      })
      .finally(() => !cancelled && setOptionsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, kind, noun]);

  const handleAssign = async () => {
    if (!order || !selectedId) return;
    const person = options.find((o) => String(o.id) === selectedId);
    try {
      setSaving(true);
      const orderId = Number.parseInt(order.id, 10);
      if (kind === 'rider') await ordersService.assignRider(orderId, Number(selectedId));
      else await ordersService.assignPicker(orderId, Number(selectedId));
      onAssigned(order.id, { id: selectedId, name: person?.name ?? `${noun} ${selectedId}` });
      toast.success(`${person?.name ?? 'Assigned'} assigned to order #${order.id}`);
      onOpenChange(false);
    } catch (err) {
      logger.error(`❌ [Orders] Failed to assign ${noun}:`, err);
      toast.error(`Couldn't assign the ${noun}. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{current ? `Reassign ${noun}` : `Assign ${noun}`}</DialogTitle>
          <DialogDescription>
            Order #{order?.id}
            {current ? ` · currently ${current.name}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor={`assign-${kind}`} className="capitalize">
            {noun}
          </Label>
          {optionsLoading ? (
            <div className="flex h-9 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading {noun}s…
            </div>
          ) : options.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">{empty}</p>
          ) : (
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger id={`assign-${kind}`} className="w-full">
                <SelectValue placeholder={`Choose a ${noun}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    <span>{o.name}</span>
                    {o.detail && <span className="text-xs text-muted-foreground capitalize">{o.detail}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={saving || !selectedId}>
            {saving && <Loader2 className="animate-spin" />}
            {current ? 'Reassign' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
