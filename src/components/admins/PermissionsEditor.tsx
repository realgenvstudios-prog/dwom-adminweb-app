import { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { PermissionCatalog } from '../../services/admins/adminTypes';

interface PermissionsEditorProps {
  catalog: PermissionCatalog;
  value: string[];
  onChange: (keys: string[]) => void;
  /** The role's defaults, to mark boxes that differ from them. */
  preset: string[];
  disabled?: boolean;
}

/** Every action an admin can take, grouped by page, as checkboxes. */
export default function PermissionsEditor({ catalog, value, onChange, preset, disabled }: PermissionsEditorProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Set<string>>(() => new Set(catalog.groups.filter((g) => g.permissions.some((p) => value.includes(p.key))).map((g) => g.path)));
  const chosen = useMemo(() => new Set(value), [value]);
  const defaults = useMemo(() => new Set(preset), [preset]);
  const q = query.trim().toLowerCase();

  const set = (keys: string[], on: boolean) => {
    const next = new Set(chosen);
    keys.forEach((k) => (on ? next.add(k) : next.delete(k)));
    onChange([...next]);
  };
  const toggleOpen = (path: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const groups = catalog.groups
    .map((g) => ({ ...g, shown: q ? g.permissions.filter((p) => p.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) : g.permissions }))
    .filter((g) => g.shown.length > 0);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find an action, e.g. assign rider" className="h-8 pl-8 text-sm" />
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {value.length} of {catalog.groups.reduce((n, g) => n + g.permissions.length, 0)} allowed
        </p>
      </div>

      <div className="grid gap-2">
        {groups.map((g) => {
          const keys = g.permissions.map((p) => p.key);
          const on = keys.filter((k) => chosen.has(k)).length;
          const all = on === keys.length;
          const expanded = q.length > 0 || open.has(g.path);
          return (
            <section key={g.path} className="rounded-lg border">
              <div className="flex items-center gap-3 px-3 py-2">
                <Checkbox
                  checked={all ? true : on > 0 ? 'indeterminate' : false}
                  onCheckedChange={() => set(keys, !all)}
                  disabled={disabled}
                  aria-label={`Everything in ${g.label}`}
                />
                <button type="button" className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left" onClick={() => toggleOpen(g.path)} aria-expanded={expanded}>
                  <span className="font-medium">{g.label}</span>
                  <span className="flex items-center gap-2">
                    <span className={cn('text-xs tabular-nums', on ? 'text-foreground' : 'text-muted-foreground')}>
                      {on}/{keys.length}
                    </span>
                    <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
                  </span>
                </button>
              </div>
              {expanded && (
                <ul className="grid gap-x-4 gap-y-1 border-t px-3 py-2.5 sm:grid-cols-2">
                  {g.shown.map((p) => {
                    const isOn = chosen.has(p.key);
                    const differs = isOn !== defaults.has(p.key);
                    return (
                      <li key={p.key}>
                        <label className={cn('flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted', disabled && 'cursor-default opacity-60')}>
                          <Checkbox className="mt-0.5" checked={isOn} onCheckedChange={(v) => set([p.key], v === true)} disabled={disabled} />
                          <span className="min-w-0 flex-1">{p.label}</span>
                          {differs && (
                            <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[10px] font-normal text-muted-foreground">
                              {isOn ? 'added' : 'removed'}
                            </Badge>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
        {groups.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No action matches “{query}”.</p>}
      </div>
    </div>
  );
}
