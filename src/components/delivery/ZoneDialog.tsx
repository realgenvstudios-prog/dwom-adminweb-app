import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import deliveryService, { type DeliveryZone } from '../../services/deliveryService';
import ridersService from '../../services/ridersService';
import { logger } from '../../utils/logger';
import { num } from '../riders/rider-meta';
import ZoneShapeEditor from './ZoneShapeEditor';
import { centroid, circlePolygon, enclosingRadiusKm, type LatLng } from './zone-shape';

interface ZoneDialogProps {
  /** null = create. Mount with a fresh `key` per open. */
  zone: DeliveryZone | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function ZoneDialog({ zone, open, onOpenChange, onSaved }: ZoneDialogProps) {
  const [name, setName] = useState(zone?.name ?? '');
  const [description, setDescription] = useState(zone?.description ?? '');
  const [fee, setFee] = useState(zone ? String(num(zone.deliveryFee)) : '');
  // Circle-only zones open as an equivalent polygon the admin can reshape.
  const [initialShape] = useState<LatLng[] | null>(() =>
    zone ? (zone.polygon && zone.polygon.length >= 3 ? zone.polygon : circlePolygon({ lat: zone.lat, lng: zone.lng }, zone.radius)) : null,
  );
  const [shape, setShape] = useState<LatLng[] | null>(initialShape);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const feeNum = Number.parseFloat(fee);
    if (!name.trim()) return setProblem('Name the zone.');
    if (!shape || shape.length < 3) return setProblem('Search for a place and shape the zone on the map.');
    if (!Number.isFinite(feeNum) || feeNum < 0) return setProblem('Enter a delivery fee (0 for free delivery).');
    setProblem(null);
    // The API derives these from the corners too; sent because create requires them.
    const { lat, lng } = centroid(shape);
    const geometry = { lat, lng, radius: Math.round(enclosingRadiusKm(shape) * 100) / 100, polygon: shape };
    try {
      setSaving(true);
      if (zone) {
        await deliveryService.updateZone(zone.id, {
          name: name.trim(),
          description: description.trim(),
          ...geometry,
          deliveryFee: feeNum,
        });
        toast.success(`${name.trim()} saved`);
      } else {
        await ridersService.createZone({
          name: name.trim(),
          description: description.trim() || undefined,
          ...geometry,
          deliveryFee: feeNum,
        });
        toast.success(`${name.trim()} created. Deliveries there are live`);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to save zone:', err);
      toast.error(`Couldn't save the zone. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle>{zone ? `Edit ${zone.name}` : 'New delivery zone'}</DialogTitle>
          <DialogDescription>Customers whose address falls inside the shape can order, and pay this zone’s delivery fee.</DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <div className="grid gap-1.5">
              <Label htmlFor="z-name">Name</Label>
              <Input id="z-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. East Legon" autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="z-fee">Delivery fee</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">GH₵</span>
                <Input id="z-fee" type="number" min={0} step={0.5} value={fee} onChange={(e) => setFee(e.target.value)} placeholder="8.00" className="pl-11 tabular-nums" />
              </div>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="z-desc">Description</Label>
            <Input id="z-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional, e.g. neighbourhoods it covers" />
          </div>
          <ZoneShapeEditor initialShape={initialShape} onChange={setShape} />
        </div>
        <DialogFooter className="items-center border-t p-4">
          {problem && <p className="mr-auto text-sm text-destructive">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            {zone ? 'Save changes' : 'Create zone'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
