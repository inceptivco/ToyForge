/**
 * Authentication Context for CharacterForge
 *
 * Provides centralized authentication state management across the application.
 * This eliminates duplicate auth logic in multiple components.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { AuthUser, UserProfile } from '../types';
import { authLogger } from '../utils/logger';
import { AuthenticationError, SessionExpiredError } from '../utils/errors';
import type { Session, User } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

interface AuthContextValue {
  // State
  user: AuthUser | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  signIn: (email: string, redirectUrl?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// Helper Functions
// ============================================================================

function mapSupabaseUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email || '',
    created_at: user.created_at || new Date().toISOString(),
  };
}

// ============================================================================
// Provider Component
// ============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        authLogger.warn('Failed to fetch profile', { userId, error: error.message });
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      authLogger.error('Error fetching profile', error);
      return null;
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) {
      authLogger.debug('Cannot refresh profile: No user');
      return;
    }

    authLogger.debug('Refreshing profile', { userId: user.id });
    const newProfile = await fetchProfile(user.id);
    if (newProfile) {
      setProfile(newProfile);
      authLogger.debug('Profile refreshed', {
        credits: newProfile.credits_balance,
        apiCredits: newProfile.api_credits_balance,
      });
    }
  }, [user, fetchProfile]);

  // Initialize auth state on mount
  useEffect(() => {
    authLogger.debug('Initializing auth state');

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (initialSession?.user) {
        const mappedUser = mapSupabaseUser(initialSession.user);
        setUser(mappedUser);
        setSession(initialSession);

        const userProfile = await fetchProfile(mappedUser.id);
        setProfile(userProfile);

        authLogger.info('User session restored', { userId: mappedUser.id });
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        authLogger.debug('Auth state changed', { event });

        if (newSession?.user) {
          const mappedUser = mapSupabaseUser(newSession.user);
          setUser(mappedUser);
          setSession(newSession);

          const userProfile = await fetchProfile(mappedUser.id);
          setProfile(userProfile);

          authLogger.info('User authenticated', { userId: mappedUser.id, event });
        } else {
          setUser(null);
          setProfile(null);
          setSession(null);

          authLogger.info('User signed out', { event });
        }

        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign in with magic link
  const signIn = useCallback(async (email: string, redirectUrl?: string): Promise<void> => {
    authLogger.info('Initiating sign in', { email: email.substring(0, 3) + '***' });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl || window.location.href,
      },
    });

    if (error) {
      authLogger.error('Sign in failed', error);
      throw new AuthenticationError(error.message);
    }

    authLogger.info('Magic link sent');
  }, []);

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    authLogger.info('Signing out');

    const { error } = await supabase.auth.signOut();

    if (error) {
      authLogger.error('Sign out failed', error);
      throw new AuthenticationError(error.message);
    }

    setUser(null);
    setProfile(null);
    setSession(null);

    authLogger.info('Sign out complete');
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user && !!session,
    signIn,
    signOut,
    refreshProfile,
  }), [user, profile, session, isLoading, signIn, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook that ensures user is authenticated, throws if not
 */
export function useRequireAuth(): AuthContextValue & { user: AuthUser; profile: UserProfile } {
  const auth = useAuth();

  if (!auth.isLoading && !auth.isAuthenticated) {
    throw new AuthenticationError('Authentication required');
  }

  if (!auth.user || !auth.profile) {
    throw new AuthenticationError('User data not available');
  }

  return auth as AuthContextValue & { user: AuthUser; profile: UserProfile };
}

/**
 * Hook to get just the current user
 */
export function useCurrentUser(): AuthUser | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to get just the current profile
 */
export function useCurrentProfile(): UserProfile | null {
  const { profile } = useAuth();
  return profile;
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
