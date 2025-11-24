/**
 * ToyForge Figma Plugin - Auth Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile, AuthState } from '../types';
import {
  supabase,
  getUserProfile,
  initiateMagicLink,
  pollForAuthCompletion,
  getPendingAuth,
  clearPendingAuth,
  signOut as supabaseSignOut,
  onAuthStateChange,
} from '../services/supabase';

interface PendingAuth {
  authCode: string;
  email: string;
  timestamp: number;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [pendingAuth, setPendingAuth] = useState<PendingAuth | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load profile from session
  const loadProfile = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
      });
      return;
    }

    try {
      const profile = await getUserProfile();
      setState({
        user: {
          id: session.user.id,
          email: session.user.email || '',
        },
        profile,
        isLoading: false,
        isAuthenticated: true,
      });
      // Clear pending auth if we're authenticated
      setPendingAuth(null);
      clearPendingAuth();
    } catch (error) {
      console.error('Failed to load profile:', error);
      setState({
        user: {
          id: session.user.id,
          email: session.user.email || '',
        },
        profile: null,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session);
    });

    // Check for pending auth from previous session
    const pending = getPendingAuth();
    if (pending && Date.now() - pending.timestamp < 10 * 60 * 1000) { // 10 minute expiry
      setPendingAuth(pending);
    } else if (pending) {
      clearPendingAuth();
    }

    // Subscribe to auth changes
    const { data: { subscription } } = onAuthStateChange((session) => {
      loadProfile(session);
    });

    return () => {
      subscription.unsubscribe();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [loadProfile]);

  // Polling effect
  useEffect(() => {
    if (!pendingAuth || state.isAuthenticated) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    const poll = async () => {
      const result = await pollForAuthCompletion(pendingAuth.authCode);
      if (result.success) {
        // Auth completed! The onAuthStateChange listener should pick this up
        setPendingAuth(null);
        setIsPolling(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else if (result.error) {
        console.error('Polling error:', result.error);
      }
      // If pending, continue polling
    };

    // Poll immediately, then every 3 seconds
    poll();
    pollIntervalRef.current = setInterval(poll, 3000);

    // Stop polling after 10 minutes
    const timeout = setTimeout(() => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsPolling(false);
      setPendingAuth(null);
      clearPendingAuth();
    }, 10 * 60 * 1000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      clearTimeout(timeout);
    };
  }, [pendingAuth, state.isAuthenticated]);

  // Initiate sign in
  const signIn = useCallback(async (email: string): Promise<{ authCode?: string; error?: string }> => {
    setState(s => ({ ...s, isLoading: true }));

    const result = await initiateMagicLink(email);

    if (result.error) {
      setState(s => ({ ...s, isLoading: false }));
      return { error: result.error };
    }

    // Set pending auth to start polling
    const pending = {
      authCode: result.authCode!,
      email,
      timestamp: Date.now(),
    };
    setPendingAuth(pending);
    setState(s => ({ ...s, isLoading: false }));

    return { authCode: result.authCode };
  }, []);

  // Cancel pending auth
  const cancelAuth = useCallback(() => {
    setPendingAuth(null);
    clearPendingAuth();
    setIsPolling(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }));
    await supabaseSignOut();
    setState({
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
    });
    setPendingAuth(null);
  }, []);

  // Refresh profile (e.g., after purchase)
  const refreshProfile = useCallback(async () => {
    const profile = await getUserProfile();
    if (profile) {
      setState(s => ({ ...s, profile }));
    }
  }, []);

  return {
    ...state,
    pendingAuth,
    isPolling,
    signIn,
    signOut,
    cancelAuth,
    refreshProfile,
  };
}
