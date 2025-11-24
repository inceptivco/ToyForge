import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^14.0.0";

// SECURITY: Validate Stripe key exists before initializing
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
    console.error('[stripe-webhook] FATAL: Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
}) : null;

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
    console.log('[stripe-webhook] Request received');

    // SECURITY: Check Stripe is initialized
    if (!stripe) {
        console.error('[stripe-webhook] Stripe not initialized - missing API key');
        return new Response("Stripe service unavailable", { status: 503 });
    }

    const signature = req.headers.get("Stripe-Signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
        console.error('[stripe-webhook] Missing signature or secret');
        return new Response("Missing signature or secret", { status: 400 });
    }

    try {
        const body = await req.text();
        console.log('[stripe-webhook] Constructing event from body');
        
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
            undefined,
            cryptoProvider
        );

        console.log(`[stripe-webhook] Event type: ${event.type}, ID: ${event.id}`);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.client_reference_id;
            const credits = parseInt(session.metadata?.credits || '0');
            const creditType = session.metadata?.credit_type || 'app'; // 'app' or 'api'

            if (userId && credits > 0) {
                const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
                const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
                const supabase = createClient(supabaseUrl, supabaseServiceKey);

                console.log(`Adding ${credits} ${creditType} credits to user ${userId}`);

                // Use the new RPC function that handles both credit types atomically
                const { data, error } = await supabase.rpc('handle_purchase_v2', {
                    p_user_id: userId,
                    p_amount: credits,
                    p_ref_id: session.id, // Use session ID as reference for idempotency
                    p_credit_type: creditType
                });

                if (error) {
                    console.error('Error adding credits:', error);
                    throw error;
                }

                console.log(`Successfully added ${credits} ${creditType} credits to user ${userId}`);
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error(`[stripe-webhook] Error: ${err.message}`);
        console.error(`[stripe-webhook] Error stack: ${err.stack}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
});
