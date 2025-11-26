/**
 * Figma Auth Callback Page
 *
 * This page handles the magic link callback for Figma plugin authentication.
 * It extracts the session from the URL and stores it in a database table
 * that the Figma plugin can poll to retrieve the tokens.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Bot, Check, AlertCircle, Loader2 } from 'lucide-react';
import { SEOHead } from './SEOHead';

type Status = 'loading' | 'success' | 'error';

export const FigmaAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string>('');
  const authCode = searchParams.get('code');

  useEffect(() => {
    if (!authCode) {
      // No auth code - this is a regular sign in, just show success
      setStatus('success');
      return;
    }

    let hasProcessed = false;

    // Listen for auth state changes - this fires when Supabase processes the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only process once
      if (hasProcessed) return;

      if (event === 'SIGNED_IN' && session) {
        hasProcessed = true;
        
        try {
          console.log('Session established, storing tokens for code:', authCode);
          console.log('User ID:', session.user.id);

          // Store the tokens in the figma_auth_codes table for the plugin to retrieve
          const { error: insertError, data } = await supabase
            .from('figma_auth_codes')
            .upsert({
              code: authCode,
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              user_id: session.user.id,
              expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
              used: false,
            }, {
              onConflict: 'code',
            })
            .select();

          if (insertError) {
            console.error('Failed to store auth code:', insertError);
            console.error('Insert error details:', JSON.stringify(insertError, null, 2));
            console.error('User ID:', session.user.id);
            console.error('Code:', authCode);
            setError(`Failed to store auth code: ${insertError.message} (Code: ${insertError.code})`);
            setStatus('error');
            return;
          }

          console.log('Successfully stored auth code:', data);
          setStatus('success');
        } catch (err) {
          console.error('Auth callback error:', err);
          setError(err instanceof Error ? err.message : 'Authentication failed');
          setStatus('error');
        }
      }
    });

    // Also try to get session immediately in case it's already available
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }

      if (session && !hasProcessed) {
        // Trigger the auth state change handler manually
        hasProcessed = true;
        supabase.auth.onAuthStateChange((event, sess) => {
          if (event === 'SIGNED_IN' && sess) {
            // This will be handled above
          }
        });
        
        // Process immediately
        (async () => {
          try {
            console.log('Session already available, storing tokens for code:', authCode);
            const { error: insertError, data } = await supabase
              .from('figma_auth_codes')
              .upsert({
                code: authCode,
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                user_id: session.user.id,
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                used: false,
              }, {
                onConflict: 'code',
              })
              .select();

            if (insertError) {
              console.error('Failed to store auth code:', insertError);
              setError(`Failed to store auth code: ${insertError.message}`);
              setStatus('error');
              return;
            }

            console.log('Successfully stored auth code:', data);
            setStatus('success');
          } catch (err) {
            console.error('Auth callback error:', err);
            setError(err instanceof Error ? err.message : 'Authentication failed');
            setStatus('error');
          }
        })();
      }
    });

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (!hasProcessed) {
        console.error('Timeout waiting for session');
        setError('Session timeout. Please try signing in again.');
        setStatus('error');
      }
    }, 15000); // 15 second timeout

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [authCode]);

  return (
    <>
      <SEOHead
        title="Authentication - CharacterForge"
        description="Completing authentication for CharacterForge"
        url="https://characterforge.app/figma-auth"
      />
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {/* Logo */}
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-red-500/30">
          <Bot size={32} />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Signing In...</h1>
            <p className="text-slate-600">Please wait while we complete your sign in.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={24} className="text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">You're Signed In!</h1>

            {authCode ? (
              <>
                <p className="text-slate-600 mb-6">
                  Your Figma plugin should automatically detect this sign in.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                  <div className="text-xs text-slate-500 mb-2">Your verification code:</div>
                  <div className="text-2xl font-mono font-bold text-slate-900 tracking-widest">
                    {authCode}
                  </div>
                </div>

                <p className="text-sm text-slate-500">
                  You can close this tab and return to Figma.
                </p>
              </>
            ) : (
              <p className="text-slate-600">
                You can now close this tab and return to CharacterForge.
              </p>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Sign In Failed</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-slate-500 text-sm">
              Please try signing in again from the Figma plugin.
            </p>
          </>
        )}
      </div>
    </div>
    </>
  );
};
