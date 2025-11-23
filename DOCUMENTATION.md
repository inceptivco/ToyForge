# CharacterForge Documentation

Complete documentation for CharacterForge components and API.

## Table of Contents

- [React Component](#react-component)
- [React Native Component](#react-native-component)
- [REST API](#rest-api)
- [Configuration Options](#configuration-options)
- [Examples](#examples)

---

## React Component

### Installation

```bash
npm install @characterforge/react
```

### Basic Usage

```tsx
import { CharacterForge } from '@characterforge/react';

export const MyCharacter = () => {
  return (
    <CharacterForge
      apiKey={process.env.CHARACTER_FORGE_KEY}
      config={{
        gender: 'female',
        ageGroup: 'teen',
        skinTone: 'light',
        hairStyle: 'bob',
        hairColor: 'auburn',
        clothingColor: 'blue',
        eyeColor: 'hazel'
      }}
      cache={true}
      transparent={true}
      onGenerate={(url) => console.log(url)}
    />
  );
};
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `apiKey` | `string` | Yes | - | Your CharacterForge API key |
| `config` | `CharacterConfig` | Yes | - | Character configuration object |
| `cache` | `boolean` | No | `true` | Enable response caching |
| `transparent` | `boolean` | No | `true` | Return images with transparent background |
| `onGenerate` | `(url: string) => void` | No | - | Callback fired when generation completes |

### CharacterConfig Interface

```typescript
interface CharacterConfig {
  gender?: 'male' | 'female';
  ageGroup?: string; // 'kid' | 'preteen' | 'teen' | 'young_adult' | 'adult' (default: 'teen')
  skinTone?: string;
  hairStyle?: string;
  hairColor?: string;
  clothingColor?: string;
  eyeColor?: string;
  accessories?: string[];
}
```

---

## React Native Component

### Installation

```bash
npm install @characterforge/react-native
```

### Basic Usage

```tsx
import { CharacterForgeView } from '@characterforge/react-native';

export const MobileCharacter = () => {
  return (
    <CharacterForgeView
      apiKey={process.env.CHARACTER_FORGE_KEY}
      config={{
        gender: 'male',
        skinTone: 'fair',
        hairStyle: 'short',
        hairColor: 'dark_brown',
        clothingColor: 'purple',
        eyeColor: 'brown'
      }}
      cache={true}
      transparent={true}
      style={{ width: 300, height: 300 }}
    />
  );
};
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `apiKey` | `string` | Yes | - | Your CharacterForge API key |
| `config` | `CharacterConfig` | Yes | - | Character configuration object |
| `cache` | `boolean` | No | `true` | Enable response caching |
| `transparent` | `boolean` | No | `true` | Return images with transparent background |
| `style` | `ViewStyle` | No | - | React Native style object |

---

## REST API

### Base URL

```
https://mnxzykltetirdcnxugcl.supabase.co/functions/v1
```

### Authentication

All API requests require authentication via one of the following methods:

1. **API Key** (Recommended): Include in the `x-api-key` header
2. **Bearer Token**: Include in the `Authorization` header (for authenticated users)

### Generate Character

Generate a 3D character image based on configuration.

**Endpoint:** `POST /generate-character`

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "gender": "female",
  "ageGroup": "teen",
  "skinTone": "light",
  "hairStyle": "bob",
  "hairColor": "auburn",
  "clothingColor": "blue",
  "eyeColor": "hazel",
  "accessory": "none"
}
```

**Response:**
```json
{
  "image": "https://.../generations/abc123.png",
  "cached": false,
  "transparent": true,
  "credits_remaining": 42
}
```

**cURL Example:**
```bash
curl -X POST https://mnxzykltetirdcnxugcl.supabase.co/functions/v1/generate-character \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "female",
    "ageGroup": "young_adult",
    "skinTone": "light",
    "hairStyle": "bob",
    "clothingColor": "blue"
  }'
```

**Error Responses:**

- `400 Bad Request`: Invalid configuration parameters
- `401 Unauthorized`: Missing or invalid API key
- `402 Payment Required`: Insufficient credits
- `500 Internal Server Error`: Server error

---

## Configuration Options

### Gender

- `male`
- `female`

### Age Groups

The `ageGroup` parameter controls the apparent age of the character. This affects proportions, facial features, and overall appearance. **Default: `teen`**

- `kid` - Kid (3-8 years): Childlike proportions with larger head-to-body ratio
- `preteen` - Preteen (9-12 years): Pre-adolescent proportions with slightly more defined features
- `teen` - Teen (13-17 years): Adolescent proportions, balanced features (default)
- `young_adult` - Young Adult (18-25 years): Young adult proportions with refined features
- `adult` - Adult (25+ years): Mature adult proportions with fully defined features

**Note:** The `ageGroup` parameter is optional. If omitted, it defaults to `teen` to maintain consistency with existing generations.

### Skin Tones

- `porcelain`
- `fair`
- `light`
- `medium`
- `olive`
- `brown`
- `dark`
- `deep`

### Hair Styles

- `short`
- `medium`
- `long`
- `bob`
- `ponytail`
- `fade`
- `curly`
- `wavy`

### Hair Colors

- `black`
- `dark_brown`
- `brown`
- `auburn`
- `ginger`
- `dark_blonde`
- `blonde`
- `platinum`
- `grey`

### Clothing Items

- `tshirt` - T-Shirt
- `hoodie` - Hoodie
- `sweater` - Sweater
- `jacket` - Bomber Jacket
- `tank` - Tank Top (female)
- `dress` - Sundress (female)
- `blouse` - Blouse (female)
- `polo` - Polo (male)
- `buttonup` - Button Up (male)
- `henley` - Henley (male)

### Clothing Colors

- `red`
- `blue`
- `green`
- `yellow`
- `purple`
- `orange`
- `pink`
- `teal`
- `black`
- `white`
- `grey`

### Eye Colors

- `brown`
- `hazel`
- `green`
- `blue`
- `grey`
- `dark`

### Accessories

- `none`
- `sunglasses`
- `cap`
- `hat`
- `glasses`

---

## Examples

### React: Dynamic Character Generation

```tsx
import { useState } from 'react';
import { CharacterForge } from '@characterforge/react';

export const CharacterCreator = () => {
  const [config, setConfig] = useState({
    gender: 'female',
    ageGroup: 'preteen',
    skinTone: 'light',
    hairStyle: 'bob',
    hairColor: 'auburn',
    clothingColor: 'blue',
    eyeColor: 'hazel'
  });

  return (
    <div>
      <CharacterForge
        apiKey={process.env.CHARACTER_FORGE_KEY}
        config={config}
        onGenerate={(url) => {
          console.log('Generated:', url);
        }}
      />
      <button onClick={() => setConfig({...config, gender: 'male'})}>
        Switch to Male
      </button>
    </div>
  );
};
```

### React Native: Custom Styling

```tsx
import { CharacterForgeView } from '@characterforge/react-native';

export const StyledCharacter = () => {
  return (
    <CharacterForgeView
      apiKey={process.env.CHARACTER_FORGE_KEY}
      config={{
        gender: 'male',
        skinTone: 'fair',
        hairStyle: 'short',
        hairColor: 'dark_brown',
        clothingColor: 'purple',
        eyeColor: 'brown'
      }}
      style={{
        width: 300,
        height: 300,
        borderRadius: 20,
        backgroundColor: '#f0f0f0'
      }}
    />
  );
};
```

### API: JavaScript Fetch

```javascript
async function generateCharacter(config) {
  const response = await fetch(
    'https://mnxzykltetirdcnxugcl.supabase.co/functions/v1/generate-character',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.image; // URL to the generated character image
}

// Usage
const imageUrl = await generateCharacter({
  gender: 'female',
  ageGroup: 'kid',
  skinTone: 'light',
  hairStyle: 'bob',
  clothingColor: 'blue'
});
```

### API: Python

```python
import requests

def generate_character(config, api_key):
    url = "https://mnxzykltetirdcnxugcl.supabase.co/functions/v1/generate-character"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=config, headers=headers)
    response.raise_for_status()
    
    return response.json()

# Usage
result = generate_character(
    {
        "gender": "female",
        "ageGroup": "adult",
        "skinTone": "light",
        "hairStyle": "bob",
        "clothingColor": "blue"
    },
    "YOUR_API_KEY"
)

print(f"Image URL: {result['image']}")
print(f"Credits remaining: {result['credits_remaining']}")
```

---

## Pricing

- **API Pricing**: Flat rate of **$0.10 per generation**. No monthly fees.
- **App Pricing**: Starts at **$0.15 per generation**, with volume discounts down to **$0.10** when purchasing credit packs.
- **Credits**: Purchase credits in packs (Starter: 50 credits, Pro: 200 credits). Credits never expire.

---

## Support

For questions, issues, or feature requests:
- Email: support@characterforge.app
- Documentation: https://characterforge.app/docs
- GitHub: https://github.com/characterforge

---

## License

Copyright © 2024 CharacterForge. All rights reserved.

