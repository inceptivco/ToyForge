/**
 * Accessory Selector Component - Multi-select with conflict handling
 */

import React from 'react';
import type { AccessoryId } from '../types';
import { ACCESSORIES, ACCESSORY_CONFLICTS } from '../constants';

interface AccessorySelectorProps {
  selected: AccessoryId[];
  onChange: (accessories: AccessoryId[]) => void;
}

export const AccessorySelector: React.FC<AccessorySelectorProps> = ({
  selected,
  onChange,
}) => {
  const handleToggle = (id: string) => {
    let newAccessories = [...selected];

    if (id === 'none') {
      newAccessories = ['none'];
    } else {
      // Remove 'none' if selecting something else
      newAccessories = newAccessories.filter((a) => a !== 'none');

      if (selected.includes(id as AccessoryId)) {
        // Deselecting
        newAccessories = newAccessories.filter((a) => a !== id);
      } else {
        // Selecting - remove conflicts first
        const conflicts = ACCESSORY_CONFLICTS[id] || [];
        newAccessories = newAccessories.filter((a) => !conflicts.includes(a));
        newAccessories.push(id as AccessoryId);
      }

      // Default to 'none' if empty
      if (newAccessories.length === 0) {
        newAccessories = ['none'];
      }
    }

    onChange(newAccessories);
  };

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {ACCESSORIES.map((opt) => {
        const isSelected = selected.includes(opt.id as AccessoryId);
        const conflicts = ACCESSORY_CONFLICTS[opt.id] || [];
        const hasConflict = conflicts.some((c) => selected.includes(c as AccessoryId));

        return (
          <button
            key={opt.id}
            onClick={() => handleToggle(opt.id)}
            disabled={hasConflict && !isSelected}
            className={`py-1.5 px-2 rounded-md text-2xs font-medium transition-all border ${
              isSelected
                ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
                : hasConflict
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-slate-50'
            }`}
            title={hasConflict && !isSelected ? 'Conflicts with current selection' : opt.label}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
