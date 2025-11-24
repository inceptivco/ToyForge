/**
 * Credit Display Component - Shows current credit balance
 */

import React from 'react';
import { Zap } from 'lucide-react';

interface CreditDisplayProps {
  credits: number;
  onClick?: () => void;
  compact?: boolean;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({
  credits,
  onClick,
  compact = false,
}) => {
  if (compact) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-full text-amber-700 font-semibold text-2xs hover:bg-amber-100 transition-all"
        title="Click to buy more credits"
      >
        <Zap size={12} className="fill-current" />
        {credits}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg text-amber-700 font-semibold text-xs hover:bg-amber-100 transition-all group"
      title="Click to buy more credits"
    >
      <Zap size={14} className="fill-current" />
      <span>{credits} credits</span>
      <span className="text-amber-500 text-2xs group-hover:text-amber-700">+ Buy</span>
    </button>
  );
};
