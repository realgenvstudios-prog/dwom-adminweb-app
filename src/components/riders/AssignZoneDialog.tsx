import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ridersService, { type Zone } from '../../services/ridersService';
import { logger } from '../../utils/logger';
import { formatGhs } from '../orders/order-status';
import type { Rider } from './useRidersData';

interface AssignZoneDialogProps {
  /** Mount with a fresh `key` per rider. */
  rider: Rider;
  zones: Zone[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: (riderId: number, zone: Zone) => void;
}

export default function AssignZoneDialog({ rider, zones, open, onOpenChange, onAssigned }: AssignZoneDialogProps) {
  const [zoneId, setZoneId] = useState(rider.zoneId != null ? String(rider.zoneId) : '');
  const [saving, setSaving] = useState(false);
  const unchanged = zoneId === String(rider.zoneId ?? '');

  const save = async () => {
    const zone = zones.find((z) => String(z.id) === zoneId);
    if (!zone) return;
    try {
      setSaving(true);
      await ridersService.assignZone(rider.id, zone.id);
      onAssigned(rider.id, zone);
      toast.success(`${rider.name} now covers ${zone.name}`);
      onOpenChange(false);
    } catch (err) {
      logger.error('Failed to assign zone:', err);
      toast.error(`Couldn't assign the zone. ${err instanceof Error ? err.message : ''}`.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{rider.zoneId == null ? 'Assign zone' : 'Change zone'}</DialogTitle>
          <DialogDescription>
            {rider.name} {rider.zoneId == null ? 'doesn’t cover a zone yet.' : `currently covers ${rider.zone}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="az-zone">Zone</Label>
          {zones.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No zones yet. Create one on the Delivery Zones tab.</p>
          ) : (
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger id="az-zone" className="w-full">
                <SelectValue placeholder="Choose a zone" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={String(z.id)}>
                    <span>{z.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{formatGhs(Number(z.deliveryFee))} delivery</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving || !zoneId || unchanged}>
            {saving && <Loader2 className="animate-spin" />}
            Save zone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
