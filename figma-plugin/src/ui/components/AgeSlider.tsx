/**
 * Age Slider Component - Compact age group selector
 */

import React from 'react';
import type { AgeGroupId } from '../types';
import { AGE_GROUPS } from '../constants';

interface AgeSliderProps {
  value: AgeGroupId;
  onChange: (value: AgeGroupId) => void;
}

export const AgeSlider: React.FC<AgeSliderProps> = ({ value, onChange }) => {
  const currentIndex = AGE_GROUPS.findIndex((g) => g.id === value);

  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-1">
        {AGE_GROUPS.map((group) => (
          <button
            key={group.id}
            onClick={() => onChange(group.id)}
            className={`flex-1 py-1 px-1 text-2xs font-medium rounded transition-all ${
              value === group.id
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title={`${group.ageRange} years`}
          >
            {group.label}
          </button>
        ))}
      </div>
      <div className="text-2xs text-slate-400 text-center">
        {AGE_GROUPS[currentIndex]?.ageRange} years - {AGE_GROUPS[currentIndex]?.description}
      </div>
    </div>
  );
};
