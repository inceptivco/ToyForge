/**
 * Core Type Definitions for CharacterSmith
 *
 * This file contains all shared type definitions used across the application.
 * Using strict union types ensures type safety and enables better IDE support.
 */

// ============================================================================
// Primitive Type Aliases
// ============================================================================

export type AssetId = string;
export type UserId = string;
export type ApiKeyId = string;

// ============================================================================
// Gender & Age Configuration
// ============================================================================

export type Gender = 'male' | 'female';

export type AgeGroupId = 'kid' | 'preteen' | 'teen' | 'young_adult' | 'adult';

export interface AgeGroup {
  id: AgeGroupId;
  label: string;
  ageRange: string;
  description: string;
  promptModifier: string;
}

// ============================================================================
// Skin & Eye Configuration
// ============================================================================

export type SkinToneId =
  | 'porcelain'
  | 'fair'
  | 'light'
  | 'medium'
  | 'olive'
  | 'brown'
  | 'dark'
  | 'deep';

export type EyeColorId =
  | 'dark'
  | 'brown'
  | 'blue'
  | 'green'
  | 'hazel'
  | 'grey';

// ============================================================================
// Hair Configuration
// ============================================================================

export type HairStyleId =
  | 'bob'
  | 'ponytail'
  | 'buns'
  | 'long'
  | 'pixie'
  | 'undercut'
  | 'quiff'
  | 'sidepart'
  | 'buzz'
  | 'combover'
  | 'messy'
  | 'afro'
  | 'curly';

export type HairColorId =
  | 'black'
  | 'dark_brown'
  | 'brown'
  | 'auburn'
  | 'ginger'
  | 'dark_blonde'
  | 'blonde'
  | 'platinum'
  | 'grey'
  | 'white'
  | 'blue'
  | 'purple';

// ============================================================================
// Clothing Configuration
// ============================================================================

export type ClothingItemId =
  | 'tshirt'
  | 'hoodie'
  | 'sweater'
  | 'jacket'
  | 'tank'
  | 'dress'
  | 'blouse'
  | 'polo'
  | 'buttonup'
  | 'henley';

export type ClothingColorId =
  | 'white'
  | 'black'
  | 'navy'
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'teal';

// ============================================================================
// Accessories Configuration
// ============================================================================

export type AccessoryId =
  | 'none'
  | 'glasses'
  | 'sunglasses'
  | 'headphones'
  | 'cap'
  | 'beanie';

// ============================================================================
// Asset & Color Option Interfaces
// ============================================================================

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

// ============================================================================
// Character Configuration
// ============================================================================

export interface CharacterConfig {
  gender: Gender;
  ageGroup?: AgeGroupId;
  skinTone: SkinToneId;
  hairStyle: HairStyleId;
  hairColor: HairColorId;
  clothing: ClothingItemId;
  clothingColor: ClothingColorId;
  eyeColor: EyeColorId;
  accessories: AccessoryId[];
  transparent: boolean;
  cache?: boolean;
}

// ============================================================================
// User & Profile Types
// ============================================================================

export interface UserProfile {
  id: UserId;
  email: string;
  credits_balance: number;
  api_credits_balance: number;
  stripe_customer_id: string | null;
  is_api_enabled: boolean;
  created_at: string;
}

export interface ApiKey {
  id: ApiKeyId;
  user_id: UserId;
  label: string;
  key_hash: string;
  last_used_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: UserId;
  api_key_id: ApiKeyId | null;
  config_hash: string;
  image_url: string;
  prompt_used: string;
  cost_in_credits: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: UserId;
  amount: number;
  type: 'PURCHASE' | 'GENERATION' | 'REFUND' | 'BONUS';
  reference_id: string;
  created_at: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface GenerationResponse {
  image: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  statusCode?: number;
}

export interface CheckoutResponse {
  url: string;
}

export interface ApiKeyCreateResponse {
  id: ApiKeyId;
  label: string;
  apiKey: string;
  created_at: string;
}

// ============================================================================
// Credit Types
// ============================================================================

export type CreditType = 'app' | 'api';

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  type: CreditType;
  featured?: boolean;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface AuthUser {
  id: UserId;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface WithUserProps {
  user: AuthUser | null;
}

// ============================================================================
// Generation Status Types
// ============================================================================

export type GenerationStatus =
  | 'idle'
  | 'initiating'
  | 'generating'
  | 'processing'
  | 'caching'
  | 'complete'
  | 'error';

export interface GenerationState {
  status: GenerationStatus;
  message: string;
  progress?: number;
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

export interface CharacterSmithClientConfig {
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
