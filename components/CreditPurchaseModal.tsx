import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { X, Check, Zap, Crown, Loader2 } from 'lucide-react';

interface CreditPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState<'starter' | 'pro' | null>(null);

    if (!isOpen) return null;

    const handlePurchase = async (packId: 'starter' | 'pro') => {
        setLoading(packId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Please sign in first");

            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: { packId },
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            console.error('Purchase failed:', error);
            alert('Purchase failed: ' + error.message);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-slate-900">Top Up Your Credits</h2>
                        <p className="text-slate-500 mt-2">Choose a pack to keep creating amazing vinyl toys.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Starter Pack */}
                        <div className="border border-slate-200 rounded-xl p-6 hover:border-brand-200 hover:shadow-lg transition-all relative group">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
                                Starter
                            </div>
                            <div className="text-center mb-6 mt-2">
                                <div className="text-4xl font-bold text-slate-900 mb-1">$5</div>
                                <div className="text-slate-500 text-sm">One-time payment</div>
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
                                onClick={() => handlePurchase('starter')}
                                disabled={loading !== null}
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {loading === 'starter' ? <Loader2 className="animate-spin" size={18} /> : 'Buy Starter Pack'}
                            </button>
                        </div>

                        {/* Pro Pack */}
                        <div className="border-2 border-brand-500 rounded-xl p-6 shadow-xl shadow-brand-500/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                                BEST VALUE
                            </div>

                            <div className="text-center mb-6 mt-2">
                                <div className="text-4xl font-bold text-slate-900 mb-1">$15</div>
                                <div className="text-slate-500 text-sm">One-time payment</div>
                            </div>

                            <div className="flex items-center justify-center gap-2 mb-6 text-brand-600 font-bold text-lg">
                                <Crown size={20} className="fill-current" />
                                200 Credits
                            </div>

                            <ul className="space-y-3 mb-8 text-sm text-slate-600">
                                <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> 200 High-Res Generations</li>
                                <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Commercial Usage Rights</li>
                                <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Priority Generation Queue</li>
                                <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Early Access to Features</li>
                            </ul>

                            <button
                                onClick={() => handlePurchase('pro')}
                                disabled={loading !== null}
                                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/30 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {loading === 'pro' ? <Loader2 className="animate-spin" size={18} /> : 'Buy Pro Pack'}
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-xs text-slate-400 mt-8">
                        Secure payment via Stripe. Credits never expire.
                    </p>
                </div>
            </div>
        </div>
    );
};
