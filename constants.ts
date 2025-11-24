import {
  AssetOption,
  CharacterConfig,
  ColorPalette,
  AgeGroup,
  AgeGroupId,
  SkinToneId,
  HairColorId,
  HairStyleId,
  ClothingItemId,
  ClothingColorId,
  EyeColorId,
  AccessoryId,
} from "./types";

// ============================================================================
// Style Prompt
// ============================================================================

/**
 * The Master Style Prompt - Soft Matte Vinyl on White Background
 * We use White to ensure natural lighting without color spill.
 * Gemini 2.5 Flash Image is capable of segmenting this cleanly.
 */
export const STYLE_PROMPT = `
Render a high-end collectible vinyl toy figure. Direct front view. Facing the camera straight on. Symmetrical upper body portrait.
Material: Soft matte vinyl with a smooth clay-like finish. NOT glossy, NOT shiny plastic.
Lighting: Soft studio lighting, warm and diffuse.
Background: Solid bright white background (hex code #FFFFFF). 
Aesthetic: Clean, minimalist, rounded shapes, premium designer toy style.
`;

export const SKIN_TONES: ColorPalette[] = [
  { id: 'porcelain', name: 'Porcelain', hex: '#fff0e6', promptValue: 'pale porcelain skin' },
  { id: 'fair', name: 'Fair', hex: '#fccbba', promptValue: 'fair warm skin' },
  { id: 'light', name: 'Light', hex: '#e8bda2', promptValue: 'light beige skin' },
  { id: 'medium', name: 'Medium', hex: '#c69076', promptValue: 'medium tan skin' },
  { id: 'olive', name: 'Olive', hex: '#a87f60', promptValue: 'olive skin' },
  { id: 'brown', name: 'Brown', hex: '#8d5e42', promptValue: 'warm brown skin' },
  { id: 'dark', name: 'Dark', hex: '#633e2d', promptValue: 'dark rich brown skin' },
  { id: 'deep', name: 'Deep', hex: '#3f261d', promptValue: 'deep ebony skin' },
];

export const HAIR_COLORS: ColorPalette[] = [
  { id: 'black', name: 'Black', hex: '#1a1a1a', promptValue: 'soft matte black' },
  { id: 'dark_brown', name: 'Dark Brown', hex: '#3e2723', promptValue: 'dark matte brown' },
  { id: 'brown', name: 'Brown', hex: '#795548', promptValue: 'chestnut brown' },
  { id: 'auburn', name: 'Auburn', hex: '#9c4236', promptValue: 'auburn red' },
  { id: 'ginger', name: 'Ginger', hex: '#d84315', promptValue: 'ginger orange' },
  { id: 'dark_blonde', name: 'Dark Blonde', hex: '#bcaaa4', promptValue: 'ash blonde' },
  { id: 'blonde', name: 'Blonde', hex: '#fdd835', promptValue: 'golden blonde' },
  { id: 'platinum', name: 'Platinum', hex: '#fff9c4', promptValue: 'platinum blonde' },
  { id: 'grey', name: 'Grey', hex: '#9e9e9e', promptValue: 'silver grey' },
  { id: 'white', name: 'White', hex: '#f5f5f5', promptValue: 'white' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6', promptValue: 'vibrant blue' },
  { id: 'purple', name: 'Purple', hex: '#9333ea', promptValue: 'vibrant purple' },
];

export const CLOTHING_COLORS: ColorPalette[] = [
  { id: 'white', name: 'White', hex: '#f8fafc', promptValue: 'white' },
  { id: 'black', name: 'Black', hex: '#1e293b', promptValue: 'black' },
  { id: 'navy', name: 'Navy', hex: '#1e3a8a', promptValue: 'navy blue' },
  { id: 'red', name: 'Red', hex: '#ef4444', promptValue: 'red' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6', promptValue: 'blue' },
  { id: 'green', name: 'Green', hex: '#15803d', promptValue: 'forest green' },
  { id: 'yellow', name: 'Yellow', hex: '#eab308', promptValue: 'yellow' },
  { id: 'purple', name: 'Purple', hex: '#9333ea', promptValue: 'purple' },
  { id: 'pink', name: 'Pink', hex: '#ec4899', promptValue: 'pink' },
  { id: 'orange', name: 'Orange', hex: '#f97316', promptValue: 'orange' },
  { id: 'teal', name: 'Teal', hex: '#14b8a6', promptValue: 'teal' },
];

export const EYE_COLORS: ColorPalette[] = [
  { id: 'dark', name: 'Dark', hex: '#262626', promptValue: 'dark' },
  { id: 'brown', name: 'Brown', hex: '#5d4037', promptValue: 'warm brown' },
  { id: 'blue', name: 'Blue', hex: '#3b82f6', promptValue: 'blue' },
  { id: 'green', name: 'Green', hex: '#4caf50', promptValue: 'green' },
  { id: 'hazel', name: 'Hazel', hex: '#a1887f', promptValue: 'hazel' },
  { id: 'grey', name: 'Grey', hex: '#9ca3af', promptValue: 'grey' },
];

export const HAIR_STYLES: AssetOption[] = [
  // Female specific
  { id: 'bob', label: 'Sleek Bob', promptValue: 'a sleek bob cut with bangs', gender: 'female' },
  { id: 'ponytail', label: 'Ponytail', promptValue: 'a high ponytail', gender: 'female' },
  { id: 'buns', label: 'Space Buns', promptValue: 'two cute space buns on top of head', gender: 'female' },
  { id: 'long', label: 'Long Wavy', promptValue: 'long flowing wavy hair', gender: 'female' },
  { id: 'pixie', label: 'Pixie', promptValue: 'a short pixie cut', gender: 'female' },

  // Male specific
  { id: 'undercut', label: 'Undercut', promptValue: 'a trendy undercut fade', gender: 'male' },
  { id: 'quiff', label: 'Quiff', promptValue: 'a voluminous quiff hairstyle', gender: 'male' },
  { id: 'sidepart', label: 'Side Part', promptValue: 'a neat side part hairstyle', gender: 'male' },
  { id: 'buzz', label: 'Buzz Cut', promptValue: 'a short buzz cut', gender: 'male' },
  { id: 'combover', label: 'Combover', promptValue: 'a classic combover hairstyle', gender: 'male' },

  // Unisex
  { id: 'messy', label: 'Messy', promptValue: 'messy short textured hair' },
  { id: 'afro', label: 'Afro', promptValue: 'a round puffy afro' },
  { id: 'curly', label: 'Curly', promptValue: 'short curly hair' },
];

export const CLOTHING_ITEMS: AssetOption[] = [
  // Unisex / Base
  { id: 'tshirt', label: 'T-Shirt', promptValue: 'a simple crew neck t-shirt' },
  { id: 'hoodie', label: 'Hoodie', promptValue: 'a cozy hoodie' },
  { id: 'sweater', label: 'Sweater', promptValue: 'a chunky knit sweater' },
  { id: 'jacket', label: 'Bomber', promptValue: 'a bomber jacket' },

  // Female specific
  { id: 'tank', label: 'Tank Top', promptValue: 'a tank top', gender: 'female' },
  { id: 'dress', label: 'Sundress', promptValue: 'a simple sundress', gender: 'female' },
  { id: 'blouse', label: 'Blouse', promptValue: 'a cute blouse', gender: 'female' },

  // Male specific
  { id: 'polo', label: 'Polo', promptValue: 'a collared polo shirt', gender: 'male' },
  { id: 'buttonup', label: 'Button Up', promptValue: 'a buttoned dress shirt', gender: 'male' },
  { id: 'henley', label: 'Henley', promptValue: 'a henley shirt', gender: 'male' },
];

export const ACCESSORIES: AssetOption[] = [
  { id: 'none', label: 'None', promptValue: '' },
  { id: 'glasses', label: 'Glasses', promptValue: 'wearing thick black rimmed glasses' },
  { id: 'sunglasses', label: 'Sunglasses', promptValue: 'wearing cool sunglasses' },
  { id: 'headphones', label: 'Headphones', promptValue: 'wearing large headphones around the neck' },
  { id: 'cap', label: 'Cap', promptValue: 'wearing a baseball cap' },
  { id: 'beanie', label: 'Beanie', promptValue: 'wearing a knit beanie hat' },
];

// ============================================================================
// Age Groups
// ============================================================================

export const AGE_GROUPS: AgeGroup[] = [
  {
    id: 'kid',
    label: 'Kid',
    ageRange: '3-8 years',
    description: 'Playful child appearance',
    promptModifier: 'Childlike proportions with larger head-to-body ratio (1:3), very round soft features, big innocent eyes, button nose, gentle expression'
  },
  {
    id: 'preteen',
    label: 'Preteen',
    ageRange: '9-12 years',
    description: 'Young preteen appearance',
    promptModifier: 'Pre-adolescent proportions (1:4 head-to-body), slightly more defined features while maintaining softness, bright curious expression'
  },
  {
    id: 'teen',
    label: 'Teen',
    ageRange: '13-17 years',
    description: 'Teenage appearance',
    promptModifier: 'Adolescent proportions (1:5 head-to-body), balanced features, expressive and energetic'
  },
  {
    id: 'young_adult',
    label: 'Young Adult',
    ageRange: '18-25 years',
    description: 'Young adult appearance',
    promptModifier: 'Young adult proportions (1:6 head-to-body), refined features, confident presence, mature expression'
  },
  {
    id: 'adult',
    label: 'Adult',
    ageRange: '25+ years',
    description: 'Mature adult appearance',
    promptModifier: 'Mature adult proportions (1:6.5 head-to-body), fully defined features, distinguished appearance, composed expression'
  }
];

export const DEFAULT_CONFIG: CharacterConfig = {
  gender: 'female',
  ageGroup: 'teen',
  skinTone: 'light',
  hairStyle: 'bob',
  hairColor: 'blonde',
  clothing: 'hoodie',
  clothingColor: 'pink',
  eyeColor: 'blue',
  accessories: ['none'],
  transparent: true,
};

