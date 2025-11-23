/**
 * Core Types for CharacterForge
 *
 * This file contains all shared TypeScript types and interfaces
 * used throughout the application for type safety and consistency.
 */

// =============================================================================
// Character Configuration Types
// =============================================================================

export type Gender = 'male' | 'female';

export type AssetId = string;

export interface CharacterConfig {
  gender: Gender;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  clothing: string;
  clothingColor: string;
  eyeColor: string;
  accessories: string[];
  transparent: boolean;
  cache?: boolean;
}

export interface AssetOption {
  id: string;
  label: string;
  promptValue: string;
  gender?: Gender;
}

export interface ColorPalette {
  id: string;
  name: string;
  hex: string;
  promptValue: string;
}

// =============================================================================
// User & Authentication Types
// =============================================================================

export interface UserProfile {
  id: string;
  email: string;
  credits_balance: number;
  api_credits_balance: number;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface User {
  id: string;
  email: string;
  created_at?: string;
}

// =============================================================================
// API Key Types
// =============================================================================

export interface ApiKey {
  id: string;
  label: string;
  created_at: string;
  last_used_at: string | null;
  deleted_at?: string | null;
  user_id: string;
}

export interface CreateApiKeyRequest {
  label: string;
}

export interface CreateApiKeyResponse {
  id: string;
  label: string;
  apiKey: string;
  created_at: string;
}

// =============================================================================
// Generation Types
// =============================================================================

export interface Generation {
  id: string;
  user_id: string;
  api_key_id: string | null;
  config_hash: string;
  image_url: string;
  config: CharacterConfig;
  prompt_used: string;
  cost_in_credits: number;
  created_at: string;
}

export interface GenerationResult {
  image: string;
  cached?: boolean;
}

// =============================================================================
// Billing & Credits Types
// =============================================================================

export type CreditType = 'api' | 'app';

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  badge?: string;
  features: string[];
}

export interface CheckoutRequest {
  amount?: number;
  packId?: string;
  type: CreditType;
}

export interface CheckoutResponse {
  url: string;
}

export interface UsageDataPoint {
  date: string;
  credits: number;
  breakdown?: Record<string, number>;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// =============================================================================
// Component Props Types
// =============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// SDK Types
// =============================================================================

export interface CharacterForgeClientConfig {
  apiKey?: string;
  cache?: boolean;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface CacheManager {
  get(key: string): Promise<string | null>;
  set(key: string, data: Blob | string): Promise<string>;
  clear(): Promise<void>;
  delete?(key: string): Promise<void>;
}

export interface GenerateOptions {
  signal?: AbortSignal;
  onProgress?: (status: string) => void;
}

// =============================================================================
// Utility Types
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type AsyncState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};
