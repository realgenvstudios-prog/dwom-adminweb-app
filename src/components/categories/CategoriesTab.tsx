import { useMemo, useState } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, ImageOff, MoreHorizontal, Pencil, Plus, RotateCw, Search, Trash2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import categoriesService from '../../services/categoriesService';
import { logger } from '../../utils/logger';
import type { CategoryRecord } from '../products/useCatalogData';
import CategoryDialog from './CategoryDialog';

interface CategoriesTabProps {
  categories: CategoryRecord[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// The API accepts sortOrder; the service's DTO type just doesn't list it.
const setSortOrder = (id: number, sortOrder: number) =>
  categoriesService.update(id, { sortOrder } as Parameters<typeof categoriesService.update>[1]);

function productCounts(c: CategoryRecord) {
  const all = c.Product ?? [];
  const live = all.filter((p) => p.active).length;
  return { live, archived: all.length - live, total: all.length };
}

export default function CategoriesTab({ categories, loading, error, refresh }: CategoriesTabProps) {
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<{ category: CategoryRecord | null; token: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CategoryRecord | null>(null);
  const [order, setOrder] = useState<number[] | null>(null);
  const [reordering, setReordering] = useState(false);

  // API order is sortOrder, then id. A local override shows a move instantly.
  const ordered = useMemo(() => {
    if (!order) return categories;
    const byId = new Map(categories.map((c) => [c.id, c]));
    const known = order.map((id) => byId.get(id)).filter((c): c is CategoryRecord => !!c);
    return [...known, ...categories.filter((c) => !order.includes(c.id))];
  }, [categories, order]);

  const q = search.trim().toLowerCase();
  const visible = q ? ordered.filter((c) => `${c.name} ${c.nameFrench ?? ''}`.toLowerCase().includes(q)) : ordered;
  const nextSortOrder = (Math.max(0, ...categories.map((c) => c.sortOrder ?? 0)) || 0) + 10;

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next.map((c) => c.id));

    // Renumber with gaps so later moves only touch the categories that changed.
    const changes = next
      .map((c, i) => ({ c, sortOrder: (i + 1) * 10 }))
      .filter(({ c, sortOrder }) => (c.sortOrder ?? 0) !== sortOrder);
    try {
      setReordering(true);
      await Promise.all(changes.map(({ c, sortOrder }) => setSortOrder(c.id, sortOrder)));
      await refresh();
      setOrder(null);
    } catch (err) {
      logger.error('❌ [CategoriesTab] Failed to reorder:', err);
      toast.error('Couldn’t save the new order. Refreshing.');
      setOrder(null);
      await refresh();
    } finally {
      setReordering(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await categoriesService.delete(toDelete.id);
      toast.success(`${toDelete.name} deleted`);
      await refresh();
    } catch (err) {
      logger.error('❌ [CategoriesTab] Failed to delete category:', err);
      toast.error(`Couldn't delete ${toDelete.name}. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setToDelete(null);
    }
  };

  const openDialog = (category: CategoryRecord | null) => {
    setDialog({ category, token: Date.now() });
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:w-[250px]">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories…" className="h-8 pl-8" />
        </div>
        <Button size="sm" className="h-8" onClick={() => openDialog(null)}>
          <Plus />
          New category
        </Button>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-4" />
            Couldn’t load categories: {error}
          </div>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RotateCw />
            Retry
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20">
                <Tooltip>
                  <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-4">Order</TooltipTrigger>
                  <TooltipContent>The order categories appear in the app.</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell colSpan={5}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : visible.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {categories.length === 0 ? 'No categories yet. Create the first one.' : 'No categories match your search.'}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((c) => {
                const index = ordered.indexOf(c);
                const counts = productCounts(c);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          disabled={reordering || !!q || index === 0}
                          onClick={() => void move(index, -1)}
                          aria-label={`Move ${c.name} up`}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          disabled={reordering || !!q || index === ordered.length - 1}
                          onClick={() => void move(index, 1)}
                          aria-label={`Move ${c.name} down`}
                        >
                          <ArrowDown />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                          {c.imageUrl ? <img src={c.imageUrl} alt="" className="size-full object-cover" /> : <ImageOff className="size-4 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.name}</p>
                          {c.nameFrench && <p className="truncate text-xs text-muted-foreground">{c.nameFrench}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[320px] md:table-cell">
                      <p className="truncate text-muted-foreground">{c.description || 'None'}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="font-medium">{counts.live}</span>
                      {counts.archived > 0 && <span className="ml-1 text-xs text-muted-foreground">+{counts.archived} archived</span>}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="data-[state=open]:bg-muted">
                            <MoreHorizontal />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onSelect={() => openDialog(c)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" disabled={counts.total > 0} onSelect={() => setToDelete(c)}>
                            <Trash2 />
                            {counts.total > 0 ? 'Delete (not empty)' : 'Delete'}
                          </DropdownMenuItem>
                          {counts.total > 0 && (
                            <p className="px-2 pb-1.5 text-xs text-muted-foreground">
                              {counts.live > 0
                                ? `Move its ${counts.live} product${counts.live === 1 ? '' : 's'} to another category first.`
                                : `It still holds ${counts.archived} archived product${counts.archived === 1 ? '' : 's'}, so it can’t be deleted.`}
                            </p>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {!loading && categories.length > 0 && (
        <p className="px-1 text-sm text-muted-foreground">
          {q ? `${visible.length} of ${categories.length} categories · clear the search to reorder` : `${categories.length} categories`}
        </p>
      )}

      {dialog && (
        <CategoryDialog
          key={dialog.token}
          category={dialog.category}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          nextSortOrder={nextSortOrder}
          onSaved={() => void refresh()}
        />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>It has no products. Deleting it removes it from the app’s menu permanently.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
