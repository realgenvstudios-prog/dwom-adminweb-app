import { useState } from 'react';
import { Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ridersService, { type Zone } from '../../services/ridersService';
import { logger } from '../../utils/logger';
import { NO_ZONE, VEHICLES } from './rider-meta';

interface CreateRiderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zones: Zone[];
  onCreated: () => void;
}

const EMPTY = { name: '', phone: '', email: '', vehicleType: 'motor', licenseNumber: '', zoneId: NO_ZONE };

export default function CreateRiderDialog({ open, onOpenChange, zones, onCreated }: CreateRiderDialogProps) {
  const [form, setForm] = useState(EMPTY);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return setProblem('Name and phone number are required.');
    setProblem(null);
    try {
      setSaving(true);
      // The admin-create endpoint also accepts a zone; the service's type just doesn't list it.
      await ridersService.createRiderAdmin({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        vehicleType: form.vehicleType,
        licenseNumber: form.licenseNumber.trim() || undefined,
        ...(form.zoneId !== NO_ZONE ? { zoneId: Number(form.zoneId) } : {}),
      } as Parameters<typeof ridersService.createRiderAdmin>[0]);
      toast.success(`${form.name.trim()} added as a rider`);
      setForm(EMPTY);
      onOpenChange(false);
      onCreated();
    } catch (err) {
      logger.error('❌ Failed to create rider:', err);
      setProblem(err instanceof Error ? err.message : 'Couldn’t add the rider.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add rider</DialogTitle>
          <DialogDescription>New riders start as available.</DialogDescription>
        </DialogHeader>
        <form id="create-rider" onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cr-name">Full name</Label>
              <Input id="cr-name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Kwame Mensah" autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cr-phone">Phone number</Label>
              <Input id="cr-phone" type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+233 50 123 4567" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cr-email">Email</Label>
              <Input id="cr-email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="Optional" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cr-license">Licence number</Label>
              <Input id="cr-license" value={form.licenseNumber} onChange={(e) => set({ licenseNumber: e.target.value })} placeholder="Optional" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cr-vehicle">Vehicle</Label>
              <Select value={form.vehicleType} onValueChange={(v) => set({ vehicleType: v })}>
                <SelectTrigger id="cr-vehicle" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      <v.icon />
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cr-zone">Zone</Label>
              <Select value={form.zoneId} onValueChange={(v) => set({ zoneId: v })}>
                <SelectTrigger id="cr-zone" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ZONE}>Assign later</SelectItem>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={String(z.id)}>
                      {z.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" />
            If this phone number already has a DWOM customer account, that account is turned into a rider account and keeps its existing name.
          </p>
        </form>
        <DialogFooter className="items-center">
          {problem && <p className="mr-auto text-sm text-destructive">{problem}</p>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="create-rider" disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Add rider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
