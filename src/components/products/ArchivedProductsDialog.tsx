import { useEffect, useState } from 'react';
import { ArchiveRestore, ImageOff, Loader2, Trash2, TriangleAlert } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import productsService from '../../services/productsService';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';
import { can } from '../../config/permissions';

type DeleteCheck = { canDelete: boolean; blockers: string[] } | 'loading' | 'failed';

type Archived = { id: number; nameEnglish: string; pricePerUnit: number | string; imageUrl?: string | null; Category?: { name?: string } | null };

/** Archived products with a Restore button. Mount with a fresh `key` per open. */
export default function ArchivedProductsDialog({ open, onOpenChange, onRestored }: { open: boolean; onOpenChange: (o: boolean) => void; onRestored: () => void }) {
  const [items, setItems] = useState<Archived[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Archived | null>(null);
  const [check, setCheck] = useState<DeleteCheck>('loading');
  const [deleting, setDeleting] = useState(false);

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

  // Ask the server first so the warning can say why a product can't go.
  const askDelete = (p: Archived) => {
    setToDelete(p);
    setCheck('loading');
    productsService
      .deleteCheck(p.id)
      .then((c) => setCheck(c))
      .catch((err) => {
        logger.error('Failed to check product delete:', err);
        setCheck('failed');
      });
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await productsService.deletePermanently(toDelete.id);
      setItems((prev) => prev?.filter((x) => x.id !== toDelete.id) ?? null);
      toast.success(`${toDelete.nameEnglish} deleted permanently`);
      setToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t delete the product.');
    } finally {
      setDeleting(false);
    }
  };

  const blocked = typeof check === 'object' && !check.canDelete;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Archived products</DialogTitle>
            <DialogDescription>Hidden from the app. Restore one to sell it again with its price, stock and options, or delete it for good.</DialogDescription>
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
                  <div className="flex shrink-0 gap-1.5">
                    {can('products.archive') && (
                      <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => void restore(p)}>
                        {busy === p.id ? <Loader2 className="animate-spin" /> : <ArchiveRestore />}
                        Restore
                      </Button>
                    )}
                    {can('products.deletePermanently') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={busy === p.id}
                        onClick={() => askDelete(p)}
                        aria-label={`Delete ${p.nameEnglish} permanently`}
                      >
                        <Trash2 />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{blocked ? `${toDelete?.nameEnglish} can’t be deleted` : `Delete ${toDelete?.nameEnglish} permanently?`}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                {check === 'loading' ? (
                  <p className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Checking where this product is used…
                  </p>
                ) : check === 'failed' ? (
                  <p>Couldn’t check whether this product is still in use. Close this and try again.</p>
                ) : blocked ? (
                  <>
                    <ul className="list-disc space-y-1 pl-5">
                      {check.blockers.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                    <p>It stays archived, so customers can’t see or order it.</p>
                  </>
                ) : (
                  <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <p>
                      This can’t be undone. The product, its options, stock records, supplier links and reviews are removed for good, and it’s taken out of any customer carts. To
                      sell it again you’d have to add it from scratch.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{blocked ? 'Close' : 'Cancel'}</AlertDialogCancel>
            {!blocked && (
              <AlertDialogAction
                variant="destructive"
                disabled={check === 'loading' || check === 'failed' || deleting}
                onClick={(e) => {
                  e.preventDefault();
                  void confirmDelete();
                }}
              >
                {deleting && <Loader2 className="animate-spin" />}
                Delete permanently
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
