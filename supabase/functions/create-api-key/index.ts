import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.200.0/crypto/mod.ts";
import {
    handleCors,
    jsonResponse,
    errorResponse,
    extractBearerToken,
    authenticateWithToken,
    isAuthError,
    sha256Hash,
    HTTP_STATUS,
} from '../_shared/index.ts';

serve(async (req) => {
    // Handle CORS preflight using shared utility
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Authenticate User using shared utility
        const token = extractBearerToken(req);
        if (!token) {
            return errorResponse('Missing Authorization header', HTTP_STATUS.UNAUTHORIZED);
        }

        const authResult = await authenticateWithToken(token, supabase);
        if (isAuthError(authResult)) {
            return errorResponse(authResult.message, authResult.statusCode);
        }
        
        const { userId } = authResult;

        // 2. Parse Request
        const { label } = await req.json();

        // 3. Generate Key
        // Format: sk_characterforge_[random_32_hex]
        const randomBytes = new Uint8Array(24);
        crypto.getRandomValues(randomBytes);
        const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const apiKey = `sk_characterforge_${randomHex}`;

        // 4. Hash Key using shared utility
        const keyHash = await sha256Hash(apiKey);

        // 5. Store Hash in DB
        const { data: insertedKey, error } = await supabase
            .from('api_keys')
            .insert({
                user_id: userId,
                label: label || 'Untitled Key',
                key_hash: keyHash,
            })
            .select()
            .single();

        if (error) throw error;

        // 6. Return Raw Key (ONCE) using shared response builder
        return jsonResponse({
            id: insertedKey.id,
            label: insertedKey.label,
            apiKey: apiKey, // Only time this is shown
            created_at: insertedKey.created_at
        });

    } catch (error: any) {
        return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
});
