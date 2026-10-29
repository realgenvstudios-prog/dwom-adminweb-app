import { useCallback, useEffect, useState } from 'react';
import { Check, ImageOff, PackageSearch, Search, ShoppingCart, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';
import itemRequestsService, { type ItemRequestGroup, type ItemRequestList, type RequestStatus } from '../../services/itemRequestsService';
import { logger } from '../../utils/logger';
import type { Product } from './ProductTypes';

const FILTERS: { status: RequestStatus; label: string }[] = [
  { status: 'open', label: 'New' },
  { status: 'checking', label: 'Checking' },
  { status: 'available', label: 'Added' },
  { status: 'unavailable', label: 'Can’t get' },
];

const STATUS_BADGE: Record<RequestStatus, { label: string; className: string }> = {
  open: { label: 'New', className: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  checking: { label: 'Checking', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  available: { label: 'Added', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  unavailable: { label: 'Can’t get', className: 'bg-muted text-muted-foreground' },
};

function ago(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

/** Pick the product that was added for a request; saving tells everyone who asked. */
function MarkAvailableDialog({ group, products, onClose, onDone }: { group: ItemRequestGroup | null; products: Product[]; onClose: () => void; onDone: () => void }) {
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group) {
      setSearch(group.text);
      setPicked(null);
    }
  }, [group]);

  const q = search.trim().toLowerCase();
  const visible = products
    .filter((p) => !q || `${p.nameEnglish} ${p.nameLocal ?? ''}`.toLowerCase().includes(q))
    .slice(0, 50);

  const save = async () => {
    if (!group || picked == null) return;
    setSaving(true);
    try {
      const { notified } = await itemRequestsService.update(group.key, 'available', picked);
      toast.success(notified > 0 ? `Marked as added. ${notified} customer${notified === 1 ? '' : 's'} told.` : 'Marked as added.');
      onDone();
      onClose();
    } catch (err) {
      logger.error('Failed to mark request available:', err);
      toast.error('Couldn’t save that. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!group} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Which product is “{group?.text}”?</DialogTitle>
          <DialogDescription>
            {group && group.waiting > 0
              ? `The ${group.waiting} customer${group.waiting === 1 ? '' : 's'} who asked will get a notification that it’s now on DWOM.`
              : 'Nobody signed in is waiting on this one, so no one will be notified.'}{' '}
            Add the product in Products first if it isn’t listed.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="pl-8" autoFocus />
        </div>
        <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
          {visible.length === 0 ? (
            <li className="p-6 text-center text-sm text-muted-foreground">No products match. Add it in Products, then come back.</li>
          ) : (
            visible.map((p) => {
              const id = Number(p.id);
              const selected = picked === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setPicked(id)}
                    aria-pressed={selected}
                    className={cn('flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted', selected && 'bg-primary/5')}
                  >
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="size-9 shrink-0 rounded-md object-cover" />
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <ImageOff className="size-4 text-muted-foreground" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{p.nameEnglish}</span>
                    {selected && <Check className="size-4 text-primary" />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={picked == null || saving}>
            {group && group.waiting > 0 ? `Mark as added and tell ${group.waiting}` : 'Mark as added'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** What customers told us they couldn't find, grouped by item, most wanted first. */
export default function RequestsTab({ products }: { products: Product[] }) {
  const can = usePermissions();
  const canEdit = can('products.edit');
  const [status, setStatus] = useState<RequestStatus>('open');
  const [data, setData] = useState<ItemRequestList | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [marking, setMarking] = useState<ItemRequestGroup | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await itemRequestsService.list());
      setFailed(false);
    } catch (err) {
      logger.error('Failed to load item requests:', err);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const move = async (group: ItemRequestGroup, next: RequestStatus) => {
    setBusyKey(group.key);
    try {
      await itemRequestsService.update(group.key, next);
      toast.success(next === 'checking' ? `Checking “${group.text}”` : next === 'unavailable' ? `“${group.text}” marked as can’t get` : `“${group.text}” moved back to new`);
      await load();
    } catch (err) {
      logger.error('Failed to update item request:', err);
      toast.error('Couldn’t save that. Try again.');
    } finally {
      setBusyKey(null);
    }
  };

  const rows = data?.groups.filter((g) => g.status === status) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Things customers searched for and couldn’t find, or told us about from their cart. Check whether you can get them; marking one as added tells everyone who asked.
      </p>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.status}
            type="button"
            onClick={() => setStatus(f.status)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors',
              status === f.status ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
            )}
          >
            {f.label}
            <span className={cn('tabular-nums text-xs', status === f.status ? 'text-primary-foreground/80' : 'text-muted-foreground')}>{data?.counts[f.status] ?? 0}</span>
          </button>
        ))}
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          {failed ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Couldn’t load requests. Refresh to try again.</p>
          ) : !data ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <PackageSearch className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{status === 'open' ? 'No new requests. Customers are finding what they need.' : 'Nothing here.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Item</TableHead>
                    <TableHead className="text-right">Asked by</TableHead>
                    <TableHead>Where</TableHead>
                    <TableHead>Last asked</TableHead>
                    <TableHead>Status</TableHead>
                    {canEdit && <TableHead className="pr-4 text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((g) => (
                    <TableRow key={g.key}>
                      <TableCell className="pl-4">
                        <div className="font-medium capitalize">{g.text}</div>
                        {g.product && <div className="text-xs text-muted-foreground">Added as {g.product.nameEnglish}</div>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {(g.customers + g.guests).toLocaleString()}
                        {g.guests > 0 && <span className="ml-1 text-xs text-muted-foreground">({g.guests} guest{g.guests === 1 ? '' : 's'})</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {g.fromSearch > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Search className="size-3.5" /> {g.fromSearch}
                            </span>
                          )}
                          {g.fromCart > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <ShoppingCart className="size-3.5" /> {g.fromCart}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{ago(g.lastAt)}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[g.status].className}>{STATUS_BADGE[g.status].label}</Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="pr-4">
                          <div className="flex justify-end gap-1.5">
                            {g.status === 'open' && (
                              <Button size="sm" variant="outline" disabled={busyKey === g.key} onClick={() => void move(g, 'checking')}>
                                Checking
                              </Button>
                            )}
                            {g.status !== 'available' && (
                              <Button size="sm" disabled={busyKey === g.key} onClick={() => setMarking(g)}>
                                <Check /> Added
                              </Button>
                            )}
                            {(g.status === 'open' || g.status === 'checking') && (
                              <Button size="sm" variant="ghost" disabled={busyKey === g.key} onClick={() => void move(g, 'unavailable')} aria-label={`Mark ${g.text} as can't get`}>
                                <X /> Can’t get
                              </Button>
                            )}
                            {g.status === 'unavailable' && (
                              <Button size="sm" variant="ghost" disabled={busyKey === g.key} onClick={() => void move(g, 'open')}>
                                Reopen
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <MarkAvailableDialog group={marking} products={products} onClose={() => setMarking(null)} onDone={() => void load()} />
    </div>
  );
}
