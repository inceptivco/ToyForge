/**
 * Asset Grid Component - Compact asset selector
 */

import React from 'react';
import type { AssetOption } from '../types';

interface AssetGridProps {
  options: AssetOption[];
  selected: string;
  onSelect: (id: string) => void;
  columns?: 2 | 3;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  options,
  selected,
  onSelect,
  columns = 2,
}) => {
  return (
    <div className={`grid gap-1.5 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className={`py-1.5 px-2 rounded-md text-2xs font-medium text-left transition-all border ${
            selected === opt.id
              ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-slate-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
