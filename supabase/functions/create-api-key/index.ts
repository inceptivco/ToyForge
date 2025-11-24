import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.200.0/crypto/mod.ts";

// SECURITY: Allowed origins for CORS - only allow requests from known origins
const ALLOWED_ORIGINS = [
    'https://charactersmith.xyz',
    'https://www.charactersmith.xyz',
    'https://app.charactersmith.xyz',
    'http://localhost:3000',
    'http://localhost:5173',
] as const;

// SECURITY: Input validation constants
const MAX_LABEL_LENGTH = 100;
const LABEL_REGEX = /^[a-zA-Z0-9\s\-_.]+$/;

function getAllowedOrigin(requestOrigin: string | null): string {
    if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin as typeof ALLOWED_ORIGINS[number])) {
        return requestOrigin;
    }
    return ALLOWED_ORIGINS[0];
}

function getCorsHeaders(req: Request): Record<string, string> {
    const origin = req.headers.get('origin');
    return {
        'Access-Control-Allow-Origin': getAllowedOrigin(origin),
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
    };
}

/**
 * SECURITY: Validate API key label
 */
function validateLabel(label: unknown): string {
    if (label === undefined || label === null || label === '') {
        return 'Untitled Key';
    }

    if (typeof label !== 'string') {
        throw new Error('Label must be a string');
    }

    const trimmed = label.trim();
    if (trimmed.length > MAX_LABEL_LENGTH) {
        throw new Error(`Label must be ${MAX_LABEL_LENGTH} characters or less`);
    }

    if (trimmed.length > 0 && !LABEL_REGEX.test(trimmed)) {
        throw new Error('Label can only contain letters, numbers, spaces, hyphens, underscores, and periods');
    }

    return trimmed || 'Untitled Key';
}

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Authenticate User
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        // 2. Parse Request with validation
        const body = await req.json();
        const validatedLabel = validateLabel(body.label);

        // 3. Generate Key
        // Format: sk_characterforge_[random_32_hex]
        const randomBytes = new Uint8Array(24);
        crypto.getRandomValues(randomBytes);
        const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const apiKey = `sk_characterforge_${randomHex}`;

        // 4. Hash Key
        const encoder = new TextEncoder();
        const encodedKey = encoder.encode(apiKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encodedKey);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // 5. Store Hash in DB
        const { data: insertedKey, error } = await supabase
            .from('api_keys')
            .insert({
                user_id: user.id,
                label: validatedLabel,
                key_hash: keyHash,
            })
            .select()
            .single();

        if (error) throw error;

        // 6. Return Raw Key (ONCE)
        return new Response(JSON.stringify({
            id: insertedKey.id,
            label: insertedKey.label,
            apiKey: apiKey, // Only time this is shown
            created_at: insertedKey.created_at
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
