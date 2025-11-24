import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
    handleCors,
    jsonResponse,
    errorResponse,
    extractBearerToken,
    authenticateWithToken,
    isAuthError,
    HTTP_STATUS,
} from '../_shared/index.ts';

serve(async (req) => {
    // Handle CORS preflight using shared utility
    const corsResponse = handleCors(req);
    if (corsResponse) return corsResponse;

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        // Use service key to bypass RLS and access admin functions
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

        // 2. Delete User
        const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

        if (deleteError) throw deleteError;

        return jsonResponse({ message: 'Account deleted successfully' });

    } catch (error: any) {
        console.error(error);
        return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
});
