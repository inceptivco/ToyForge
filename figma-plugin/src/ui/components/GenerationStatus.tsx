/**
 * Generation Status Component - Progress indicator
 */

import React from 'react';
import { Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import type { GenerationState } from '../types';

interface GenerationStatusProps {
  state: GenerationState;
}

const STATUS_CONFIG = {
  idle: { icon: null, color: 'text-slate-400', bgColor: 'bg-slate-50' },
  initiating: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-50', animate: true },
  generating: { icon: Sparkles, color: 'text-purple-500', bgColor: 'bg-purple-50', animate: true },
  processing: { icon: Loader2, color: 'text-amber-500', bgColor: 'bg-amber-50', animate: true },
  placing: { icon: Loader2, color: 'text-green-500', bgColor: 'bg-green-50', animate: true },
  complete: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  error: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
};

export const GenerationStatus: React.FC<GenerationStatusProps> = ({ state }) => {
  if (state.status === 'idle') return null;

  const config = STATUS_CONFIG[state.status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg ${config.bgColor}`}>
      {Icon && (
        <Icon
          size={14}
          className={`${config.color} ${config.animate ? 'animate-spin' : ''}`}
        />
      )}
      <span className={`text-2xs font-medium ${config.color}`}>{state.message}</span>
    </div>
  );
};
