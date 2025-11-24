/**
 * History Panel Component - Recent generations with re-insert
 */

import React from 'react';
import { History, Trash2, Plus, Image as ImageIcon } from 'lucide-react';
import type { HistoryItem } from '../types';

interface HistoryPanelProps {
  history: HistoryItem[];
  onReinsert: (item: HistoryItem) => void;
  onClear: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onReinsert,
  onClear,
}) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
          <History size={20} className="text-slate-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 mb-1">No History Yet</h3>
        <p className="text-2xs text-slate-500">
          Your generated characters will appear here for easy re-insertion.
        </p>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getConfigSummary = (item: HistoryItem) => {
    const { config } = item;
    return `${config.gender === 'male' ? 'M' : 'F'} · ${config.ageGroup || 'teen'} · ${config.hairStyle}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <History size={14} />
          Recent ({history.length})
        </div>
        <button
          onClick={onClear}
          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
          title="Clear history"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* History Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
          >
            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt="Generated character"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={16} className="text-slate-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-2xs font-medium text-slate-700 truncate">
                {getConfigSummary(item)}
              </div>
              <div className="text-2xs text-slate-400">{formatTime(item.timestamp)}</div>
            </div>

            {/* Insert Button */}
            <button
              onClick={() => onReinsert(item)}
              className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:text-brand-600 hover:border-brand-300 transition-colors opacity-0 group-hover:opacity-100"
              title="Insert on canvas"
            >
              <Plus size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
