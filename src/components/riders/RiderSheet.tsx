import { ExternalLink, MapPin, Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { formatGhs } from '../orders/order-status';
import { formatDate, initialsOf } from '../customers/CustomerTypes';
import { num, riderStatusMeta, vehicleMeta } from './rider-meta';
import type { Rider } from './useRidersData';

interface RiderSheetProps {
  rider: Rider;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignZone: () => void;
  onToggleActive: () => void;
}

function Stat({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{children ?? value}</div>
    </div>
  );
}

export default function RiderSheet({ rider, open, onOpenChange, onAssignZone, onToggleActive }: RiderSheetProps) {
  const status = riderStatusMeta(rider.status);
  const vehicle = vehicleMeta(rider.vehicleType);
  const hasLocation = rider.currentLat != null && rider.currentLng != null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="gap-3 border-b p-6 pb-4">
          <div className="flex items-center gap-4 pr-8">
            <Avatar className="size-14">
              <AvatarFallback className="text-lg">{initialsOf(rider.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <SheetTitle className="text-xl">{rider.name}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2">
                {rider.isActive ? (
                  <Badge variant="outline" className={cn('gap-1 font-medium', status.badge)}>
                    <status.icon className="size-3" />
                    {status.label}
                  </Badge>
                ) : (
                  <Badge variant="outline">Deactivated</Badge>
                )}
                <span className="flex items-center gap-1">
                  <vehicle.icon className="size-3.5" />
                  {vehicle.label}
                </span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Deliveries" value={num(rider.totalDeliveries).toLocaleString()} />
            <Stat label="Earnings" value={formatGhs(num(rider.totalEarnings))} />
            <Stat label="Rating">
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                {num(rider.rating).toFixed(1)}
              </span>
            </Stat>
            <Stat label="Active orders" value={String(rider.activeOrders ?? 0)} />
          </div>

          <dl className="divide-y rounded-lg border text-sm">
            {[
              ['Phone', rider.phone || 'None'],
              ['Email', rider.email || 'None'],
              ['Zone', rider.zoneId != null ? rider.zone : 'Not assigned'],
              ['Licence', rider.licenseNumber || 'None'],
              ['Payout account name', rider.accountName || 'Not provided'],
              ['Rider since', formatDate(rider.createdAt)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right break-words">{value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt className="text-muted-foreground">Last known location</dt>
              <dd className="text-right">
                {hasLocation ? (
                  <a
                    href={`https://www.google.com/maps?q=${rider.currentLat},${rider.currentLng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    <MapPin className="size-3.5" />
                    Open in Maps
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  'Not shared'
                )}
              </dd>
            </div>
          </dl>
        </div>

        <SheetFooter className="flex-row justify-between border-t p-4">
          <Button variant="ghost" className={rider.isActive ? 'text-destructive hover:text-destructive' : ''} onClick={onToggleActive}>
            {rider.isActive ? 'Deactivate' : 'Reactivate'}
          </Button>
          {rider.isActive && (
            <Button onClick={onAssignZone}>
              <MapPin />
              {rider.zoneId == null ? 'Assign zone' : 'Change zone'}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
