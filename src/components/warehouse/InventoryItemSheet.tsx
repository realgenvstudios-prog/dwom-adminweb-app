import { ArrowLeftRight, PackagePlus, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { formatDateTime } from '../orders/order-status';
import type { StockAction } from './StockDialogs';
import { LEVELS, levelOf, movementMeta, type InventoryRow } from './inventory-meta';

interface InventoryItemSheetProps {
  row: InventoryRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: StockAction) => void;
}

export default function InventoryItemSheet({ row, open, onOpenChange, onAction }: InventoryItemSheetProps) {
  const level = LEVELS[levelOf(row)];
  const unit = row.Product?.unitType ?? 'units';
  // GET /inventory already includes every movement; newest first.
  const movements = [...(row.InventoryMovement ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="gap-2 border-b p-6 pb-4">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SheetTitle className="text-xl">{row.Product?.nameEnglish ?? `Product #${row.productId}`}</SheetTitle>
            <Badge variant="outline" className={cn('gap-1 font-medium', level.badge)}>
              <level.icon className="size-3" />
              {level.label}
            </Badge>
            {row.Product?.active === false && <Badge variant="secondary">Archived</Badge>}
          </div>
          <SheetDescription>
            <span className="text-2xl font-semibold text-foreground tabular-nums">{row.quantity.toLocaleString()}</span> {unit} on hand · reorder at ≤ {row.reorderLevel}, usually{' '}
            {row.reorderQuantity} at a time
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <h3 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">History ({movements.length})</h3>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stock movements recorded yet.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {movements.map((m) => {
                const meta = movementMeta(m.movementType);
                return (
                  <li key={m.id} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                    <meta.icon className={cn('mt-0.5 size-4 shrink-0', meta.tone)} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{meta.label}</p>
                      {(m.reference || m.notes) && <p className="truncate text-xs text-muted-foreground">{[m.reference, m.notes].filter(Boolean).join(' · ')}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn('font-medium tabular-nums', meta.tone)}>
                        {meta.adds ? '+' : '−'}
                        {m.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <SheetFooter className="flex-row flex-wrap justify-end gap-2 border-t p-4">
          <Button variant="ghost" onClick={() => onAction('levels')}>
            <SlidersHorizontal />
            Reorder levels
          </Button>
          <Button variant="outline" onClick={() => onAction('move')}>
            <ArrowLeftRight />
            Record a change
          </Button>
          <Button onClick={() => onAction('receive')}>
            <PackagePlus />
            Receive
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
