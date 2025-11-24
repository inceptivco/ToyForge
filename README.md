<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CharacterSmith

AI-powered 3D character generation platform with React components and REST API.

## Quick Start

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables in `.env.local`:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Documentation

📚 **[Full Documentation](./DOCUMENTATION.md)** - Complete guide for:
- React Component usage
- React Native Component usage
- REST API reference
- Configuration options
- Code examples

## Features

- 🎨 **3D Character Generation** - Create stylized vinyl toy characters
- ⚛️ **React Components** - Drop-in components for React and React Native
- 🔌 **REST API** - Full programmatic access
- 🎯 **Customizable** - Gender, skin tone, hair, clothing, accessories, and more
- 🖼️ **Transparent Backgrounds** - Production-ready PNGs with alpha channels
- 💳 **Credit-Based Pricing** - Pay only for what you generate

## Installation

### React
```bash
npm install @charactersmith/react
```

### React Native
```bash
npm install @charactersmith/react-native
```

## Quick Example

```tsx
import { CharacterSmith } from '@charactersmith/react';

export const MyCharacter = () => {
  return (
    <CharacterSmith
      apiKey={process.env.CHARACTER_SMITH_KEY}
      config={{
        gender: 'female',
        skinTone: 'light',
        hairStyle: 'bob',
        clothingColor: 'blue'
      }}
    />
  );
};
```

## Links

- 📖 [Full Documentation](./DOCUMENTATION.md)
- 🌐 [Website](https://charactersmith.app)
- 💬 [Support](mailto:support@charactersmith.app)
