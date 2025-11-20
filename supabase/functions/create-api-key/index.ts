
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.200.0/crypto/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT',
};

serve(async (req) => {
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

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        // 2. Parse Request
        const { label } = await req.json();

        // 3. Generate Key
        // Format: sk_toyforge_[random_32_hex]
        const randomBytes = new Uint8Array(24);
        crypto.getRandomValues(randomBytes);
        const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const apiKey = `sk_toyforge_${randomHex}`;

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
                label: label || 'Untitled Key',
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
