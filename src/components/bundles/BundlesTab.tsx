import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, ImageOff, MoreHorizontal, Pencil, Plus, RotateCw, Search, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import bundlesService, { type Bundle } from '../../services/bundlesService';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';
import type { Product, ProductCategory } from '../products/ProductTypes';
import BundleDialog from './BundleDialog';
import BundleSheet from './BundleSheet';
import { priceIsStale } from './bundle-pricing';

interface BundlesTabProps {
  products: Product[];
  categories: ProductCategory[];
}

export default function BundlesTab({ products, categories }: BundlesTabProps) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editor, setEditor] = useState<{ bundle: Bundle | null; token: number } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Bundle | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setBundles((await bundlesService.getAll()) ?? []);
    } catch (err) {
      logger.error('❌ [BundlesTab] Failed to fetch bundles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bundles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const active = bundles.filter((b) => b.active !== false);
  const deactivated = bundles.filter((b) => b.active === false);
  const q = search.trim().toLowerCase();
  const visible = (showDeactivated ? bundles : active).filter((b) => !q || b.name.toLowerCase().includes(q));
  const viewing = bundles.find((b) => b.id === viewId) ?? null;

  const openEditor = (bundle: Bundle | null) => {
    setEditor({ bundle, token: Date.now() });
    setEditorOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await bundlesService.delete(toDelete.id);
      // The API deactivates (instead of deleting) bundles that have been ordered.
      toast.success(res?.message?.includes('deactivated') ? `${toDelete.name} has order history, so it was deactivated` : `${toDelete.name} deleted`);
      setViewOpen(false);
      await load();
    } catch (err) {
      logger.error('❌ [BundlesTab] Failed to delete bundle:', err);
      toast.error(`Couldn't delete ${toDelete.name}. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-[250px]">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bundles…" className="h-8 pl-8" />
          </div>
          {deactivated.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={showDeactivated} onCheckedChange={setShowDeactivated} />
              Show deactivated ({deactivated.length})
            </label>
          )}
        </div>
        <Button size="sm" className="h-8" onClick={() => openEditor(null)}>
          <Plus />
          New bundle
        </Button>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load bundles: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          {active.length === 0 ? 'No bundles yet — group a few products into your first one.' : 'No bundles match your search.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((b) => {
            const off = Number(b.discount ?? 0);
            const original = (b.BundleItem ?? []).reduce((s, i) => s + Number(i.totalItemPrice ?? 0), 0);
            const isOff = b.active === false;
            const stale = !isOff && priceIsStale(b, products);
            return (
              <Card
                key={b.id}
                className={cn('group gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md', isOff && 'opacity-60')}
              >
                <button
                  type="button"
                  className="relative block aspect-[16/10] bg-muted text-left"
                  onClick={() => {
                    setViewId(b.id);
                    setViewOpen(true);
                  }}
                >
                  {b.imageUrl ? (
                    <img src={b.imageUrl} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ImageOff className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {off > 0 && <Badge className="bg-emerald-600 text-white">−{off}%</Badge>}
                    {isOff && <Badge variant="secondary">Deactivated</Badge>}
                    {stale && (
                      <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-50 text-amber-800">
                        <AlertTriangle className="size-3" />
                        Prices changed
                      </Badge>
                    )}
                  </div>
                </button>
                <div className="flex items-start gap-2 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{b.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(b.BundleItem ?? []).length} item{(b.BundleItem ?? []).length === 1 ? '' : 's'}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2 tabular-nums">
                      <span className="font-semibold">{formatGhs(Number(b.price ?? 0))}</span>
                      {off > 0 && original > Number(b.price ?? 0) && <span className="text-xs text-muted-foreground line-through">{formatGhs(original)}</span>}
                    </div>
                  </div>
                  {!isOff && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="data-[state=open]:bg-muted">
                          <MoreHorizontal />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onSelect={() => {
                            setViewId(b.id);
                            setViewOpen(true);
                          }}
                        >
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openEditor(b)}>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(b)}>
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {viewing && (
        <BundleSheet
          key={viewing.id}
          bundle={viewing}
          products={products}
          open={viewOpen}
          onOpenChange={setViewOpen}
          onEdit={() => {
            setViewOpen(false);
            openEditor(viewing);
          }}
          onDelete={() => setToDelete(viewing)}
        />
      )}

      {editor && (
        <BundleDialog
          key={editor.token}
          bundle={editor.bundle}
          open={editorOpen}
          onOpenChange={setEditorOpen}
          products={products}
          categories={categories}
          onSaved={() => void load()}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It disappears from the app. If customers have ordered it before, it’s deactivated instead of deleted so their
              order history stays intact — deactivated bundles can’t be turned back on from the dashboard yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep bundle</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
