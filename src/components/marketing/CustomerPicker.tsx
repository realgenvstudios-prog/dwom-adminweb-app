import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { DirectoryCustomer } from './customer-directory';

interface CustomerPickerProps {
  id?: string;
  customers: DirectoryCustomer[] | null;
  failed?: boolean;
  value: number[];
  onChange: (ids: number[]) => void;
}

/** Search by name or phone and tick as many customers as you like. */
export default function CustomerPicker({ id, customers, failed, value, onChange }: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  const chosen = useMemo(() => new Set(value), [value]);
  const byId = useMemo(() => new Map((customers ?? []).map((c) => [c.id, c])), [customers]);
  const selected = value.map((v) => byId.get(v)).filter((c): c is DirectoryCustomer => !!c);

  const toggle = (cid: number) => onChange(chosen.has(cid) ? value.filter((v) => v !== cid) : [...value, cid]);

  return (
    <div className="grid gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} variant="outline" className="w-full justify-between font-normal" disabled={!customers}>
            <span className="flex items-center gap-2 truncate">
              {!customers && !failed ? <Loader2 className="animate-spin" /> : <UserPlus className="text-muted-foreground" />}
              {failed ? 'Couldn’t load customers' : value.length ? `${value.length} customer${value.length === 1 ? '' : 's'} chosen` : 'Choose customers…'}
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search name or phone…" />
            <CommandList>
              <CommandEmpty>No customer matches.</CommandEmpty>
              <CommandGroup>
                {(customers ?? []).map((c) => {
                  const on = chosen.has(c.id);
                  return (
                    <CommandItem key={c.id} value={`${c.id} ${c.name} ${c.phone} ${c.phone.replace(/\D/g, '')}`} onSelect={() => toggle(c.id)}>
                      <span
                        className={cn(
                          'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                          on ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                        )}
                      >
                        {on && <Check className="size-3 text-current" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{c.phone}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
            <span>{value.length} chosen</span>
            <div className="flex gap-1">
              {value.length > 0 && (
                <Button size="sm" variant="ghost" className="h-7" onClick={() => onChange([])}>
                  Clear
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-7" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
          {selected.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1 rounded-full border bg-muted/50 py-0.5 pr-1 pl-2.5 text-xs">
              {c.name}
              <button
                type="button"
                onClick={() => toggle(c.id)}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Remove ${c.name}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
