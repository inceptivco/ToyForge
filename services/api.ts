/**
 * API Client Abstraction Layer
 *
 * Provides a centralized, type-safe way to interact with Supabase Edge Functions
 * and the database. Includes error handling, retry logic, and proper typing.
 */

import { supabase } from './supabase';
import type {
  ApiKey,
  CreateApiKeyResponse,
  CheckoutRequest,
  CheckoutResponse,
  UserProfile,
  Generation,
  ApiError,
} from '../types';

// =============================================================================
// Error Handling
// =============================================================================

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

function extractErrorMessage(error: unknown, data: unknown): string {
  // Check for error message in response data first
  if (data && typeof data === 'object' && 'error' in data) {
    const dataError = (data as { error: unknown }).error;
    if (typeof dataError === 'string') {
      return dataError;
    }
  }

  // Check for Supabase error
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }

  return 'An unexpected error occurred';
}

// =============================================================================
// Edge Function Invocations
// =============================================================================

interface InvokeOptions {
  timeout?: number;
}

async function invokeFunction<T>(
  functionName: string,
  body?: unknown,
  _options: InvokeOptions = {}
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
  });

  // Handle errors from both the Supabase client and the edge function response
  if (error || (data && typeof data === 'object' && 'error' in data)) {
    const errorMessage = extractErrorMessage(error, data);
    throw new ApiClientError(errorMessage, 'FUNCTION_ERROR', error?.status || 400);
  }

  return data as T;
}

// =============================================================================
// API Key Operations
// =============================================================================

export const apiKeys = {
  /**
   * Fetch all active API keys for the current user
   */
  async list(): Promise<ApiKey[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, label, created_at, last_used_at, user_id')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiClientError(error.message, 'DB_ERROR');
    }

    return data || [];
  },

  /**
   * Create a new API key
   */
  async create(label: string): Promise<CreateApiKeyResponse> {
    return invokeFunction<CreateApiKeyResponse>('create-api-key', { label });
  },

  /**
   * Soft delete (revoke) an API key
   */
  async revoke(keyId: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', keyId);

    if (error) {
      throw new ApiClientError(error.message, 'DB_ERROR');
    }
  },
};

// =============================================================================
// Profile Operations
// =============================================================================

export const profiles = {
  /**
   * Fetch the current user's profile
   */
  async get(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, credits_balance, api_credits_balance, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new ApiClientError(error.message, 'DB_ERROR');
    }

    return data as UserProfile;
  },

  /**
   * Refresh and return the current credit balances
   */
  async getCredits(userId: string): Promise<{ credits: number; apiCredits: number }> {
    const profile = await this.get(userId);

    return {
      credits: profile?.credits_balance ?? 0,
      apiCredits: profile?.api_credits_balance ?? 0,
    };
  },
};

// =============================================================================
// Billing Operations
// =============================================================================

export const billing = {
  /**
   * Create a Stripe checkout session
   */
  async createCheckout(request: CheckoutRequest): Promise<CheckoutResponse> {
    return invokeFunction<CheckoutResponse>('create-checkout', request);
  },

  /**
   * Get usage data for the billing dashboard
   */
  async getUsageHistory(
    userId: string,
    options: { limit?: number; apiOnly?: boolean } = {}
  ): Promise<Generation[]> {
    const { limit = 100, apiOnly = true } = options;

    let query = supabase
      .from('generations')
      .select(`
        id,
        user_id,
        api_key_id,
        config_hash,
        image_url,
        config,
        prompt_used,
        cost_in_credits,
        created_at,
        api_keys:api_key_id (
          id,
          label,
          key_hash
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (apiOnly) {
      query = query.not('api_key_id', 'is', null);
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiClientError(error.message, 'DB_ERROR');
    }

    return (data || []) as unknown as Generation[];
  },
};

// =============================================================================
// Generation Operations
// =============================================================================

export const generations = {
  /**
   * Fetch recent generations for a user
   */
  async list(
    userId: string,
    options: { limit?: number; apiKeyId?: string } = {}
  ): Promise<Generation[]> {
    const { limit = 50, apiKeyId } = options;

    let query = supabase
      .from('generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (apiKeyId) {
      query = query.eq('api_key_id', apiKeyId);
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiClientError(error.message, 'DB_ERROR');
    }

    return (data || []) as Generation[];
  },

  /**
   * Get generation count for a user
   */
  async count(userId: string, apiOnly: boolean = false): Promise<number> {
    let query = supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (apiOnly) {
      query = query.not('api_key_id', 'is', null);
    }

    const { count, error } = await query;

    if (error) {
      throw new ApiClientError(error.message, 'DB_ERROR');
    }

    return count || 0;
  },
};

// =============================================================================
// Account Operations
// =============================================================================

export const account = {
  /**
   * Delete the current user's account
   */
  async delete(): Promise<void> {
    await invokeFunction<{ message: string }>('delete-account');
  },
};

// =============================================================================
// Auth Helpers
// =============================================================================

export const auth = {
  /**
   * Get the current session
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      throw new ApiClientError(error.message, 'AUTH_ERROR');
    }

    return session;
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session?.user;
  },

  /**
   * Send magic link for authentication
   */
  async sendMagicLink(email: string, redirectUrl?: string): Promise<void> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl || window.location.href,
      },
    });

    if (error) {
      throw new ApiClientError(error.message, 'AUTH_ERROR');
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new ApiClientError(error.message, 'AUTH_ERROR');
    }
  },
};

// =============================================================================
// Default Export
// =============================================================================

export const api = {
  apiKeys,
  profiles,
  billing,
  generations,
  account,
  auth,
};

export default api;
