import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, ImageOff, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import suppliersService, { type Supplier, type SupplierProductLink } from '../../services/suppliersService';
import type { Product } from '../../services/productsService';
import { logger } from '../../utils/logger';
import { formatDate } from '../customers/CustomerTypes';
import { formatGhs } from '../orders/order-status';

interface SupplierSheetProps {
  /** null = new supplier. Mount with a fresh `key` per open. */
  supplier: Supplier | null;
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const errText = (err: unknown) => (err instanceof Error ? err.message : '');

export default function SupplierSheet({ supplier, products, open, onOpenChange, onSaved }: SupplierSheetProps) {
  const [form, setForm] = useState({
    name: supplier?.name ?? '',
    contactName: supplier?.contactName ?? '',
    phone: supplier?.phone ?? '',
    location: supplier?.location ?? '',
    notes: supplier?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [links, setLinks] = useState<SupplierProductLink[] | null>(supplier ? null : []);
  const [busyProduct, setBusyProduct] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (!supplier) return;
    let cancelled = false;
    suppliersService
      .getById(supplier.id)
      .then((d) => !cancelled && setLinks(d.ProductSupplier ?? []))
      .catch((err) => {
        logger.error('Failed to load supplier products:', err);
        if (!cancelled) setLinks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [supplier]);

  const linkedIds = useMemo(() => new Set((links ?? []).map((l) => l.productId)), [links]);
  const unlinked = products.filter((p) => !linkedIds.has(p.id));

  const reloadLinks = async (id: number) => setLinks((await suppliersService.getById(id)).ProductSupplier ?? []);

  const toggleProduct = async (productId: number, link: boolean) => {
    if (!supplier) return;
    try {
      setBusyProduct(productId);
      if (link) await suppliersService.linkProduct(supplier.id, productId);
      else await suppliersService.unlinkProduct(supplier.id, productId);
      await reloadLinks(supplier.id);
      onSaved();
    } catch (err) {
      logger.error('Failed to update product link:', err);
      toast.error(`Couldn't update products. ${errText(err)}`.trim());
    } finally {
      setBusyProduct(null);
    }
  };

  const save = async () => {
    if (!form.name.trim()) return setProblem('Give the supplier a name.');
    setProblem(null);
    const dto = {
      name: form.name.trim(),
      contactName: form.contactName.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      notes: form.notes.trim(),
    };
    try {
      setSaving(true);
      if (supplier) {
        await suppliersService.update(supplier.id, dto);
        toast.success(`${dto.name} saved`);
        onOpenChange(false);
      } else {
        await suppliersService.create(dto);
        toast.success(`${dto.name} added — open it to link the products they supply`);
        onOpenChange(false);
      }
      onSaved();
    } catch (err) {
      logger.error('Failed to save supplier:', err);
      setProblem(errText(err) || 'Couldn’t save the supplier.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b p-6 pb-4">
          <SheetTitle className="text-xl">{supplier ? supplier.name : 'New supplier'}</SheetTitle>
          <SheetDescription>{supplier ? `Supplier since ${formatDate(supplier.createdAt)}` : 'Who you buy from. Link their products after saving.'}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
          <section className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="sp-name">Name</Label>
              <Input id="sp-name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Makola — Auntie Akos" autoFocus={!supplier} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="sp-contact">Contact person</Label>
                <Input id="sp-contact" value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} placeholder="Optional" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sp-phone">Phone</Label>
                <Input id="sp-phone" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="Optional" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sp-loc">Location</Label>
              <Input id="sp-loc" value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Makola Market, stall 14" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sp-notes">Notes</Label>
              <Textarea id="sp-notes" rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Optional" />
            </div>
          </section>

          {supplier && (
            <section className="grid gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Products they supply ({links?.length ?? '…'})</h3>
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" disabled={links === null}>
                      <Plus />
                      Add product
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search products…" />
                      <CommandList>
                        <CommandEmpty>No products left to add.</CommandEmpty>
                        <CommandGroup>
                          {unlinked.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={`${p.nameEnglish} ${p.nameLocal ?? ''}`}
                              onSelect={() => {
                                setPickerOpen(false);
                                void toggleProduct(p.id, true);
                              }}
                            >
                              <Check className="opacity-0" />
                              {p.nameEnglish}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {links === null ? (
                <Skeleton className="h-24 w-full" />
              ) : links.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">No products linked yet.</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {links.map((l) => (
                    <li key={l.id} className="flex items-center gap-3 px-3 py-2">
                      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                        {l.Product.imageUrl ? <img src={l.Product.imageUrl} alt="" className="size-full object-cover" /> : <ImageOff className="size-3.5 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{l.Product.nameEnglish}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {l.latestCost != null
                            ? `Last paid ${formatGhs(Number(l.latestCost))} / ${l.Product.unitType}${l.latestCostRecordedAt ? ` · ${formatDate(l.latestCostRecordedAt)}` : ''}`
                            : 'No cost recorded yet'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={busyProduct === l.productId}
                        onClick={() => void toggleProduct(l.productId, false)}
                        aria-label={`Unlink ${l.Product.nameEnglish}`}
                      >
                        {busyProduct === l.productId ? <Loader2 className="animate-spin" /> : <X />}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">Unlinking keeps any cost and purchase history.</p>
            </section>
          )}
        </div>

        <SheetFooter className="flex-row items-center justify-end gap-2 border-t p-4">
          {problem && <p className="mr-auto text-sm text-destructive">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {supplier ? 'Save details' : 'Add supplier'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
