/**
 * stripe-charge — Opretter en PaymentIntent for at trække rigtige penge.
 *
 * POST body:
 *   { amount: number, currency?: string, paymentMethodId: string, description?: string }
 *
 * amount er i DKK øre (fx 5000 = 50,00 kr)
 * Returnerer: { clientSecret: string, paymentIntentId: string, status: string }
 */
import Stripe from 'https://esm.sh/stripe@17?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Manglende authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Ikke logget ind' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { amount, currency = 'dkk', paymentMethodId, description } = await req.json();

    // Validering
    if (!amount || typeof amount !== 'number' || amount < 100) {
      return new Response(JSON.stringify({ error: 'Ugyldigt beløb (min. 100 øre = 1,00 kr)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!paymentMethodId) {
      return new Response(JSON.stringify({ error: 'paymentMethodId mangler' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia',
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Hent customer ID
    const { data: existingSub } = await supabaseAdmin
      .from('stripe_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!existingSub?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'Ingen Stripe-kunde fundet. Tilføj en betalingsmetode først.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificér at betalingsmetoden tilhører denne kunde
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.customer !== existingSub.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'Betalingsmetode tilhører ikke denne bruger' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Opret PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: existingSub.stripe_customer_id,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      description: description || 'Huska betaling',
      metadata: {
        userId: user.id,
      },
    });

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('stripe-charge error:', err);
    const detail = err instanceof Error ? err.message : 'Ukendt fejl';
    return new Response(JSON.stringify({ error: `Betaling fejlede: ${detail}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
