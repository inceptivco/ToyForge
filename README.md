<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CharacterForge

AI Character & Avatar Generator for Apps, Games & Design. Generate production-ready 3D characters with React components and REST API.

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

- 🎨 **AI Character & Avatar Generation** - Create stylized 3D characters for games, apps, and design
- ⚛️ **React Components** - Drop-in components for React and React Native
- 🔌 **REST API** - Full programmatic access for developers
- 🎯 **Fully Customizable** - Gender, age, skin tone, hair, clothing, accessories, and more
- 🖼️ **Production-Ready Assets** - Transparent PNGs perfect for any project
- 💳 **Simple Pricing** - Pay only for what you generate, starting at $0.10

## Installation

### React
```bash
npm install @characterforge/react
```

### React Native
```bash
npm install @characterforge/react-native
```

## Quick Example

```tsx
import { CharacterForge } from '@characterforge/react';

export const MyCharacter = () => {
  return (
    <CharacterForge
      apiKey={process.env.CHARACTER_FORGE_KEY}
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
- 🌐 [Website](https://characterforge.app)
- 💬 [Support](mailto:support@characterforge.app)
