/**
 * Pricing Modal Component - Credit purchase flow
 */

import React, { useState } from 'react';
import { X, Check, Zap, Crown, Loader2, ExternalLink } from 'lucide-react';
import { createCheckout } from '../services/supabase';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete?: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onPurchaseComplete,
}) => {
  const [loading, setLoading] = useState<string | boolean>(false);

  if (!isOpen) return null;

  const handlePurchase = async (packId: string) => {
    setLoading(packId);

    try {
      const result = await createCheckout({ packId, type: 'app' });

      if (result.error) {
        alert('Purchase failed: ' + result.error);
        setLoading(false);
        return;
      }

      if (result.url) {
        // Open Stripe checkout in new tab
        window.open(result.url, '_blank');
        onPurchaseComplete?.();
        onClose();
      }
    } catch (error) {
      alert('Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
          <h2 className="text-base font-bold text-slate-900">Get More Credits</h2>
          <p className="text-2xs text-slate-500 mt-0.5">
            Choose a pack to keep creating amazing characters.
          </p>
        </div>

        {/* Packs */}
        <div className="p-4 space-y-3">
          {/* Starter Pack */}
          <div className="border border-slate-200 rounded-lg p-4 hover:border-brand-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-slate-900">Starter</div>
                <div className="text-2xs text-slate-500">$0.15/generation</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900">$7.50</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-3 text-brand-600 font-semibold text-xs">
              <Zap size={14} className="fill-current" />
              50 Credits
            </div>

            <ul className="space-y-1 mb-3 text-2xs text-slate-600">
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-green-500" /> 50 High-Res Generations
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-green-500" /> Commercial Usage Rights
              </li>
            </ul>

            <button
              onClick={() => handlePurchase('starter')}
              disabled={!!loading}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2 text-xs"
            >
              {loading === 'starter' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  Buy Starter
                  <ExternalLink size={12} />
                </>
              )}
            </button>
          </div>

          {/* Pro Pack */}
          <div className="border border-brand-200 rounded-lg p-4 bg-gradient-to-br from-brand-50/50 to-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-500 text-white text-2xs font-bold px-2 py-0.5 rounded-bl-lg">
              BEST VALUE
            </div>

            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-slate-900">Pro</div>
                <div className="text-2xs text-slate-500">$0.10/generation (33% off!)</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900">$20.00</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-3 text-brand-600 font-semibold text-xs">
              <Crown size={14} className="fill-current" />
              200 Credits
            </div>

            <ul className="space-y-1 mb-3 text-2xs text-slate-600">
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-green-500" /> 200 High-Res Generations
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-green-500" /> Commercial Usage Rights
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-green-500" /> Priority Queue
              </li>
            </ul>

            <button
              onClick={() => handlePurchase('pro')}
              disabled={!!loading}
              className="w-full py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg shadow-md shadow-red-500/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2 text-xs"
            >
              {loading === 'pro' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  Buy Pro
                  <ExternalLink size={12} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100">
          <p className="text-center text-2xs text-slate-400">
            Secure payment via Stripe. Credits never expire.
          </p>
        </div>
      </div>
    </div>
  );
};
