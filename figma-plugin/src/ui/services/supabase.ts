/**
 * ToyForge Figma Plugin - Supabase Service
 */

import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import type { UserProfile, CharacterConfig } from '../types';
import { STORAGE_KEYS } from '../constants';

// Supabase configuration - these will be replaced during build
const SUPABASE_URL = 'https://qfbjiclgpqwrljeddnyy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYmppY2xncHF3cmxqZWRkbnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMjcyNDksImV4cCI6MjA2MzYwMzI0OX0.bnKmxR44znJ1qaMkPSkNpHqHsAt4Z0RVo2kH5tpGdXI';

// Create Supabase client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for Figma plugin
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Ignore storage errors in plugin context
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore storage errors in plugin context
        }
      },
    },
  },
});

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const session = await getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }

  return {
    ...data,
    email: session.user.email || '',
  };
}

/**
 * Sign in with magic link (OTP)
 */
export async function signInWithMagicLink(email: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Redirect to a special page that will handle the auth callback
      emailRedirectTo: `${window.location.origin}/auth-callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
}

/**
 * Generate character via edge function
 */
export async function generateCharacter(config: CharacterConfig): Promise<{ image?: string; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: 'Please sign in to generate characters' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-character', {
      body: config,
    });

    if (error) {
      console.error('Generation error:', error);
      return { error: error.message || 'Generation failed' };
    }

    if (!data?.image) {
      return { error: 'No image returned' };
    }

    return { image: data.image };
  } catch (err) {
    console.error('Generation error:', err);
    return { error: err instanceof Error ? err.message : 'Generation failed' };
  }
}

/**
 * Create checkout session for credits
 */
export async function createCheckout(
  options: { packId?: string; amount?: number; type: 'app' | 'api' }
): Promise<{ url?: string; error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: 'Please sign in first' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: options,
    });

    if (error) {
      return { error: error.message || 'Failed to create checkout' };
    }

    if (!data?.url) {
      return { error: 'No checkout URL returned' };
    }

    return { url: data.url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Checkout failed' };
  }
}

/**
 * Fetch image as bytes for Figma canvas
 */
export async function fetchImageAsBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}
