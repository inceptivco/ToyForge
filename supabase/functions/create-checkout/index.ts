import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^14.0.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Authenticate User
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        // 2. Parse Request
        const { packId, type = 'app' } = await req.json();

        let priceAmount = 0;
        let credits = 0;
        let productName = '';

        // Pricing Logic
        // App Credits: Starter $5 (50), Pro $15 (200)
        // API Credits: Starter $5 (50), Pro $20 (200) -> $0.10/call

        if (packId === 'starter') {
            priceAmount = type === 'api' ? 649 : 749; // API: $6.49, App: $7.49
            credits = 50;
            productName = type === 'api'
                ? 'CharacterForge API Starter (50 Calls)'
                : 'CharacterForge Starter Pack (50 Credits)';
        } else if (packId === 'pro') {
            priceAmount = type === 'api' ? 2000 : 2500; // API: $20.00, App: $25.00
            credits = 200;
            productName = type === 'api'
                ? 'CharacterForge API Pro (200 Calls)'
                : 'CharacterForge Pro Pack (200 Credits)';
        } else {
            throw new Error('Invalid pack ID');
        }

        // 3. Create Checkout Session
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
                ? `${req.headers.get('origin')}/developer/billing?success=true`
                : `${req.headers.get('origin')}/app?success=true`,
            cancel_url: type === 'api'
                ? `${req.headers.get('origin')}/developer/billing?canceled=true`
                : `${req.headers.get('origin')}/app?canceled=true`,
            client_reference_id: user.id,
            metadata: {
                credits: credits.toString(),
                user_id: user.id,
                credit_type: type, // Important for webhook to know which balance to update
            },
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
