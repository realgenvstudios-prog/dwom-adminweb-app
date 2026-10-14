import { useState } from 'react';
import { Check, ImageOff, Minus, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatGhs } from '../orders/order-status';
import { categoryIdOf, priceOf } from '../products/product-meta';
import type { Product, ProductCategory } from '../products/ProductTypes';
import type { BundleLine } from './bundle-pricing';

interface VariationGroupData {
  id: number;
  name: string;
  options: Array<{ id: number; label: string }>;
}

interface BundleProductPickerProps {
  products: Product[];
  categories: ProductCategory[];
  lines: BundleLine[];
  onToggle: (productId: number) => void;
  onQuantity: (productId: number, quantity: number) => void;
  onToggleOption: (productId: number, optionId: number, allOptionIds: number[]) => void;
}

const groupsOf = (p: Product) => ((p as Product & { VariationGroup?: VariationGroupData[] }).VariationGroup ?? []);

export default function BundleProductPicker({ products, categories, lines, onToggle, onQuantity, onToggleOption }: BundleProductPickerProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const q = search.trim().toLowerCase();
  const visible = products.filter(
    (p) =>
      (category === null || categoryIdOf(p) === category) &&
      (!q || `${p.nameEnglish} ${p.nameLocal ?? ''}`.toLowerCase().includes(q)),
  );
  const usedCategories = categories.filter((c) => products.some((p) => categoryIdOf(p) === c.id));

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border">
      <div className="space-y-2 border-b bg-muted/30 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="h-8 bg-background pl-8" />
        </div>
        <div className="flex flex-wrap gap-1">
          {[{ id: null as string | null, name: 'All' }, ...usedCategories].map((c) => (
            <button
              key={c.id ?? 'all'}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                category === c.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
        {visible.length === 0 ? (
          <li className="p-6 text-center text-sm text-muted-foreground">{products.length === 0 ? 'No products in the catalog yet.' : 'No products match.'}</li>
        ) : (
          visible.map((p) => {
            const id = Number(p.id);
            const line = lines.find((l) => l.productId === id);
            const groups = groupsOf(p);
            const allOptionIds = groups.flatMap((g) => g.options.map((o) => o.id));
            return (
              <li key={id} className={cn('p-3 transition-colors', line && 'bg-primary/5')}>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onToggle(id)}
                    aria-pressed={!!line}
                    aria-label={line ? `Remove ${p.nameEnglish}` : `Add ${p.nameEnglish}`}
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-[4px] border',
                      line ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background',
                    )}
                  >
                    {line && <Check className="size-3.5" />}
                  </button>
                  <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {p.imageUrl ? <img src={p.imageUrl} alt="" className="size-full object-cover" loading="lazy" /> : <ImageOff className="size-3.5 text-muted-foreground" />}
                  </div>
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onToggle(id)}>
                    <p className="truncate text-sm font-medium">{p.nameEnglish}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatGhs(priceOf(p))} / {p.unitType}
                    </p>
                  </button>
                  {line && (
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="outline" size="icon-xs" onClick={() => onQuantity(id, line.quantity - 1)} disabled={line.quantity <= 1} aria-label="Fewer">
                        <Minus />
                      </Button>
                      <span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span>
                      <Button type="button" variant="outline" size="icon-xs" onClick={() => onQuantity(id, line.quantity + 1)} aria-label="More">
                        <Plus />
                      </Button>
                    </div>
                  )}
                </div>

                {line && groups.length > 0 && (
                  <div className="mt-2 ml-8 space-y-1.5">
                    <p className="text-xs text-muted-foreground">Options customers can pick in this bundle:</p>
                    {groups.map((g) => (
                      <div key={g.id} className="flex flex-wrap items-center gap-1">
                        <span className="mr-1 text-xs text-muted-foreground">{g.name}</span>
                        {g.options.map((o) => {
                          const on = !line.visibleVariationOptionIds?.length || line.visibleVariationOptionIds.includes(o.id);
                          return (
                            <button key={o.id} type="button" onClick={() => onToggleOption(id, o.id, allOptionIds)}>
                              <Badge variant={on ? 'default' : 'outline'} className={cn('font-normal', !on && 'text-muted-foreground line-through')}>
                                {o.label}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
