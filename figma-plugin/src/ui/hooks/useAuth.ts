/**
 * ToyForge Figma Plugin - Auth Hook
 */

import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile, AuthState } from '../types';
import { supabase, getUserProfile, signInWithMagicLink, signOut as supabaseSignOut, onAuthStateChange } from '../services/supabase';

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  });

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

    // Subscribe to auth changes
    const { data: { subscription } } = onAuthStateChange((session) => {
      loadProfile(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Sign in
  const signIn = useCallback(async (email: string) => {
    setState(s => ({ ...s, isLoading: true }));
    const result = await signInWithMagicLink(email);
    setState(s => ({ ...s, isLoading: false }));
    return result;
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
    signIn,
    signOut,
    refreshProfile,
  };
}
