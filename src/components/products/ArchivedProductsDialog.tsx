import { useEffect, useState } from 'react';
import { ArchiveRestore, ImageOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import productsService from '../../services/productsService';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';

type Archived = { id: number; nameEnglish: string; pricePerUnit: number | string; imageUrl?: string | null; Category?: { name?: string } | null };

/** Archived products with a Restore button. Mount with a fresh `key` per open. */
export default function ArchivedProductsDialog({ open, onOpenChange, onRestored }: { open: boolean; onOpenChange: (o: boolean) => void; onRestored: () => void }) {
  const [items, setItems] = useState<Archived[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    productsService
      .getArchived()
      .then((list) => !cancelled && setItems(list as unknown as Archived[]))
      .catch((err) => {
        logger.error('Failed to load archived products:', err);
        if (!cancelled) setFailed(err instanceof Error ? err.message : 'Couldn’t load archived products');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const restore = async (p: Archived) => {
    try {
      setBusy(p.id);
      await productsService.restore(p.id);
      setItems((prev) => prev?.filter((x) => x.id !== p.id) ?? null);
      toast.success(`${p.nameEnglish} is back in the app`);
      onRestored();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t restore the product.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Archived products</DialogTitle>
          <DialogDescription>Hidden from the app. Restore one to sell it again; its price, stock and options are kept.</DialogDescription>
        </DialogHeader>
        {failed ? (
          <p className="text-sm text-destructive">{failed}</p>
        ) : items === null ? (
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing is archived.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {items.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3">
                <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                  {p.imageUrl ? <img src={p.imageUrl} alt="" className="size-full object-cover" /> : <ImageOff className="m-2.5 size-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.nameEnglish}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatGhs(Number(p.pricePerUnit) || 0)}
                    {p.Category?.name ? ` · ${p.Category.name}` : ''}
                  </p>
                </div>
                <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => void restore(p)}>
                  {busy === p.id ? <Loader2 className="animate-spin" /> : <ArchiveRestore />}
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
