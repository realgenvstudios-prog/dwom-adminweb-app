import { useCallback, useEffect, useState } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { Loader2, MapPin, Pencil, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import adminApiClient from '../../../services/apiClient';
import { can } from '../../../config/permissions';
import PlaceSearch from '../../delivery/PlaceSearch';

export interface PickupPoint {
  id: number;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  active: boolean;
  isDefault: boolean;
}

const ACCRA = { lat: 5.6037, lng: -0.187 };

function PointDialog({ point, onClose, onSaved }: { point: PickupPoint | null; onClose: () => void; onSaved: () => void }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '', id: 'dwom-admin-google-maps' });
  const [form, setForm] = useState({
    name: point?.name ?? '',
    address: point?.address ?? '',
    notes: point?.notes ?? '',
    lat: point?.lat ?? null,
    lng: point?.lng ?? null,
    isDefault: point?.isDefault ?? false,
  });
  const [saving, setSaving] = useState(false);
  const pin = form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng } : null;

  const save = async () => {
    if (!form.name.trim() || !form.address.trim()) return toast.error('Add a name and an address.');
    if (!pin) return toast.error('Drop the pin on the map so riders can navigate there.');
    setSaving(true);
    try {
      const body = { ...form, notes: form.notes.trim() || null };
      if (point) await adminApiClient.patch(`/pickup-points/${point.id}`, body);
      else await adminApiClient.post('/pickup-points', body);
      toast.success(point ? 'Pickup point saved' : 'Pickup point added');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{point ? 'Edit pickup point' : 'Add pickup point'}</DialogTitle>
          <DialogDescription>Riders see the name, address and notes, and navigate to the pin.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="pp-name">Name</Label>
            <Input id="pp-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. DWOM Hub, Makola" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pp-address">Address</Label>
            <Input id="pp-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, area" />
          </div>
          <div className="grid gap-2">
            <Label>Map pin</Label>
            <PlaceSearch
              id="pp-search"
              placeholder="Search a place to move the pin"
              onPick={(p) => setForm((f) => ({ ...f, lat: p.lat, lng: p.lng, address: f.address || p.label }))}
            />
            <div className="h-64 overflow-hidden rounded-lg border">
              {isLoaded ? (
                <GoogleMap
                  mapContainerClassName="size-full"
                  center={pin ?? ACCRA}
                  zoom={pin ? 16 : 12}
                  options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
                  onClick={(e) => e.latLng && setForm((f) => ({ ...f, lat: e.latLng!.lat(), lng: e.latLng!.lng() }))}
                >
                  {pin && <MarkerF position={pin} draggable onDragEnd={(e) => e.latLng && setForm((f) => ({ ...f, lat: e.latLng!.lat(), lng: e.latLng!.lng() }))} />}
                </GoogleMap>
              ) : (
                <Skeleton className="size-full" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{pin ? `Pin at ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}. Drag it to adjust.` : 'Click the map to drop the pin.'}</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pp-notes">Notes for riders</Label>
            <Textarea id="pp-notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Enter through gate 2, ask for Ama." />
          </div>
          {!point?.isDefault && (
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div>
                <Label htmlFor="pp-default">Default pickup point</Label>
                <p className="text-xs text-muted-foreground">New orders are collected from here.</p>
              </div>
              <Switch id="pp-default" checked={form.isDefault} onCheckedChange={(v) => setForm({ ...form, isDefault: v })} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Where riders collect orders. One default now; more as DWOM grows. */
export default function PickupPointsTab() {
  const [points, setPoints] = useState<PickupPoint[] | null>(null);
  const [editing, setEditing] = useState<PickupPoint | 'new' | null>(null);
  const manage = can('pickupPoints.manage');

  const load = useCallback(async () => {
    try {
      setPoints(await adminApiClient.get<PickupPoint[]>('/pickup-points'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t load pickup points');
      setPoints([]);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const toggleActive = async (p: PickupPoint) => {
    try {
      await adminApiClient.patch(`/pickup-points/${p.id}`, { active: !p.active });
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t change it');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Riders collect packed orders here and navigate to the pin.</p>
        {manage && (
          <Button onClick={() => setEditing('new')}>
            <Plus />
            Add pickup point
          </Button>
        )}
      </div>

      {!points && <Skeleton className="h-28 w-full" />}
      {points?.map((p) => (
        <Card key={p.id} className="gap-0 py-0">
          <CardContent className="flex flex-wrap items-start gap-4 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <MapPin className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{p.name}</p>
                {p.isDefault && (
                  <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700">
                    <Star className="size-3" />
                    Default
                  </Badge>
                )}
                {!p.active && <Badge variant="outline">Off</Badge>}
                {p.lat == null && (
                  <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700">
                    No map pin
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{p.address}</p>
              {p.notes && <p className="text-sm">{p.notes}</p>}
            </div>
            {manage && (
              <div className="flex items-center gap-3">
                {!p.isDefault && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Switch checked={p.active} onCheckedChange={() => void toggleActive(p)} aria-label={`${p.name} in use`} />
                    In use
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => setEditing(p)}>
                  <Pencil />
                  Edit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {editing && <PointDialog point={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => void load()} />}
    </div>
  );
}
