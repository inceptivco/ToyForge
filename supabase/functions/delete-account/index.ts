import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// SECURITY: Allowed origins for CORS - only allow requests from known origins
const ALLOWED_ORIGINS = [
    'https://characterforge.app',
    'https://www.characterforge.app',
    'https://app.characterforge.app',
    'http://localhost:3000',
    'http://localhost:5173',
] as const;

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
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
    };
}

serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        // Use service key to bypass RLS and access admin functions
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Authenticate User
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        // SECURITY: Log the deletion attempt for audit purposes
        console.log(`[delete-account] User ${user.id} requested account deletion`);

        // 2. Delete User - only delete the authenticated user's own account
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

        if (deleteError) throw deleteError;

        console.log(`[delete-account] Successfully deleted account for user ${user.id}`);

        return new Response(JSON.stringify({ message: 'Account deleted successfully' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[delete-account] Error:', errorMessage);
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
