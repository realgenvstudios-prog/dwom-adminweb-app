import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, Loader2, Package, Pencil, Plus, RotateCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { packagingService, type PackagingOption } from '../../services/packagingService';
import { logger } from '../../utils/logger';
import ImageUpload from '../common/ImageUpload';
import { formatGhs } from '../orders/order-status';
import { can } from '../../config/permissions';

const message = (err: unknown) => (err instanceof Error ? err.message : '');

interface PackageDialogProps {
  /** null = new. Mount with a fresh `key` per open so the form starts clean. */
  option: PackagingOption | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

function PackageDialog({ option, open, onOpenChange, onSaved }: PackageDialogProps) {
  const [name, setName] = useState(option?.name ?? '');
  const [description, setDescription] = useState(option?.description ?? '');
  const [imageUrl, setImageUrl] = useState(option?.imageUrl ?? '');
  const [price, setPrice] = useState(option ? String(option.price) : '');
  const [cost, setCost] = useState(option?.cost == null ? '' : String(option.cost));
  const [saving, setSaving] = useState(false);

  const free = !!option?.isDefault;
  const problem = !name.trim()
    ? 'Give the package a name.'
    : !free && (price === '' || Number(price) < 0)
      ? 'Set a price. Use 0 if it’s free.'
      : cost !== '' && Number(cost) < 0
        ? 'The cost can’t be negative.'
        : null;

  const save = async () => {
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || null,
        imageUrl: imageUrl || null,
        price: free ? 0 : Math.round(Number(price) * 100) / 100,
        cost: cost === '' ? null : Math.round(Number(cost) * 100) / 100,
      };
      if (option) await packagingService.update(option.id, data);
      else await packagingService.create(data);
      toast.success(`${data.name} saved`);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save package:', err);
      toast.error(`Couldn’t save the package. ${message(err)}`.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{option ? `Edit ${option.name}` : 'New package'}</DialogTitle>
          <DialogDescription>Customers choose a package at checkout. Its price is added to their total.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="pk-name">Name</Label>
            <Input id="pk-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Reusable basket" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pk-desc">Description</Label>
            <Textarea id="pk-desc" rows={2} maxLength={160} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="pk-price">Price to customers</Label>
              <Input id="pk-price" type="number" min={0} step={0.5} disabled={free} value={free ? '0' : price} onChange={(e) => setPrice(e.target.value)} className="tabular-nums" />
              {free && <p className="text-xs text-muted-foreground">The default package is always free.</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pk-cost">Cost to DWOM</Label>
              <Input id="pk-cost" type="number" min={0} step={0.5} value={cost} onChange={(e) => setCost(e.target.value)} className="tabular-nums" placeholder="Optional" />
              <p className="text-xs text-muted-foreground">Used for profit. Customers never see it.</p>
            </div>
          </div>
          <ImageUpload label="Photo" value={imageUrl} onChange={setImageUrl} />
        </div>
        <DialogFooter className="items-center">
          {problem && <p className="mr-auto text-sm text-muted-foreground">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving || !!problem}>
            {saving && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// The packages customers choose from at checkout.
export default function PackagingCard() {
  const editable = can('finance.settings');
  const [options, setOptions] = useState<PackagingOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<{ key: number; option: PackagingOption | null } | null>(null);
  const [deleting, setDeleting] = useState<PackagingOption | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setOptions(await packagingService.list());
    } catch (err) {
      logger.error('Failed to load packages:', err);
      setError(message(err) || 'Something went wrong.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<unknown>, failure: string) => {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      logger.error(failure, err);
      toast.error(`${failure} ${message(err)}`.trim());
    } finally {
      await load();
      setBusy(false);
    }
  };

  const toggle = (option: PackagingOption, isActive: boolean) =>
    run(async () => {
      await packagingService.update(option.id, { isActive });
      toast.success(isActive ? `Customers can now choose ${option.name}` : `${option.name} turned off`);
    }, 'Couldn’t change the package.');

  // The default always stays first; the others save their new positions.
  const move = (index: number, by: -1 | 1) =>
    run(async () => {
      const list = (options ?? []).filter((o) => !o.isDefault);
      const [moved] = list.splice(index, 1);
      list.splice(index + by, 0, moved);
      await Promise.all(list.map((o, i) => (o.sortOrder === i + 1 ? null : packagingService.update(o.id, { sortOrder: i + 1 }))));
    }, 'Couldn’t reorder the packages.');

  const remove = (option: PackagingOption) =>
    run(async () => {
      await packagingService.remove(option.id);
      toast.success(`${option.name} deleted`);
    }, 'Couldn’t delete the package.');

  const paid = (options ?? []).filter((o) => !o.isDefault);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1.5">
          <CardTitle className="flex items-center gap-2">
            Packaging
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 font-normal text-amber-700">
              Changes what customers pay
            </Badge>
          </CardTitle>
          <CardDescription>What customers can choose at checkout. The price is added after the small-order fee and promo codes, and doesn’t count toward either.</CardDescription>
        </div>
        {editable && (
          <Button size="sm" onClick={() => setDialog({ key: Date.now(), option: null })}>
            <Plus />
            Add package
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-4" />
              Couldn’t load packages: {error}
            </div>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RotateCw />
              Retry
            </Button>
          </div>
        ) : !options ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : (
          <ul className="divide-y rounded-lg border">
            {options.map((o) => {
              const index = paid.indexOf(o);
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-3 p-3">
                  <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {o.imageUrl ? <img src={o.imageUrl} alt="" className="size-full object-cover" /> : <Package className="size-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-40 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {o.name}
                      {o.isDefault && <Badge variant="secondary">Default</Badge>}
                    </p>
                    {o.description && <p className="text-xs text-muted-foreground">{o.description}</p>}
                  </div>
                  <div className="w-28 text-sm">
                    <p className="font-medium tabular-nums">{o.price > 0 ? formatGhs(o.price) : 'Free'}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{o.cost == null ? 'Flat cost' : `Costs ${formatGhs(o.cost)}`}</p>
                  </div>
                  {editable && (
                    <div className="flex items-center gap-1">
                      {!o.isDefault && (
                        <>
                          <Button variant="ghost" size="icon" aria-label={`Move ${o.name} up`} disabled={busy || index === 0} onClick={() => void move(index, -1)}>
                            <ArrowUp />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label={`Move ${o.name} down`} disabled={busy || index === paid.length - 1} onClick={() => void move(index, 1)}>
                            <ArrowDown />
                          </Button>
                          <Switch aria-label={`Offer ${o.name}`} className="mx-2" checked={o.isActive} disabled={busy} onCheckedChange={(on) => void toggle(o, on)} />
                        </>
                      )}
                      <Button variant="ghost" size="icon" aria-label={`Edit ${o.name}`} onClick={() => setDialog({ key: Date.now(), option: o })}>
                        <Pencil />
                      </Button>
                      {!o.isDefault && (
                        <Button variant="ghost" size="icon" aria-label={`Delete ${o.name}`} disabled={busy} onClick={() => setDeleting(o)}>
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {dialog && <PackageDialog key={dialog.key} option={dialog.option} open onOpenChange={(open) => !open && setDialog(null)} onSaved={() => void load()} />}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Customers won’t be able to choose it. Past orders keep the name and price they were placed with. To bring it back later, turn it off instead.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && void remove(deleting)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
