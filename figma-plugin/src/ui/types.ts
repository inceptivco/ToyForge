/**
 * CharacterForge Figma Plugin - Type Definitions
 */

// Gender & Age
export type Gender = 'male' | 'female';
export type AgeGroupId = 'kid' | 'preteen' | 'teen' | 'young_adult' | 'adult';

export interface AgeGroup {
  id: AgeGroupId;
  label: string;
  ageRange: string;
  description: string;
  promptModifier: string;
}

// Skin & Eye
export type SkinToneId =
  | 'porcelain' | 'fair' | 'light' | 'medium'
  | 'olive' | 'brown' | 'dark' | 'deep';

export type EyeColorId =
  | 'dark' | 'brown' | 'blue' | 'green' | 'hazel' | 'grey';

// Hair
export type HairStyleId =
  | 'bob' | 'ponytail' | 'buns' | 'long' | 'pixie'
  | 'undercut' | 'quiff' | 'sidepart' | 'buzz' | 'combover'
  | 'messy' | 'afro' | 'curly';

export type HairColorId =
  | 'black' | 'dark_brown' | 'brown' | 'auburn' | 'ginger'
  | 'dark_blonde' | 'blonde' | 'platinum' | 'grey' | 'white'
  | 'blue' | 'purple';

// Clothing
export type ClothingItemId =
  | 'tshirt' | 'hoodie' | 'sweater' | 'jacket'
  | 'tank' | 'dress' | 'blouse' | 'polo' | 'buttonup' | 'henley';

export type ClothingColorId =
  | 'white' | 'black' | 'navy' | 'red' | 'blue' | 'green'
  | 'yellow' | 'purple' | 'pink' | 'orange' | 'teal';

// Accessories
export type AccessoryId =
  | 'none' | 'glasses' | 'sunglasses' | 'headphones' | 'cap' | 'beanie';

// Asset & Color Options
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

// Character Configuration
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
}

// User Profile
export interface UserProfile {
  id: string;
  email: string;
  credits_balance: number;
  api_credits_balance: number;
  stripe_customer_id: string | null;
  is_api_enabled: boolean;
  created_at: string;
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Generation Types
export interface GenerationResult {
  image: string;
  cached?: boolean;
}

export type GenerationStatus =
  | 'idle'
  | 'initiating'
  | 'generating'
  | 'processing'
  | 'placing'
  | 'complete'
  | 'error';

export interface GenerationState {
  status: GenerationStatus;
  message: string;
}

// History Item
export interface HistoryItem {
  id: string;
  config: CharacterConfig;
  imageUrl: string;
  timestamp: number;
}

// Plugin Messages
export interface PlaceImageMessage {
  type: 'place-image';
  imageData: Uint8Array;
  name: string;
  width?: number;
  height?: number;
}

export interface ImagePlacedResponse {
  type: 'image-placed';
  success: boolean;
  error?: string;
}
