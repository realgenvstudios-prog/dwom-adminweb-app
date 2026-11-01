import { useEffect, useState } from 'react';
import { Check, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import ordersService from '../../../services/ordersService';
import { productsService, type Product } from '../../../services/productsService';
import { formatGhs } from '../order-status';
import type { OrderItem } from '../OrderTypes';

const MAX = 3;

interface Props {
  orderId: number;
  item: OrderItem | null;
  onClose: () => void;
  onDone: () => void;
}

// Marks an item unavailable and offers up to 3 substitutes. What the customer
// picked at checkout decides whether they're asked.
export default function UnavailableDialog({ orderId, item, onClose, onDone }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [picked, setPicked] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) return;
    let stale = false;
    const t = setTimeout(() => {
      void productsService.search(query.trim()).then((r) => {
        if (!stale) setResults((Array.isArray(r) ? r : []).filter((p) => (p as { stockStatus?: string }).stockStatus !== 'out_of_stock').slice(0, 8));
      });
    }, 250);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [query]);

  const toggle = (p: Product) =>
    setPicked((list) => (list.some((x) => x.id === p.id) ? list.filter((x) => x.id !== p.id) : list.length >= MAX ? list : [...list, p]));

  const save = async () => {
    if (!item) return;
    setSaving(true);
    try {
      const res = await ordersService.flagUnavailable(orderId, Number(item.id), picked.map((p) => Number(p.id)));
      toast.success(res.status === 'waiting' ? 'The customer has been asked to choose' : 'Order updated, as they chose at checkout');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t update the item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item?.name} is unavailable</DialogTitle>
          <DialogDescription>Offer up to {MAX} substitutes. The customer can choose one, pick something else, or remove it. Any price difference is theirs.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className="pl-9" />
        </div>
        <ul className="max-h-64 divide-y overflow-y-auto rounded-lg border empty:hidden">
          {[...picked, ...results.filter((r) => !picked.some((p) => p.id === r.id))].map((p) => {
            const on = picked.some((x) => x.id === p.id);
            return (
              <li key={p.id}>
                <button type="button" className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted/50" onClick={() => toggle(p)}>
                  <span className="min-w-0 flex-1 truncate">{p.nameEnglish}</span>
                  <span className="text-muted-foreground tabular-nums">{formatGhs(Number(p.pricePerUnit))}</span>
                  {on && <Check className="size-4 text-emerald-600" />}
                </button>
              </li>
            );
          })}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {picked.length ? `Offer ${picked.length}` : 'Mark unavailable, no substitutes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
