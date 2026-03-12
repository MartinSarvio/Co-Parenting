import Stripe from 'https://esm.sh/stripe@17?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type PaidPlan = 'family_plus' | 'single_parent_plus';
type BillingInterval = 'monthly' | 'annual';

function getPriceId(plan: PaidPlan, interval: BillingInterval): string | undefined {
  const map: Record<PaidPlan, Record<BillingInterval, string | undefined>> = {
    family_plus: {
      monthly: Deno.env.get('STRIPE_PRICE_FAMILY_PLUS_MONTHLY'),
      annual: Deno.env.get('STRIPE_PRICE_FAMILY_PLUS_ANNUAL'),
    },
    single_parent_plus: {
      monthly: Deno.env.get('STRIPE_PRICE_SINGLE_PARENT_PLUS_MONTHLY'),
      annual: Deno.env.get('STRIPE_PRICE_SINGLE_PARENT_PLUS_ANNUAL'),
    },
  };
  return map[plan]?.[interval];
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth — hent bruger fra JWT
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

    const { plan, interval = 'monthly' } = await req.json();

    const validPlans: PaidPlan[] = ['family_plus', 'single_parent_plus'];
    const validIntervals: BillingInterval[] = ['monthly', 'annual'];

    if (!validPlans.includes(plan) || !validIntervals.includes(interval)) {
      return new Response(JSON.stringify({ error: 'Ugyldigt abonnementsplan eller interval' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const priceId = getPriceId(plan, interval);
    if (!priceId) {
      return new Response(JSON.stringify({ error: `Stripe price ID mangler for ${plan} ${interval}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Hent profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia',
    });

    // Service role client til stripe_subscriptions (bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Hent eller opret Stripe customer
    const { data: existingSub } = await supabaseAdmin
      .from('stripe_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId: string;

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
    }

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/settings?tab=subscription&stripe=success`,
      cancel_url: `${frontendUrl}/settings?tab=subscription&stripe=cancel`,
      metadata: { userId: user.id, plan, interval },
      subscription_data: {
        metadata: { userId: user.id, plan, interval },
      },
    });

    // Gem customer ID med det samme (plan forbliver 'free' indtil webhook bekræfter)
    await supabaseAdmin
      .from('stripe_subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan: 'free',
        status: 'inactive',
        billing_interval: interval,
      }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    const detail = err instanceof Error ? err.message : 'Ukendt fejl';
    return new Response(JSON.stringify({ error: `Kunne ikke oprette betalingssession: ${detail}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
