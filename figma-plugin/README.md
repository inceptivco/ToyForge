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

The plugin uses magic link authentication via Supabase with a polling-based session transfer:

1. User enters email in the plugin
2. Plugin generates a unique auth code and sends the magic link
3. User clicks the magic link → redirected to the ToyForge web app
4. Web app stores the session tokens in the `figma_auth_codes` database table
5. Plugin polls the database and retrieves the tokens to establish the session

### Database Setup

Before using the plugin, run the migration in `supabase/migrations/figma_auth_codes.sql` to create the required table:

```sql
-- Run this in your Supabase SQL editor
CREATE TABLE IF NOT EXISTS public.figma_auth_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code varchar(10) UNIQUE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
    used boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS and policies (see full migration file for details)
```

## Credits & Billing

- **3 free credits** for new users
- **Starter Pack**: $7.50 for 50 credits ($0.15/generation)
- **Pro Pack**: $20.00 for 200 credits ($0.10/generation, 33% off)

Payments are handled securely via Stripe (opens in browser).

## License

Proprietary - ToyForge
