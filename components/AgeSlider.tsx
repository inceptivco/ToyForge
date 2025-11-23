import React, { useState } from 'react';
import { AGE_GROUPS } from '../constants';

interface AgeSliderProps {
  value: string;
  onChange: (ageGroup: string) => void;
}

export const AgeSlider: React.FC<AgeSliderProps> = ({ value, onChange }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Find current index
  const currentIndex = AGE_GROUPS.findIndex(group => group.id === value);
  const selectedIndex = currentIndex >= 0 ? currentIndex : 2; // Default to teen (index 2)

  const handleClick = (index: number) => {
    onChange(AGE_GROUPS[index].id);
  };

  return (
    <div className="w-full py-2 select-none">
      {/* Selected Age Group Label */}
      <div className="flex justify-between items-baseline mb-4 px-1">
        <div className="text-lg font-bold text-slate-900">
          {AGE_GROUPS[selectedIndex].label}
        </div>
        <div className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
          {AGE_GROUPS[selectedIndex].ageRange}
        </div>
      </div>

      {/* Slider Track Container */}
      <div className="relative px-3 h-8 flex items-center">
        {/* Background Track */}
        <div className="absolute left-3 right-3 h-3 bg-slate-100 rounded-full overflow-hidden">
           {/* Active Track Portion */}
           <div 
            className="h-full bg-brand-500 transition-all duration-300 ease-out origin-left"
            style={{ 
              width: `calc(${selectedIndex / (AGE_GROUPS.length - 1)} * 100%)`
            }}
          />
        </div>

        {/* Slider Positions (Click Targets) */}
        <div className="relative w-full flex justify-between items-center">
          {AGE_GROUPS.map((group, index) => {
            const isSelected = index === selectedIndex;
            const isHovered = index === hoveredIndex;
            const isPast = index <= selectedIndex;

            return (
              <button
                key={group.id}
                onClick={() => handleClick(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="group focus:outline-none"
                title={group.description}
              >
                {/* Dot / Handle */}
                <div 
                  className={`
                    relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
                    ${isSelected 
                      ? 'bg-white border-4 border-brand-500 shadow-md scale-110 z-10' 
                      : isPast
                      ? 'bg-brand-500 border-4 border-brand-500 scale-75'
                      : 'bg-slate-300 border-4 border-slate-100 hover:border-brand-200 hover:bg-brand-200 scale-75'
                    }
                  `}
                >
                  {/* Inner dot for selected state */}
                  {isSelected && <div className="w-1.5 h-1.5 bg-brand-500 rounded-full" />}
                </div>

                {/* Hover Label (Tooltip-like) */}
                <div 
                  className={`
                    absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-wide uppercase transition-all duration-200
                    ${isSelected 
                      ? 'text-brand-600 opacity-100 translate-y-0' 
                      : isHovered
                      ? 'text-slate-500 opacity-100 translate-y-0'
                      : 'text-slate-300 opacity-0 -translate-y-1'
                    }
                  `}
                >
                  {group.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description Text */}
      <div className="text-center mt-8 min-h-[2.5em] text-xs text-slate-500 px-4 leading-relaxed">
        {AGE_GROUPS[hoveredIndex !== null ? hoveredIndex : selectedIndex].description}
      </div>
    </div>
  );
};
