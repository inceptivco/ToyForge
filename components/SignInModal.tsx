import React from 'react';
import { X } from 'lucide-react';
import { supabase } from '../services/supabase';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    redirectUrl?: string;
}

export const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose, redirectUrl }) => {
    const [email, setEmail] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: redirectUrl || window.location.href,
                },
            });

            if (error) throw error;

            setMessage({
                type: 'success',
                text: 'Check your email for the magic link!',
            });
            setEmail('');
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Failed to send magic link',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const isSuccess = message?.type === 'success';

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={isSuccess ? undefined : onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <X size={20} className="text-slate-400" />
                </button>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-red-500/30">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In</h2>
                    <p className="text-slate-600">
                        {isSuccess ? 'Magic link sent!' : 'Enter your email to receive a magic link'}
                    </p>
                </div>

                {!isSuccess ? (
                    <>
                        <form onSubmit={handleMagicLink} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {message && message.type === 'error' && (
                                <div className="p-4 rounded-xl text-sm bg-red-50 text-red-800 border border-red-200">
                                    {message.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Sending...' : 'Send Magic Link'}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-slate-500">
                            No password required. We'll send you a secure link to sign in.
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl text-sm bg-green-50 text-green-800 border border-green-200">
                            {message.text}
                        </div>
                        <div className="text-center text-sm text-slate-500">
                            No password required. We'll send you a secure link to sign in.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
