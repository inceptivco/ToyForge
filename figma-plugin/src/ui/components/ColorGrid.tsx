/**
 * Color Grid Component - Compact color palette selector
 */

import React from 'react';
import type { ColorPalette } from '../types';

interface ColorGridProps {
  options: ColorPalette[];
  selected: string;
  onSelect: (id: string) => void;
  size?: 'sm' | 'md';
}

export const ColorGrid: React.FC<ColorGridProps> = ({
  options,
  selected,
  onSelect,
  size = 'md',
}) => {
  const sizeClass = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className={`${sizeClass} rounded-full shadow-sm transition-all border-2 hover:scale-110 ${
            selected === opt.id
              ? 'border-brand-500 scale-110 ring-1 ring-brand-300'
              : 'border-transparent hover:border-slate-300'
          }`}
          style={{ backgroundColor: opt.hex }}
          title={opt.name}
        />
      ))}
    </div>
  );
};
