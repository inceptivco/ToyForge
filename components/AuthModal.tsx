import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { X, Mail, Loader2 } from 'lucide-react';
import { getMagicLinkRedirectUrl } from '../utils/redirect';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    if (!isOpen) return null;

    const isSuccess = message?.type === 'success';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: getMagicLinkRedirectUrl(),
                },
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Check your email for the login link!' });
            setEmail('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={isSuccess ? undefined : onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Welcome to CharacterForge</h2>
                        <p className="text-slate-500 mt-2">
                            {isSuccess ? 'Magic link sent!' : 'Sign in to save your creations and get free credits.'}
                        </p>
                    </div>

                    {message && (
                        <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {!isSuccess ? (
                        <>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Magic Link'}
                                </button>
                            </form>

                            <p className="text-center text-xs text-slate-400 mt-6">
                                By signing in, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </>
                    ) : (
                        <p className="text-center text-xs text-slate-400">
                            By signing in, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
