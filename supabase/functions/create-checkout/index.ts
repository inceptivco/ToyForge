import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^14.0.0";
import {
    handleCors,
    jsonResponse,
    errorResponse,
    extractBearerToken,
    authenticateWithToken,
    isAuthError,
    HTTP_STATUS,
} from '../_shared/index.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
    console.log(`[create-checkout] ${req.method} request received`);
    
    // Handle CORS preflight using shared utility
    const corsResponse = handleCors(req);
    if (corsResponse) {
        console.log('[create-checkout] OPTIONS request, returning CORS headers');
        return corsResponse;
    }

    try {
        console.log('[create-checkout] Starting checkout session creation');
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Authenticate User using shared utility
        const token = extractBearerToken(req);
        if (!token) {
            console.error('[create-checkout] Missing Authorization header');
            return errorResponse('Missing Authorization header', HTTP_STATUS.UNAUTHORIZED);
        }

        const authResult = await authenticateWithToken(token, supabase);
        if (isAuthError(authResult)) {
            console.error('[create-checkout] Authentication failed:', authResult.message);
            return errorResponse(authResult.message, authResult.statusCode);
        }
        
        const { userId } = authResult;
        console.log(`[create-checkout] User authenticated: ${userId}`);

        // 2. Parse Request
        const body = await req.json();
        console.log('[create-checkout] Request body:', JSON.stringify(body));
        const { amount, packId, type = 'app' } = body;

        let priceAmount = 0;
        let credits = 0;
        let productName = '';

        // Pricing Logic
        
        // 1. Custom Amount (API or flexible App purchase)
        if (amount) {
            const numAmount = parseFloat(amount);
            if (numAmount < 5) {
                throw new Error('Minimum purchase amount is $5.00');
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
        // Get origin from Referer header or Origin header, fallback to a default
        const referer = req.headers.get('referer') || req.headers.get('origin') || '';
        let baseUrl = referer;
        
        // If referer includes a path, extract just the origin
        if (referer) {
            try {
                const url = new URL(referer);
                baseUrl = `${url.protocol}//${url.host}`;
            } catch {
                // If URL parsing fails, use as-is
                baseUrl = referer.replace(/\/[^/]*$/, ''); // Remove path if present
            }
        }
        
        // Ensure we have a valid base URL
        if (!baseUrl || baseUrl === '') {
            baseUrl = 'http://localhost:3000'; // Fallback for local development
        }

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
                            images: ['https://characterforge.app/assets/logo.png'],
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
            client_reference_id: userId,
            metadata: {
                credits: credits.toString(),
                user_id: userId,
                credit_type: type, // Important for webhook to know which balance to update
            },
        });

        console.log(`[create-checkout] Stripe session created: ${session.id}, URL: ${session.url}`);

        return jsonResponse({ url: session.url });

    } catch (error: any) {
        console.error('[create-checkout] Error:', error);
        console.error('[create-checkout] Error stack:', error.stack);
        return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
});
