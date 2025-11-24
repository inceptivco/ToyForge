/**
 * CharacterForge Figma Plugin - Main App Component
 */

import React, { useState, useEffect } from 'react';
import {
  Wand2,
  Shuffle,
  RotateCcw,
  History,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useConfig } from './hooks/useConfig';
import { useGeneration } from './hooks/useGeneration';
import { SignInView } from './components/SignInView';
import { ConfigPanel } from './components/ConfigPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { PricingModal } from './components/PricingModal';
import { CreditDisplay } from './components/CreditDisplay';
import { GenerationStatus } from './components/GenerationStatus';

type ViewMode = 'config' | 'history';

export const App: React.FC = () => {
  const { user, profile, isLoading, isAuthenticated, pendingAuth, isPolling, signIn, signOut, cancelAuth, refreshProfile } = useAuth();
  const { config, availableHairStyles, availableClothing, updateConfig, handleGenderChange, randomize, reset } = useConfig();
  const { generationState, history, generate, reinsertFromHistory, clearHistory, resetState } = useGeneration();

  const [viewMode, setViewMode] = useState<ViewMode>('config');
  const [showPricing, setShowPricing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Reset generation state after a delay
  useEffect(() => {
    if (generationState.status === 'complete' || generationState.status === 'error') {
      const timer = setTimeout(resetState, 3000);
      return () => clearTimeout(timer);
    }
  }, [generationState.status, resetState]);

  // Handle generation
  const handleGenerate = async () => {
    if (!isAuthenticated) return;

    const credits = profile?.credits_balance ?? 0;
    if (credits < 1) {
      setShowPricing(true);
      return;
    }

    await generate(config);
    // Refresh profile to update credits
    await refreshProfile();
  };

  const isGenerating = ['initiating', 'generating', 'processing', 'placing'].includes(generationState.status);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-brand-500 mb-2" />
        <span className="text-xs text-slate-500">Loading...</span>
      </div>
    );
  }

  // Not authenticated - show sign in (or pending auth)
  if (!isAuthenticated) {
    return (
      <SignInView
        onSignIn={signIn}
        onCancelAuth={cancelAuth}
        isLoading={isLoading}
        pendingAuth={pendingAuth}
        isPolling={isPolling}
      />
    );
  }

  const credits = profile?.credits_balance ?? 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
            <Wand2 size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm text-slate-900">CharacterForge</span>
        </div>

        <div className="flex items-center gap-2">
          <CreditDisplay
            credits={credits}
            onClick={() => setShowPricing(true)}
            compact
          />

          {/* Settings dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Settings size={14} />
            </button>

            {showSettings && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSettings(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-2xs text-slate-500 truncate">{user?.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPricing(true);
                      setShowSettings(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Buy Credits
                  </button>
                  <button
                    onClick={() => {
                      signOut();
                      setShowSettings(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut size={12} />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setViewMode('config')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-all ${
            viewMode === 'config'
              ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-500 -mb-px'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wand2 size={12} />
          Create
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-all ${
            viewMode === 'history'
              ? 'text-brand-600 bg-brand-50 border-b-2 border-brand-500 -mb-px'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <History size={12} />
          History
          {history.length > 0 && (
            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-2xs rounded-full">
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'config' ? (
          <ConfigPanel
            config={config}
            availableHairStyles={availableHairStyles}
            availableClothing={availableClothing}
            onConfigChange={updateConfig}
            onGenderChange={handleGenderChange}
          />
        ) : (
          <HistoryPanel
            history={history}
            onReinsert={reinsertFromHistory}
            onClear={clearHistory}
          />
        )}
      </div>

      {/* Generation Status */}
      {generationState.status !== 'idle' && (
        <div className="px-3 py-2 border-t border-slate-200">
          <GenerationStatus state={generationState} />
        </div>
      )}

      {/* Action Bar */}
      {viewMode === 'config' && (
        <div className="p-3 border-t border-slate-200 bg-white space-y-2">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={randomize}
              disabled={isGenerating}
              className="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-2xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
              title="Randomize"
            >
              <Shuffle size={12} />
              Random
            </button>
            <button
              onClick={reset}
              disabled={isGenerating}
              className="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-2xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
              title="Reset to defaults"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>

          {/* Transparent Background */}
          <label className="flex items-center justify-between cursor-pointer group p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div>
              <div className="font-medium text-slate-800 text-xs">Transparent BG</div>
              <div className="text-2xs text-slate-500">Remove background</div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={config.transparent !== false}
                onChange={(e) => updateConfig({ transparent: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
            </div>
          </label>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || credits < 1}
            className={`w-full py-2.5 rounded-lg font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all text-xs ${
              isGenerating || credits < 1
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : credits < 1 ? (
              'No Credits - Buy More'
            ) : (
              <>
                <Wand2 size={16} />
                Generate & Place on Canvas
              </>
            )}
          </button>

          {credits < 1 && (
            <button
              onClick={() => setShowPricing(true)}
              className="w-full py-2 text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors"
            >
              Get more credits to continue creating
            </button>
          )}
        </div>
      )}

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onPurchaseComplete={refreshProfile}
      />
    </div>
  );
};
