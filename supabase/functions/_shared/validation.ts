/**
 * Request Validation Utilities
 *
 * Shared validation functions for edge functions.
 */

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  field?: string;
}

// ============================================================================
// Character Config Validation
// ============================================================================

const VALID_GENDERS = ['male', 'female'] as const;
const VALID_AGE_GROUPS = ['kid', 'preteen', 'teen', 'young_adult', 'adult'] as const;
const VALID_SKIN_TONES = ['porcelain', 'fair', 'light', 'medium', 'olive', 'brown', 'dark', 'deep'] as const;
const VALID_HAIR_STYLES = ['bob', 'ponytail', 'buns', 'long', 'pixie', 'undercut', 'quiff', 'sidepart', 'buzz', 'combover', 'messy', 'afro', 'curly'] as const;
const VALID_HAIR_COLORS = ['black', 'dark_brown', 'brown', 'auburn', 'ginger', 'dark_blonde', 'blonde', 'platinum', 'grey', 'white', 'blue', 'purple'] as const;
const VALID_CLOTHING = ['tshirt', 'hoodie', 'sweater', 'jacket', 'tank', 'dress', 'blouse', 'polo', 'buttonup', 'henley'] as const;
const VALID_CLOTHING_COLORS = ['white', 'black', 'navy', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'teal'] as const;
const VALID_EYE_COLORS = ['dark', 'brown', 'blue', 'green', 'hazel', 'grey'] as const;
const VALID_ACCESSORIES = ['none', 'glasses', 'sunglasses', 'headphones', 'cap', 'beanie'] as const;

export interface CharacterConfigInput {
  gender?: string;
  ageGroup?: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  clothing: string;
  clothingColor: string;
  eyeColor: string;
  accessories?: string | string[];
  transparent?: boolean;
  cache?: boolean;
}

/**
 * Validate a character configuration
 */
export function validateCharacterConfig(
  input: unknown
): ValidationResult<CharacterConfigInput> {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }

  const config = input as Record<string, unknown>;

  // Validate gender (optional, defaults to 'female')
  if (config.gender !== undefined) {
    if (!VALID_GENDERS.includes(config.gender as any)) {
      return {
        success: false,
        error: `Invalid gender. Must be one of: ${VALID_GENDERS.join(', ')}`,
        field: 'gender',
      };
    }
  }

  // Validate ageGroup (optional)
  if (config.ageGroup !== undefined) {
    if (!VALID_AGE_GROUPS.includes(config.ageGroup as any)) {
      return {
        success: false,
        error: `Invalid age group. Must be one of: ${VALID_AGE_GROUPS.join(', ')}`,
        field: 'ageGroup',
      };
    }
  }

  // Validate required fields
  const requiredFields = [
    { key: 'skinTone', valid: VALID_SKIN_TONES },
    { key: 'hairStyle', valid: VALID_HAIR_STYLES },
    { key: 'hairColor', valid: VALID_HAIR_COLORS },
    { key: 'clothing', valid: VALID_CLOTHING },
    { key: 'clothingColor', valid: VALID_CLOTHING_COLORS },
    { key: 'eyeColor', valid: VALID_EYE_COLORS },
  ] as const;

  for (const { key, valid } of requiredFields) {
    const value = config[key];
    if (typeof value !== 'string') {
      return {
        success: false,
        error: `Missing required field: ${key}`,
        field: key,
      };
    }
    if (!valid.includes(value as any)) {
      return {
        success: false,
        error: `Invalid ${key}. Must be one of: ${valid.join(', ')}`,
        field: key,
      };
    }
  }

  // Validate accessories (optional)
  if (config.accessories !== undefined) {
    const accessories = Array.isArray(config.accessories)
      ? config.accessories
      : [config.accessories];

    for (const acc of accessories) {
      if (typeof acc !== 'string' || !VALID_ACCESSORIES.includes(acc as any)) {
        return {
          success: false,
          error: `Invalid accessory. Must be one of: ${VALID_ACCESSORIES.join(', ')}`,
          field: 'accessories',
        };
      }
    }
  }

  return {
    success: true,
    data: config as CharacterConfigInput,
  };
}

// ============================================================================
// General Validation Helpers
// ============================================================================

/**
 * Validate that a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate email format
 */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate that a value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && isFinite(value);
}

/**
 * Sanitize a string for safe usage
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input.trim().slice(0, maxLength);
}
