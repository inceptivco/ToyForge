/**
 * Authentication Hook
 *
 * Provides a centralized way to manage authentication state across the app.
 * Handles session management, auth state changes, and user profile fetching.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { authLogger } from '../utils/logger';
import type { User, UserProfile, AuthState } from '../types';

interface UseAuthReturn extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  profile: UserProfile | null;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, credits_balance, api_credits_balance, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error) {
        authLogger.error('Error fetching profile', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      authLogger.error('Profile fetch failed', error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;

    const profileData = await fetchProfile(user.id);
    if (profileData) {
      setProfile(profileData);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const authUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at,
          };
          setUser(authUser);

          const profileData = await fetchProfile(session.user.id);
          if (mounted && profileData) {
            setProfile(profileData);
          }
        }
      } catch (error) {
        authLogger.error('Initialization error', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (session?.user) {
          const authUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at,
          };
          setUser(authUser);

          const profileData = await fetchProfile(session.user.id);
          if (mounted && profileData) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }

        if (mounted) {
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      authLogger.error('Sign out error', error);
      throw error;
    }
  }, []);

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshProfile,
  };
}
