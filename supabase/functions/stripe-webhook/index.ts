import Stripe from 'https://esm.sh/stripe@17?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Webhook modtager kun POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2024-12-18.acacia',
  });

  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET mangler i env');
    return new Response('Server configuration error', { status: 500 });
  }

  // Verificér Stripe signature
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch (err) {
    console.error('Webhook signatur fejl:', (err as Error).message);
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  // Service role client — bypass RLS for at skrive til stripe_subscriptions
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, plan, interval = 'monthly' } = session.metadata ?? {};
        const subscriptionId = session.subscription as string;

        if (userId && plan && subscriptionId) {
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = (stripeSub as unknown as { current_period_end: number }).current_period_end;

          await supabaseAdmin
            .from('stripe_subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: stripeSub.items.data[0]?.price.id,
              plan,
              status: 'active',
              billing_interval: interval,
              current_period_end: new Date(periodEnd * 1000).toISOString(),
              cancel_at_period_end: false,
            }, { onConflict: 'user_id' });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription;
        const { userId, plan, interval = 'monthly' } = stripeSub.metadata ?? {};
        const periodEnd = (stripeSub as unknown as { current_period_end: number }).current_period_end;

        if (userId) {
          await supabaseAdmin
            .from('stripe_subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: stripeSub.customer as string,
              stripe_subscription_id: stripeSub.id,
              plan: plan || 'free',
              status: stripeSub.status,
              billing_interval: interval,
              current_period_end: new Date(periodEnd * 1000).toISOString(),
              cancel_at_period_end: stripeSub.cancel_at_period_end,
            }, { onConflict: 'user_id' });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription;

        await supabaseAdmin
          .from('stripe_subscriptions')
          .update({
            plan: 'free',
            status: 'canceled',
            billing_interval: 'monthly',
            cancel_at_period_end: false,
          })
          .eq('stripe_subscription_id', stripeSub.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        await supabaseAdmin
          .from('stripe_subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer as string);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response(JSON.stringify({ error: 'Webhook handler fejlede' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
