import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface VariationOption {
  label: string;
  labelFrench?: string;
  priceMultiplier?: number;
  extraCharge?: number;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface VariationGroup {
  name: string;
  nameFrench?: string;
  type: 'weight' | 'quantity' | 'portion' | 'preparation';
  required?: boolean;
  sortOrder?: number;
  options: VariationOption[];
}

interface Props {
  groups: VariationGroup[];
  onChange: (groups: VariationGroup[]) => void;
  showPreparationOptions: boolean;
  onShowPrepChange: (show: boolean) => void;
  basePrice: number;
}

type GroupType = VariationGroup['type'];

const TYPES: Record<GroupType, { label: string; example: string }> = {
  weight: { label: 'Weight', example: 'e.g. 500g, 1kg, 2kg' },
  quantity: { label: 'Quantity', example: 'e.g. 1 unit, 3 pack' },
  portion: { label: 'Portion', example: 'e.g. Full, Half, Quarter' },
  preparation: { label: 'Preparation', example: 'e.g. As is, Cut, Cleaned' },
};

const PRESETS: Record<GroupType, VariationOption[]> = {
  weight: [
    { label: '500g', priceMultiplier: 0.5 },
    { label: '1kg', priceMultiplier: 1, isDefault: true },
    { label: '2kg', priceMultiplier: 2 },
  ],
  quantity: [
    { label: '1 unit', priceMultiplier: 1, isDefault: true },
    { label: '3 pack', priceMultiplier: 3 },
    { label: '5 pack', priceMultiplier: 5 },
  ],
  portion: [
    { label: 'Full', priceMultiplier: 1, isDefault: true },
    { label: 'Half', priceMultiplier: 0.5 },
    { label: 'Quarter', priceMultiplier: 0.25 },
  ],
  preparation: [
    { label: 'As is', extraCharge: 0, isDefault: true },
    { label: 'Cut', extraCharge: 0 },
    { label: 'Cleaned', extraCharge: 0 },
  ],
};

// Every update returns new objects — the presets above are copied, never
// shared, so editing one product's options can't leak into the next one.
const VariationGroupsEditor: React.FC<Props> = ({ groups, onChange, showPreparationOptions, onShowPrepChange, basePrice }) => {
  const setGroup = (gi: number, patch: Partial<VariationGroup>) =>
    onChange(groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));

  const setOptions = (gi: number, fn: (opts: VariationOption[]) => VariationOption[]) =>
    onChange(groups.map((g, i) => (i === gi ? { ...g, options: fn(g.options) } : g)));

  const addGroup = (type: GroupType) =>
    onChange([
      ...groups,
      {
        name: TYPES[type].label,
        type,
        required: type !== 'preparation',
        sortOrder: groups.length,
        options: PRESETS[type].map((o, i) => ({ isDefault: false, ...o, sortOrder: i })),
      },
    ]);

  const available = (Object.keys(TYPES) as GroupType[]).filter((t) => !groups.some((g) => g.type === t));

  return (
    <div className="grid gap-4">
      <div>
        <h3 className="text-sm font-medium">Variations</h3>
        <p className="text-xs text-muted-foreground">Sizes or preparation choices the customer picks from. Prices scale from the base price.</p>
      </div>

      {groups.map((group, gi) => {
        const prep = group.type === 'preparation';
        return (
          <div key={group.type} className="grid gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{TYPES[group.type].label}</span>
                <span className="text-xs text-muted-foreground">{TYPES[group.type].example}</span>
                {group.required && <Badge variant="secondary">Required</Badge>}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange(groups.filter((_, i) => i !== gi))}
                aria-label={`Remove ${TYPES[group.type].label} group`}
              >
                <Trash2 />
              </Button>
            </div>

            {prep && (
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={showPreparationOptions} onCheckedChange={onShowPrepChange} />
                Show these preparation options to customers
              </label>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Group name (EN)</Label>
                <Input className="h-8 bg-background" value={group.name} onChange={(e) => setGroup(gi, { name: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Group name (FR)</Label>
                <Input
                  className="h-8 bg-background"
                  value={group.nameFrench ?? ''}
                  onChange={(e) => setGroup(gi, { nameFrench: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="grid min-w-[480px] gap-1.5">
                <div className="grid grid-cols-[1fr_1fr_88px_88px_52px_32px] gap-2 px-0.5 text-xs text-muted-foreground">
                  <span>Label</span>
                  <span>Label (FR)</span>
                  <span>{prep ? 'Extra (GH₵)' : 'Multiplier'}</span>
                  <span>{prep ? '' : 'Price'}</span>
                  <span className="text-center">Default</span>
                  <span />
                </div>
                {group.options.map((opt, oi) => (
                  <div key={oi} className="grid grid-cols-[1fr_1fr_88px_88px_52px_32px] items-center gap-2">
                    <Input
                      className="h-8 bg-background"
                      value={opt.label}
                      placeholder="e.g. 1kg"
                      onChange={(e) => setOptions(gi, (os) => os.map((o, i) => (i === oi ? { ...o, label: e.target.value } : o)))}
                    />
                    <Input
                      className="h-8 bg-background"
                      value={opt.labelFrench ?? ''}
                      placeholder="Optional"
                      onChange={(e) => setOptions(gi, (os) => os.map((o, i) => (i === oi ? { ...o, labelFrench: e.target.value } : o)))}
                    />
                    <Input
                      className="h-8 bg-background tabular-nums"
                      type="number"
                      step="0.01"
                      min="0"
                      value={prep ? (opt.extraCharge ?? 0) : (opt.priceMultiplier ?? 1)}
                      onChange={(e) => {
                        const v = Number.parseFloat(e.target.value);
                        const n = Number.isFinite(v) ? v : 0;
                        setOptions(gi, (os) => os.map((o, i) => (i === oi ? { ...o, ...(prep ? { extraCharge: n } : { priceMultiplier: n }) } : o)));
                      }}
                    />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {prep
                        ? opt.extraCharge
                          ? `+₵${opt.extraCharge.toFixed(2)}`
                          : ''
                        : basePrice > 0
                          ? `₵${(basePrice * (opt.priceMultiplier ?? 1)).toFixed(2)}`
                          : ''}
                    </span>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={!!opt.isDefault}
                        aria-label={`Make ${opt.label || 'this option'} the default`}
                        onClick={() => setOptions(gi, (os) => os.map((o, i) => ({ ...o, isDefault: i === oi })))}
                        className={cn(
                          'flex size-4 items-center justify-center rounded-full border',
                          opt.isDefault ? 'border-primary' : 'border-input bg-background',
                        )}
                      >
                        {opt.isDefault && <span className="size-2 rounded-full bg-primary" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setOptions(gi, (os) => os.filter((_, i) => i !== oi))}
                      aria-label="Remove option"
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="justify-self-start"
              onClick={() =>
                setOptions(gi, (os) => [
                  ...os,
                  { label: '', ...(prep ? { extraCharge: 0 } : { priceMultiplier: 1 }), isDefault: false, sortOrder: os.length },
                ])
              }
            >
              <Plus />
              Add option
            </Button>
          </div>
        );
      })}

      {available.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {available.map((type) => (
            <Button key={type} type="button" variant="outline" size="sm" className="border-dashed" onClick={() => addGroup(type)}>
              <Plus />
              {TYPES[type].label}
            </Button>
          ))}
        </div>
      )}
      {groups.length === 0 && <p className="text-xs text-muted-foreground">No variations. The product sells at its base price.</p>}
    </div>
  );
};

export default VariationGroupsEditor;
