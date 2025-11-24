# ToyForge Figma Plugin

A Figma plugin that allows designers to create and insert AI-generated vinyl toy characters directly onto the canvas.

## Features

- **Character Generation**: Create unique vinyl toy characters with customizable options
- **3 Free Credits**: New users get 3 free credits to start creating
- **Direct Canvas Integration**: Generated characters are placed directly on your Figma canvas
- **Compact UI**: Tabbed interface optimized for Figma's plugin panel
- **History Panel**: Re-insert previously generated characters
- **Credit System**: Same pricing as the web app (Starter: $7.50/50 credits, Pro: $20/200 credits)

## Character Customization Options

- **Identity**: Gender, Age Group, Skin Tone, Eye Color
- **Hair**: 13 hair styles, 12 hair colors
- **Wardrobe**: 10 clothing styles, 11 clothing colors
- **Extras**: 6 accessories (with conflict handling), transparent background toggle

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
cd figma-plugin
npm install
```

### Build

```bash
npm run build
```

### Development (watch mode)

```bash
npm run dev
```

### Installing in Figma

1. Open Figma Desktop App
2. Go to Plugins > Development > Import plugin from manifest...
3. Select the `manifest.json` file from this directory
4. The plugin will appear in your Plugins menu

## Architecture

```
figma-plugin/
├── manifest.json          # Plugin configuration
├── src/
│   ├── code.ts            # Figma sandbox (canvas API)
│   └── ui/
│       ├── App.tsx        # Main React app
│       ├── components/    # UI components
│       ├── hooks/         # React hooks
│       ├── services/      # Supabase client
│       ├── types.ts       # TypeScript types
│       └── constants.ts   # Shared constants
└── dist/                  # Built files (generated)
```

## Authentication

The plugin uses magic link authentication via Supabase. Users enter their email and receive a secure link to sign in.

## Credits & Billing

- **3 free credits** for new users
- **Starter Pack**: $7.50 for 50 credits ($0.15/generation)
- **Pro Pack**: $20.00 for 200 credits ($0.10/generation, 33% off)

Payments are handled securely via Stripe (opens in browser).

## License

Proprietary - ToyForge
