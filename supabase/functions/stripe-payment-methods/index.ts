/**
 * stripe-payment-methods — Hent og slet gemte betalingsmetoder.
 *
 * GET:    Returnerer liste af gemte betalingsmetoder
 * DELETE: body { paymentMethodId: string } — Fjerner en betalingsmetode
 */
import Stripe from 'https://esm.sh/stripe@17?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
      return new Response(JSON.stringify({ paymentMethods: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const customerId = existingSub.stripe_customer_id;

    // ─── DELETE: Fjern betalingsmetode ───
    if (req.method === 'DELETE' || req.method === 'POST') {
      const body = await req.json().catch(() => ({}));

      if (body.action === 'delete' || req.method === 'DELETE') {
        const { paymentMethodId } = body;
        if (!paymentMethodId) {
          return new Response(JSON.stringify({ error: 'paymentMethodId mangler' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verificér at betalingsmetoden tilhører denne kunde
        const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (pm.customer !== customerId) {
          return new Response(JSON.stringify({ error: 'Betalingsmetode tilhører ikke denne bruger' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await stripe.paymentMethods.detach(paymentMethodId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // POST without action = list (fallback for clients that don't support GET with body)
    }

    // ─── LIST: Hent alle betalingsmetoder ───
    const [cards, mobilepay, paypal] = await Promise.all([
      stripe.paymentMethods.list({ customer: customerId, type: 'card' }),
      stripe.paymentMethods.list({ customer: customerId, type: 'mobilepay' }).catch(() => ({ data: [] })),
      stripe.paymentMethods.list({ customer: customerId, type: 'paypal' }).catch(() => ({ data: [] })),
    ]);

    const paymentMethods = [
      ...cards.data.map((pm) => ({
        id: pm.id,
        type: 'card' as const,
        brand: pm.card?.brand || 'unknown',
        last4: pm.card?.last4 || '****',
        expMonth: pm.card?.exp_month,
        expYear: pm.card?.exp_year,
        isApplePay: pm.card?.wallet?.type === 'apple_pay',
      })),
      ...mobilepay.data.map((pm) => ({
        id: pm.id,
        type: 'mobilepay' as const,
        brand: 'mobilepay',
        last4: '',
        expMonth: null,
        expYear: null,
        isApplePay: false,
      })),
      ...paypal.data.map((pm) => ({
        id: pm.id,
        type: 'paypal' as const,
        brand: 'paypal',
        last4: (pm as any).paypal?.payer_email || '',
        expMonth: null,
        expYear: null,
        isApplePay: false,
      })),
    ];

    return new Response(JSON.stringify({ paymentMethods }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('stripe-payment-methods error:', err);
    const detail = err instanceof Error ? err.message : 'Ukendt fejl';
    return new Response(JSON.stringify({ error: `Fejl: ${detail}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
