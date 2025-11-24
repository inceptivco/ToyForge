/**
 * Sign In View Component - Magic link authentication with polling
 */

import React, { useState } from 'react';
import { Mail, Loader2, Check, Sparkles, X, RefreshCw } from 'lucide-react';

interface PendingAuth {
  authCode: string;
  email: string;
  timestamp: number;
}

interface SignInViewProps {
  onSignIn: (email: string) => Promise<{ authCode?: string; error?: string }>;
  onCancelAuth: () => void;
  isLoading: boolean;
  pendingAuth: PendingAuth | null;
  isPolling: boolean;
}

export const SignInView: React.FC<SignInViewProps> = ({
  onSignIn,
  onCancelAuth,
  isLoading,
  pendingAuth,
  isPolling,
}) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLocalLoading(true);
    setMessage(null);

    const result = await onSignIn(email);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Check your email for the magic link!' });
      setEmail('');
    }

    setLocalLoading(false);
  };

  const loading = isLoading || localLoading;

  // If there's a pending auth, show the waiting screen
  if (pendingAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        {/* Logo */}
        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/30 mb-4">
          <Sparkles size={28} />
        </div>

        <h2 className="text-lg font-bold text-slate-900 mb-1">Check Your Email</h2>
        <p className="text-xs text-slate-500 mb-6 text-center">
          We sent a magic link to <strong>{pendingAuth.email}</strong>
        </p>

        {/* Auth Code Display */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
          <div className="text-2xs text-slate-500 mb-2 text-center">Your verification code:</div>
          <div className="text-2xl font-mono font-bold text-slate-900 text-center tracking-widest">
            {pendingAuth.authCode}
          </div>
        </div>

        {/* Polling Status */}
        <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-blue-700 text-xs">
            {isPolling ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Waiting for you to click the magic link...</span>
              </>
            ) : (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Connecting...</span>
              </>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="w-full space-y-2 mb-4">
          <p className="text-2xs text-slate-600">
            <strong>1.</strong> Check your email for the magic link
          </p>
          <p className="text-2xs text-slate-600">
            <strong>2.</strong> Click the link to sign in
          </p>
          <p className="text-2xs text-slate-600">
            <strong>3.</strong> Return to Figma - you'll be signed in automatically
          </p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancelAuth}
          className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-1"
        >
          <X size={12} />
          Cancel and try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      {/* Logo/Icon */}
      <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/30 mb-4">
        <Sparkles size={28} />
      </div>

      <h2 className="text-lg font-bold text-slate-900 mb-1">CharacterForge</h2>
      <p className="text-xs text-slate-500 mb-6 text-center">
        Create stunning vinyl toy characters
      </p>

      {/* Welcome Banner */}
      <div className="w-full bg-gradient-to-r from-brand-50 to-red-50 border border-brand-100 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 text-brand-700 font-semibold text-xs mb-1">
          <Sparkles size={14} className="fill-current" />
          Get 3 Free Credits!
        </div>
        <p className="text-2xs text-brand-600">
          Sign in to start creating characters immediately.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <div>
          <label htmlFor="email" className="block text-2xs font-medium text-slate-600 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-xs disabled:opacity-50"
            />
          </div>
        </div>

        {message?.type === 'error' && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-2xs text-red-700">
            {message.text}
          </div>
        )}

        {message?.type === 'success' && (
          <div className="p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Check size={14} className="text-green-600 flex-shrink-0" />
            <span className="text-2xs text-green-700">{message.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg shadow-md shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Sending...
            </>
          ) : (
            'Send Magic Link'
          )}
        </button>
      </form>

      <p className="mt-4 text-2xs text-slate-400 text-center">
        No password required. We'll send you a secure link.
      </p>
    </div>
  );
};
