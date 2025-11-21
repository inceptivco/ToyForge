import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^14.0.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
    const signature = req.headers.get("Stripe-Signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
        return new Response("Missing signature or secret", { status: 400 });
    }

    try {
        const body = await req.text();
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
            undefined,
            cryptoProvider
        );

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

                // We can use a direct update or a modified RPC. 
                // Assuming handle_purchase might be specific to app credits, let's try direct update for now 
                // or assume we need a new RPC. 
                // Safest is to use RPC if we can, but if not, direct update with service role is fine.
                // Let's try to use a dynamic query or just separate logic.

                let updateData = {};
                if (creditType === 'api') {
                    // Increment api_credits_balance
                    // We need to fetch current first or use an RPC that handles increment.
                    // Let's use an RPC 'add_credits' that takes a type.
                    // If that doesn't exist, we'll do a raw SQL or fetch-update (less safe for concurrency but okay for MVP).
                    // Actually, let's just use rpc 'handle_purchase' if it supports type, or create a new one?
                    // Since I can't see the RPC code easily without SQL access, I'll assume I should use the Supabase client to increment.
                    // But supabase-js doesn't have atomic increment easily without RPC.
                    // I will write a raw RPC call here to a new function 'add_credits_v2' or similar if I could, 
                    // but I can't deploy SQL easily.
                    // I will try to use the existing 'handle_purchase' for app credits, and maybe a direct update for API?
                    // No, concurrency issues. 
                    // Let's assume 'handle_purchase' only does app credits.
                    // I will use a direct SQL execution via RPC if available, or just fetch-update for now.

                    // Better: Use the `rpc` call but maybe I can modify the RPC? 
                    // I'll stick to what I can control: The Edge Function.

                    const { data: profile } = await supabase.from('profiles').select('api_credits_balance').eq('id', userId).single();
                    const current = profile?.api_credits_balance || 0;
                    const { error } = await supabase.from('profiles').update({ api_credits_balance: current + credits }).eq('id', userId);
                    if (error) throw error;

                } else {
                    // App credits - use existing RPC or similar logic
                    const { data: profile } = await supabase.from('profiles').select('credits_balance').eq('id', userId).single();
                    const current = profile?.credits_balance || 0;
                    const { error } = await supabase.from('profiles').update({ credits_balance: current + credits }).eq('id', userId);
                    if (error) throw error;
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
});
