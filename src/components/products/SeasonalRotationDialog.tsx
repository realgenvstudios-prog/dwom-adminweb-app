import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import seasonalService from '../../services/seasonalService';
import { logger } from '../../utils/logger';
import type { Product } from './ProductTypes';

interface SeasonalConfig {
  rotationFrequency: 'daily' | 'weekly' | 'monthly';
  featuredProductId: number;
}

interface SeasonalRotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seasonalProducts: Product[];
}

// The only global part of "seasonal": which seasonal product is featured
// and how often it rotates. Marking a product seasonal is a toggle on its row.
export default function SeasonalRotationDialog({ open, onOpenChange, seasonalProducts }: SeasonalRotationDialogProps) {
  const [config, setConfig] = useState<SeasonalConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    seasonalService
      .getSeasonalConfig()
      .then((c) => !cancelled && setConfig(c ?? { rotationFrequency: 'daily', featuredProductId: 0 }))
      .catch((err) => {
        logger.error('Failed to load seasonal config:', err);
        if (!cancelled) setConfig({ rotationFrequency: 'daily', featuredProductId: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const save = async () => {
    if (!config) return;
    try {
      setSaving(true);
      await seasonalService.updateSeasonalConfig(config);
      toast.success('Seasonal rotation saved');
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save seasonal config:', err);
      toast.error('Couldn’t save the seasonal rotation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seasonal rotation</DialogTitle>
          <DialogDescription>
            Which seasonal product the app features, and how often it changes. {seasonalProducts.length} product
            {seasonalProducts.length === 1 ? ' is' : 's are'} marked seasonal.
          </DialogDescription>
        </DialogHeader>

        {!config ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="sr-freq">Rotate</Label>
              <Select
                value={config.rotationFrequency}
                onValueChange={(v) => setConfig({ ...config, rotationFrequency: v as SeasonalConfig['rotationFrequency'] })}
              >
                <SelectTrigger id="sr-freq" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sr-feat">Featured product</Label>
              <Select
                value={String(config.featuredProductId || 0)}
                onValueChange={(v) => setConfig({ ...config, featuredProductId: Number(v) })}
              >
                <SelectTrigger id="sr-feat" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Pick automatically</SelectItem>
                  {seasonalProducts.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nameEnglish}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !config}>
            {saving && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
