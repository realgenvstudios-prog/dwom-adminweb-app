import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import categoriesService from '../../services/categoriesService';
import { logger } from '../../utils/logger';
import ImageUpload from '../common/ImageUpload';
import type { CategoryRecord } from '../products/useCatalogData';

interface CategoryDialogProps {
  /** null = create. Mount with a fresh `key` per open so the form starts clean. */
  category: CategoryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** sortOrder for a new category, so it lands at the end of the list. */
  nextSortOrder: number;
  onSaved: () => void;
}

export default function CategoryDialog({ category, open, onOpenChange, nextSortOrder, onSaved }: CategoryDialogProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [nameFrench, setNameFrench] = useState(category?.nameFrench ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Enter a category name');
      return;
    }
    try {
      setSaving(true);
      if (category) {
        // Empty strings (not undefined) so clearing a field actually clears it.
        await categoriesService.update(category.id, {
          name: name.trim(),
          nameFrench: nameFrench.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
        });
        toast.success(`${name.trim()} saved`);
      } else {
        await categoriesService.create({
          name: name.trim(),
          nameFrench: nameFrench.trim() || undefined,
          description: description.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          sortOrder: nextSortOrder,
        } as Parameters<typeof categoriesService.create>[0]);
        toast.success(`${name.trim()} created`);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('❌ [CategoryDialog] Failed to save category:', err);
      toast.error(`Couldn't save the category. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? `Edit ${category.name}` : 'New category'}</DialogTitle>
          <DialogDescription>Categories group products in the app’s menu.</DialogDescription>
        </DialogHeader>
        <form id="category-form" onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={name}
                aria-invalid={nameError ? true : undefined}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
                placeholder="e.g. Vegetables"
                autoFocus
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cat-fr">Name (French)</Label>
              <Input id="cat-fr" value={nameFrench} onChange={(e) => setNameFrench(e.target.value)} placeholder="e.g. Légumes" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea id="cat-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <ImageUpload label="Image" value={imageUrl} onChange={setImageUrl} />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {category ? 'Save changes' : 'Create category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
