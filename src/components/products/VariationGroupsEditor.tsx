import React from 'react';

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

const TYPE_LABELS: Record<string, string> = {
  weight: 'Weight (e.g. 500g, 1kg, 2kg)',
  quantity: 'Quantity / Packs (e.g. 1 unit, 3 pack)',
  portion: 'Portion (e.g. Full, Half, Quarter)',
  preparation: 'Preparation / Preference (e.g. Soft, Cut)',
};

const TYPE_PRESETS: Record<string, VariationOption[]> = {
  weight: [
    { label: '500g', priceMultiplier: 0.5, isDefault: false },
    { label: '1kg', priceMultiplier: 1.0, isDefault: true },
    { label: '2kg', priceMultiplier: 2.0, isDefault: false },
  ],
  quantity: [
    { label: '1 unit', priceMultiplier: 1.0, isDefault: true },
    { label: '3 pack', priceMultiplier: 3.0, isDefault: false },
    { label: '5 pack', priceMultiplier: 5.0, isDefault: false },
  ],
  portion: [
    { label: 'Full', priceMultiplier: 1.0, isDefault: true },
    { label: 'Half', priceMultiplier: 0.5, isDefault: false },
    { label: 'Quarter', priceMultiplier: 0.25, isDefault: false },
  ],
  preparation: [
    { label: 'As is', extraCharge: 0, isDefault: true },
    { label: 'Cut', extraCharge: 0, isDefault: false },
    { label: 'Cleaned', extraCharge: 0, isDefault: false },
  ],
};

const VariationGroupsEditor: React.FC<Props> = ({ groups, onChange, showPreparationOptions, onShowPrepChange, basePrice }) => {
  const addGroup = (type: VariationGroup['type']) => {
    const existingTypes = groups.map(g => g.type);
    if (existingTypes.includes(type)) return;

    const newGroup: VariationGroup = {
      name: type.charAt(0).toUpperCase() + type.slice(1),
      type,
      required: type !== 'preparation',
      options: TYPE_PRESETS[type] || [],
      sortOrder: groups.length,
    };
    onChange([...groups, newGroup]);
  };

  const removeGroup = (index: number) => {
    onChange(groups.filter((_, i) => i !== index));
  };

  const updateGroup = (index: number, field: keyof VariationGroup, value: any) => {
    const updated = [...groups];
    (updated[index] as any)[field] = value;
    onChange(updated);
  };

  const addOption = (groupIndex: number) => {
    const updated = [...groups];
    const group = updated[groupIndex];
    const isPrep = group.type === 'preparation';
    group.options.push({
      label: '',
      ...(isPrep ? { extraCharge: 0 } : { priceMultiplier: 1.0 }),
      isDefault: false,
      sortOrder: group.options.length,
    });
    onChange(updated);
  };

  const removeOption = (groupIndex: number, optIndex: number) => {
    const updated = groups.map((group, gi) =>
      gi === groupIndex
        ? { ...group, options: group.options.filter((_, i) => i !== optIndex) }
        : group
    );
    onChange(updated);
  };

  const updateOption = (groupIndex: number, optIndex: number, field: keyof VariationOption, value: any) => {
    const updated = groups.map((group, gi) =>
      gi === groupIndex
        ? {
            ...group,
            options: group.options.map((opt, oi) =>
              oi === optIndex ? { ...opt, [field]: value } : opt
            ),
          }
        : group
    );
    onChange(updated);
  };

  const setDefaultOption = (groupIndex: number, optIndex: number) => {
    const updated = [...groups];
    updated[groupIndex].options.forEach((opt, i) => {
      opt.isDefault = i === optIndex;
    });
    onChange(updated);
  };

  const existingTypes = groups.map(g => g.type);
  const availableTypes = (['weight', 'quantity', 'portion', 'preparation'] as const).filter(
    t => !existingTypes.includes(t)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Product Variations</h3>
      </div>

      {/* Existing Groups */}
      {groups.map((group, gi) => (
        <div key={gi} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {TYPE_LABELS[group.type] || group.type}
              </span>
              {group.required && (
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Required</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeGroup(gi)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>

          {group.type === 'preparation' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPreparationOptions}
                onChange={(e) => onShowPrepChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show these preparation options to customers</span>
            </label>
          )}

          {/* Group Name */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Group Name (EN)</label>
              <input
                type="text"
                value={group.name}
                onChange={(e) => updateGroup(gi, 'name', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Group Name (FR)</label>
              <input
                type="text"
                value={group.nameFrench || ''}
                onChange={(e) => updateGroup(gi, 'nameFrench', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Options Table */}
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-1 text-xs font-medium text-gray-500 px-1">
              <div className="col-span-3">Label</div>
              <div className="col-span-3">Label (FR)</div>
              <div className="col-span-2">
                {group.type === 'preparation' ? 'Extra (GHS)' : 'Multiplier'}
              </div>
              <div className="col-span-2">
                {group.type !== 'preparation' && basePrice > 0 
                  ? 'Price Preview' 
                  : ''}
              </div>
              <div className="col-span-1">Default</div>
              <div className="col-span-1"></div>
            </div>

            {group.options.map((opt, oi) => (
              <div key={oi} className="grid grid-cols-12 gap-1 items-center">
                <div className="col-span-3">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => updateOption(gi, oi, 'label', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. 1kg"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={opt.labelFrench || ''}
                    onChange={(e) => updateOption(gi, oi, 'labelFrench', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>
                <div className="col-span-2">
                  {group.type === 'preparation' ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={opt.extraCharge ?? 0}
                      onChange={(e) => updateOption(gi, oi, 'extraCharge', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={opt.priceMultiplier ?? 1}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = raw === '' ? 0 : parseFloat(raw);
                        updateOption(gi, oi, 'priceMultiplier', isNaN(val) ? 0 : val);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
                <div className="col-span-2 text-xs text-gray-500 px-1">
                  {group.type !== 'preparation' && basePrice > 0 
                    ? `GHS ${(basePrice * (opt.priceMultiplier ?? 1)).toFixed(2)}` 
                    : group.type === 'preparation' && opt.extraCharge 
                      ? `+GHS ${opt.extraCharge.toFixed(2)}`
                      : ''}
                </div>
                <div className="col-span-1 flex justify-center">
                  <input
                    type="radio"
                    name={`default-${gi}`}
                    checked={opt.isDefault || false}
                    onChange={() => setDefaultOption(gi, oi)}
                    className="w-3 h-3 text-blue-600"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeOption(gi, oi)}
                    className="text-red-400 hover:text-red-600 text-sm"
                    title="Remove option"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => addOption(gi)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add Option
            </button>
          </div>
        </div>
      ))}

      {/* Add Group Buttons */}
      {availableTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addGroup(type)}
              className="px-3 py-1.5 text-sm bg-white border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600"
            >
              + {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      )}

      {groups.length === 0 && (
        <p className="text-xs text-gray-400 italic">No variations added. Click a button above to add variation options.</p>
      )}
    </div>
  );
};

export default VariationGroupsEditor;
