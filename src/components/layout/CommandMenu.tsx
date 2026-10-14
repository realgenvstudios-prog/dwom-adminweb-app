import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, LogOut, Package, ShoppingBag, User } from 'lucide-react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import type { NavGroup } from '@/config/navigation';
import { loadSearchIndex, matchHits, type SearchHit, type SearchIndex } from './search-index';

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: NavGroup[];
  onLogout: () => void;
}

export default function CommandMenu({ open, onOpenChange, groups, onLogout }: CommandMenuProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [indexing, setIndexing] = useState(false);

  // Only search what this admin can open: the groups are already role-filtered.
  const paths = new Set(groups.flatMap((g) => g.items.map((i) => i.path)));
  const [canOrders, canCustomers, canProducts] = [paths.has('/orders'), paths.has('/customers'), paths.has('/catalog')];
  const allowed = useMemo(() => ({ orders: canOrders, customers: canCustomers, products: canProducts }), [canOrders, canCustomers, canProducts]);
  const searchable = allowed.orders || allowed.customers || allowed.products;

  useEffect(() => {
    if (!open || !searchable) return;
    let cancelled = false;
    const t = setTimeout(() => {
      setIndexing(true);
      void loadSearchIndex(allowed)
        .then((i) => !cancelled && setIndex(i))
        .finally(() => !cancelled && setIndexing(false));
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, searchable, allowed]);

  const results = useMemo(
    () =>
      index
        ? [
            { heading: 'Orders', icon: ShoppingBag, hits: matchHits(index.orders, query) },
            { heading: 'Customers', icon: User, hits: matchHits(index.customers, query) },
            { heading: 'Products', icon: Package, hits: matchHits(index.products, query) },
          ].filter((r) => r.hits.length > 0)
        : [],
    [index, query],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) setQuery('');
    onOpenChange(next);
  };

  const run = (action: () => void) => {
    handleOpenChange(false);
    action();
  };

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} title="Search" description="Jump to a page, order, customer or product">
      <Command>
        <CommandInput value={query} onValueChange={setQuery} placeholder={searchable ? 'Search pages, orders, customers, products…' : 'Search pages…'} />
        <CommandList>
          <CommandEmpty>{indexing ? 'Searching…' : 'No results found.'}</CommandEmpty>
          {results.map((r) => (
            <CommandGroup key={r.heading} heading={r.heading}>
              {r.hits.map((hit: SearchHit) => (
                <CommandItem key={hit.href} value={`${hit.href} ${hit.haystack} ${query}`} onSelect={() => run(() => navigate(hit.href))}>
                  <r.icon />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{hit.title}</span>
                    <span className="truncate text-xs text-muted-foreground">{hit.subtitle}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          {indexing && !index && query.trim().length >= 2 && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Loading orders, customers and products…
            </div>
          )}
          {groups.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.flatMap((item) =>
                item.children
                  ? item.children.map((sub) => (
                      <CommandItem key={sub.href} value={`${group.label} ${item.label} ${sub.label}`} onSelect={() => run(() => navigate(sub.href))}>
                        <item.icon />
                        <span className="text-muted-foreground">{item.label}</span>
                        <ChevronRight className="size-3 text-muted-foreground" />
                        <span>{sub.label}</span>
                      </CommandItem>
                    ))
                  : [
                      <CommandItem key={item.path} value={`${group.label} ${item.label}`} onSelect={() => run(() => navigate(item.path))}>
                        <item.icon />
                        <span>{item.label}</span>
                      </CommandItem>,
                    ],
              )}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Account">
            <CommandItem value="log out sign out" onSelect={() => run(onLogout)}>
              <LogOut />
              <span>Log out</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
