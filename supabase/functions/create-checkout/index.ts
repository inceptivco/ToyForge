import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^14.0.0";

// SECURITY: Validate Stripe key exists before initializing
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
    console.error('[create-checkout] FATAL: Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
}) : null;

// SECURITY: Allowed origins for CORS - only allow requests from known origins
const ALLOWED_ORIGINS = [
    'https://charactersmith.xyz',
    'https://www.charactersmith.xyz',
    'https://app.charactersmith.xyz',
    'http://localhost:3000',
    'http://localhost:5173',
] as const;

// SECURITY: Allowed base URLs for redirect (prevents open redirect attacks)
const ALLOWED_REDIRECT_URLS = [
    'https://charactersmith.xyz',
    'https://www.charactersmith.xyz',
    'https://app.charactersmith.xyz',
    'http://localhost:3000',
    'http://localhost:5173',
] as const;

// SECURITY: Input validation constants
const MIN_PURCHASE_AMOUNT = 5;
const MAX_PURCHASE_AMOUNT = 10000; // $10,000 max per transaction
const VALID_CREDIT_TYPES = ['api', 'app'] as const;

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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
    };
}

// Legacy static headers
const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * SECURITY: Validate and get allowed redirect base URL
 * Prevents open redirect attacks by only allowing known URLs
 */
function getValidBaseUrl(req: Request): string {
    const referer = req.headers.get('referer') || req.headers.get('origin') || '';

    if (referer) {
        try {
            const url = new URL(referer);
            const originUrl = `${url.protocol}//${url.host}`;

            // Only allow whitelisted URLs
            if (ALLOWED_REDIRECT_URLS.includes(originUrl as typeof ALLOWED_REDIRECT_URLS[number])) {
                return originUrl;
            }
        } catch {
            // Invalid URL, use default
        }
    }

    // Safe default - primary production URL
    return ALLOWED_REDIRECT_URLS[0];
}

serve(async (req) => {
    const dynamicCorsHeaders = getCorsHeaders(req);
    console.log(`[create-checkout] ${req.method} request received`);

    if (req.method === 'OPTIONS') {
        console.log('[create-checkout] OPTIONS request, returning CORS headers');
        return new Response('ok', { headers: dynamicCorsHeaders });
    }

    try {
        // SECURITY: Check Stripe is initialized
        if (!stripe) {
            console.error('[create-checkout] Stripe not initialized - missing API key');
            return new Response(JSON.stringify({ error: 'Payment service unavailable' }), {
                status: 503,
                headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log('[create-checkout] Starting checkout session creation');

        // 1. Authenticate User
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error('[create-checkout] Missing Authorization header');
            throw new Error('Missing Authorization header');
        }

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('[create-checkout] Authentication failed:', error?.message || 'No user');
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log(`[create-checkout] User authenticated: ${user.id}`);

        // 2. Parse Request
        const body = await req.json();
        console.log('[create-checkout] Request body:', JSON.stringify(body));
        const { amount, packId, type = 'app' } = body;

        // SECURITY: Validate credit type
        if (!VALID_CREDIT_TYPES.includes(type as typeof VALID_CREDIT_TYPES[number])) {
            throw new Error('Invalid credit type. Must be "api" or "app".');
        }

        let priceAmount = 0;
        let credits = 0;
        let productName = '';

        // Pricing Logic

        // 1. Custom Amount (API or flexible App purchase)
        if (amount) {
            const numAmount = parseFloat(amount);

            // SECURITY: Validate amount is a valid number
            if (isNaN(numAmount) || !isFinite(numAmount)) {
                throw new Error('Invalid amount. Please provide a valid number.');
            }

            // SECURITY: Validate amount is within acceptable range
            if (numAmount < MIN_PURCHASE_AMOUNT) {
                throw new Error(`Minimum purchase amount is $${MIN_PURCHASE_AMOUNT}.00`);
            }
            if (numAmount > MAX_PURCHASE_AMOUNT) {
                throw new Error(`Maximum purchase amount is $${MAX_PURCHASE_AMOUNT.toLocaleString()}.00`);
            }

            // Stripe expects amount in cents
            priceAmount = Math.round(numAmount * 100);

            // Calculate credits based on rate
            const rate = type === 'api' ? 0.10 : 0.15;
            credits = Math.floor(numAmount / rate);

            productName = type === 'api'
                ? `CharacterForge API Credits ($${numAmount.toFixed(2)})`
                : `CharacterForge App Credits ($${numAmount.toFixed(2)})`;
        
        // 2. Predefined Packs (Standard App purchase)
        } else if (packId) {
            if (packId === 'starter') {
                // App Starter: $7.50 for 50 credits ($0.15/gen)
                // API Starter (if used): $5.00 for 50 credits ($0.10/gen)
                priceAmount = type === 'api' ? 500 : 750; 
                credits = 50;
                productName = type === 'api'
                    ? 'CharacterForge API Starter (50 Calls)'
                    : 'CharacterForge Starter Pack (50 Credits)';
            } else if (packId === 'pro') {
                // Pro: $20.00 for 200 credits ($0.10/gen)
                priceAmount = 2000; 
                credits = 200;
                productName = type === 'api'
                    ? 'CharacterForge API Pro (200 Calls)'
                    : 'CharacterForge Pro Pack (200 Credits)';
            } else {
                throw new Error('Invalid pack ID');
            }
        } else {
            throw new Error('Either amount or packId is required');
        }

        // 3. Create Checkout Session
        // SECURITY: Use validated base URL to prevent open redirect attacks
        const baseUrl = getValidBaseUrl(req);

        console.log(`[create-checkout] Creating Stripe session: ${credits} credits, $${(priceAmount / 100).toFixed(2)}, type: ${type}`);
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: productName,
                            description: `${credits} ${type === 'api' ? 'API calls' : 'image generations'}`,
                            images: ['https://charactersmith.xyz/assets/logo.png'],
                        },
                        unit_amount: priceAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: type === 'api'
                ? `${baseUrl}/developer/billing?success=true`
                : `${baseUrl}/app?success=true`,
            cancel_url: type === 'api'
                ? `${baseUrl}/developer/billing?canceled=true`
                : `${baseUrl}/app?canceled=true`,
            client_reference_id: user.id,
            metadata: {
                credits: credits.toString(),
                user_id: user.id,
                credit_type: type, // Important for webhook to know which balance to update
            },
        });

        console.log(`[create-checkout] Stripe session created: ${session.id}, URL: ${session.url}`);

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('[create-checkout] Error:', errorMessage);
        if (errorStack) console.error('[create-checkout] Error stack:', errorStack);
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 400,
            headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
