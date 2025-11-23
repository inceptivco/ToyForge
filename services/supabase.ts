/**
 * Supabase Client Configuration
 *
 * Initializes and exports the Supabase client with proper typing.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

// ============================================================================
// Environment Variables
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  logger.error('Missing Supabase environment variables', undefined, { missing });
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
    'Please check your .env.local file.'
  );
}

// ============================================================================
// Database Types (Generated from schema)
// ============================================================================

/**
 * Database schema types
 * These should match your Supabase database schema
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          credits_balance: number;
          api_credits_balance: number;
          stripe_customer_id: string | null;
          is_api_enabled: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          credits_balance?: number;
          api_credits_balance?: number;
          stripe_customer_id?: string | null;
          is_api_enabled?: boolean;
        };
        Update: {
          credits_balance?: number;
          api_credits_balance?: number;
          stripe_customer_id?: string | null;
          is_api_enabled?: boolean;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          key_hash: string;
          last_used_at: string | null;
          deleted_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          label: string;
          key_hash: string;
        };
        Update: {
          label?: string;
          last_used_at?: string | null;
          deleted_at?: string | null;
        };
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          api_key_id: string | null;
          config_hash: string;
          image_url: string;
          prompt_used: string;
          cost_in_credits: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          api_key_id?: string | null;
          config_hash: string;
          image_url: string;
          prompt_used: string;
          cost_in_credits?: number;
        };
        Update: never; // Generations are immutable
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: 'PURCHASE' | 'GENERATION' | 'REFUND' | 'BONUS';
          reference_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          type: 'PURCHASE' | 'GENERATION' | 'REFUND' | 'BONUS';
          reference_id: string;
        };
        Update: never; // Transactions are immutable
      };
    };
    Functions: {
      deduct_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_ref_id: string;
          p_credit_type: 'app' | 'api';
        };
        Returns: boolean;
      };
      handle_purchase_v2: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_ref_id: string;
          p_credit_type: 'app' | 'api';
        };
        Returns: boolean;
      };
    };
  };
}

// ============================================================================
// Client Initialization
// ============================================================================

/**
 * Typed Supabase client
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Log initialization
logger.info('Supabase client initialized', {
  url: supabaseUrl.substring(0, 30) + '...',
});

// ============================================================================
// Typed Helper Functions
// ============================================================================

/**
 * Get the current authenticated user's profile
 */
export async function getCurrentUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    logger.error('Failed to fetch user profile', error);
    return null;
  }

  return data;
}

/**
 * Get user's API keys
 */
export async function getUserApiKeys(userId: string) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch API keys', error);
    return [];
  }

  return data;
}

/**
 * Get user's generation history
 */
export async function getUserGenerations(
  userId: string,
  options: { limit?: number; apiOnly?: boolean } = {}
) {
  const { limit = 50, apiOnly = false } = options;

  let query = supabase
    .from('generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (apiOnly) {
    query = query.not('api_key_id', 'is', null);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch generations', error);
    return [];
  }

  return data;
}
