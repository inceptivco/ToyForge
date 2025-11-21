
export type AssetId = string;

export interface CharacterConfig {
  gender: 'male' | 'female';
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  clothing: string;
  clothingColor: string;
  eyeColor: string;
  accessories: string[];
  transparent: boolean;
}

export interface AssetOption {
  id: string;
  label: string;
  promptValue: string; // The text description sent to the AI
  gender?: 'male' | 'female'; // Optional constraint
}

export interface ColorPalette {
  id: string;
  name: string;
  hex: string;
  promptValue: string; // The text description sent to the AI
}
