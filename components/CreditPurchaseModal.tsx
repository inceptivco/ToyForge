import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { X, Check, Zap, Crown, Loader2 } from 'lucide-react';
import { analytics } from '../utils/analytics';

interface CreditPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    type?: 'app' | 'api';
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({ isOpen, onClose, type = 'app' }) => {
    const [amount, setAmount] = useState<string>('5');
    const [loading, setLoading] = useState<boolean | string>(false);

    if (!isOpen) return null;

    const isApi = type === 'api';
    const rate = isApi ? 0.10 : 0.15;
    
    // Calculate credits based on amount
    // API: $0.10 flat rate
    // App: $0.15 rate
    const credits = Math.floor(parseFloat(amount || '0') / rate);

    const handlePurchase = async (customAmount?: number, packId?: string) => {
        // Calculate actual purchase amount and credits based on pack or custom amount
        let actualAmount: number;
        let actualCredits: number;
        
        if (packId) {
            // Pack prices based on type (API vs App rate)
            // Starter: $7.50, Pro: $20.00
            // Credits calculated using the appropriate rate
            if (packId === 'starter') {
                actualAmount = 7.50;
                actualCredits = Math.floor(actualAmount / rate);
            } else if (packId === 'pro') {
                actualAmount = 20.00;
                actualCredits = Math.floor(actualAmount / rate);
            } else {
                // Fallback to custom amount calculation if packId is unknown
                actualAmount = customAmount || parseFloat(amount);
                // Validate fallback amount to prevent NaN values
                if (isNaN(actualAmount) || actualAmount < 5) {
                    alert('Invalid pack ID or amount. Minimum purchase amount is $5.00');
                    return;
                }
                actualCredits = Math.floor(actualAmount / rate);
            }
        } else {
            // Custom amount purchase
            actualAmount = customAmount || parseFloat(amount);
            if (isNaN(actualAmount) || actualAmount < 5) {
                alert('Minimum purchase amount is $5.00');
                return;
            }
            actualCredits = Math.floor(actualAmount / rate);
        }

        // Final validation to ensure we never pass invalid values to analytics
        if (isNaN(actualAmount) || isNaN(actualCredits) || actualAmount <= 0 || actualCredits <= 0) {
            console.error('[CreditPurchaseModal] Invalid purchase values calculated:', { actualAmount, actualCredits, packId, customAmount, amount });
            alert('Invalid purchase amount. Please try again.');
            return;
        }

        setLoading(packId || true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Please sign in first");

            console.log('[CreditPurchaseModal] Invoking create-checkout:', { packId, amount: actualAmount, type });
            
            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: packId ? { packId, type } : { amount: actualAmount, type }, 
            });

            console.log('[CreditPurchaseModal] Response:', { data, error });

            if (error) {
                console.error('[CreditPurchaseModal] Error from function:', error);
                throw error;
            }
            
            if (!data) {
                throw new Error('No data returned from checkout function');
            }
            
            if (!data.url) {
                console.error('[CreditPurchaseModal] No URL in response:', data);
                throw new Error('No checkout URL returned');
            }
            
            console.log('[CreditPurchaseModal] Redirecting to Stripe:', data.url);
            
            // Track purchase initiation with correct amount and credits
            analytics.purchaseCredits(actualAmount, actualCredits);
            
            // Add a small delay before navigation to ensure analytics event is sent
            // Even with beacon transport, we need to give the GA script time to process
            setTimeout(() => {
                window.location.href = data.url;
            }, 150);
        } catch (error: any) {
            console.error('[CreditPurchaseModal] Purchase failed:', error);
            const errorMessage = error?.message || error?.error?.message || 'Unknown error occurred';
            alert('Purchase failed: ' + errorMessage);
            setLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div 
                className={`bg-white rounded-2xl shadow-xl w-full ${isApi ? 'max-w-md' : 'max-w-2xl'} overflow-hidden relative`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-slate-900">
                            {isApi ? 'Add API Credits' : 'Top Up Your Credits'}
                        </h2>
                        <p className="text-slate-500 mt-2">
                            {isApi 
                                ? 'Enter amount to add to your balance.'
                                : 'Choose a pack to keep creating amazing vinyl toys.'}
                        </p>
                    </div>

                    {isApi ? (
                        // API: Custom Amount
                        <>
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Amount (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
                                    <input
                                        type="number"
                                        min="5"
                                        step="1"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-bold text-lg"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Minimum amount: $5.00</p>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 mb-8 flex items-center justify-between border border-slate-100">
                                <div>
                                    <p className="text-sm text-slate-500">Estimated Generations</p>
                                    <p className="text-xs text-slate-400">$0.10 / gen</p>
                                </div>
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-2xl">
                                    <Zap size={24} className="text-brand-600 fill-current" />
                                    {credits}
                                </div>
                            </div>

                            <button
                                onClick={() => handlePurchase()}
                                disabled={!!loading || parseFloat(amount || '0') < 5}
                                className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading === true ? <Loader2 className="animate-spin" size={20} /> : `Pay $${parseFloat(amount || '0').toFixed(2)}`}
                            </button>
                        </>
                    ) : (
                        // App: Packs
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Starter Pack */}
                            <div className="border border-slate-200 rounded-xl p-6 hover:border-brand-200 hover:shadow-lg transition-all relative group">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
                                    Starter
                                </div>
                                <div className="text-center mb-6 mt-2">
                                    <div className="text-4xl font-bold text-slate-900 mb-1">$7.50</div>
                                    <div className="text-slate-500 text-sm">$0.15/gen</div>
                                </div>

                                <div className="flex items-center justify-center gap-2 mb-6 text-brand-600 font-bold text-lg">
                                    <Zap size={20} className="fill-current" />
                                    50 Credits
                                </div>

                                <ul className="space-y-3 mb-8 text-sm text-slate-600">
                                    <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> 50 High-Res Generations</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Commercial Usage Rights</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Priority Support</li>
                                </ul>

                                <button
                                    onClick={() => handlePurchase(undefined, 'starter')}
                                    disabled={!!loading}
                                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {loading === 'starter' ? <Loader2 className="animate-spin" size={18} /> : 'Buy Starter Pack'}
                                </button>
                            </div>

                            {/* Pro Pack */}
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                                    BEST VALUE
                                </div>

                                <div className="text-center mb-6 mt-2">
                                    <div className="text-4xl font-bold text-slate-900 mb-1">$20.00</div>
                                    <div className="text-slate-500 text-sm">$0.10/gen (33% off)</div>
                                </div>

                                <div className="flex items-center justify-center gap-2 mb-6 text-red-600 font-bold text-lg">
                                    <Crown size={20} className="fill-current" />
                                    200 Credits
                                </div>

                                <ul className="space-y-3 mb-8 text-sm text-slate-600">
                                    <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> 200 High-Res Generations</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Commercial Usage Rights</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Priority Queue</li>
                                    <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Early Access</li>
                                </ul>

                                <button
                                    onClick={() => handlePurchase(undefined, 'pro')}
                                    disabled={!!loading}
                                    className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {loading === 'pro' ? <Loader2 className="animate-spin" size={18} /> : 'Buy Pro Pack'}
                                </button>
                            </div>
                        </div>
                    )}

                    <p className="text-center text-xs text-slate-400 mt-6">
                        Secure payment via Stripe. Credits never expire.
                    </p>
                </div>
            </div>
        </div>
    );
};
