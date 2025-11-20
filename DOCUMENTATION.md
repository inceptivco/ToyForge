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
        skinToneId: 'light',
        hairStyleId: 'bob',
        hairColorId: 'auburn',
        clothingColorId: 'blue',
        eyeColorId: 'hazel'
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
  skinToneId?: string;
  hairStyleId?: string;
  hairColorId?: string;
  clothingColorId?: string;
  eyeColorId?: string;
  accessoryId?: string;
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
        skinToneId: 'fair',
        hairStyleId: 'short',
        hairColorId: 'dark_brown',
        clothingColorId: 'purple',
        eyeColorId: 'brown'
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
  "skinToneId": "light",
  "hairStyleId": "bob",
  "hairColorId": "auburn",
  "clothingColorId": "blue",
  "eyeColorId": "hazel",
  "accessoryId": "none"
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
    "skinToneId": "light",
    "hairStyleId": "bob",
    "clothingColorId": "blue"
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
    skinToneId: 'light',
    hairStyleId: 'bob',
    hairColorId: 'auburn',
    clothingColorId: 'blue',
    eyeColorId: 'hazel'
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
        skinToneId: 'fair',
        hairStyleId: 'short',
        hairColorId: 'dark_brown',
        clothingColorId: 'purple',
        eyeColorId: 'brown'
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
  skinToneId: 'light',
  hairStyleId: 'bob',
  clothingColorId: 'blue'
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
        "skinToneId": "light",
        "hairStyleId": "bob",
        "clothingColorId": "blue"
    },
    "YOUR_API_KEY"
)

print(f"Image URL: {result['image']}")
print(f"Credits remaining: {result['credits_remaining']}")
```

---

## Pricing

- **Per Generation**: $0.08 - $0.10
- **Volume Discounts**: Available for API users
- **Credits**: Purchase credits in packs (50, 200, etc.)

---

## Support

For questions, issues, or feature requests:
- Email: support@characterforge.app
- Documentation: https://characterforge.app/docs
- GitHub: https://github.com/characterforge

---

## License

Copyright © 2024 CharacterForge. All rights reserved.

